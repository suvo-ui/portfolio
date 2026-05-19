import "dotenv/config";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { extractSupabasePublicObjectPath } from "../lib/storage.js";
import {
  extractConfiguredPublicObjectPath,
  getConfiguredPublicUrlForKey,
  getSupabasePublicUrl,
  isS3CompatibleMediaStorageEnabled,
  uploadPublicMediaObject,
} from "../lib/mediaStorage.js";

const CACHE_CONTROL_SECONDS = "31536000";
const selectedTable =
  process.env.MIGRATION_TABLE?.trim() || process.env.BACKFILL_TABLE?.trim();
const selectedId = process.env.MIGRATION_ID
  ? Number(process.env.MIGRATION_ID)
  : process.env.BACKFILL_ID
    ? Number(process.env.BACKFILL_ID)
    : null;
const limit = process.env.MIGRATION_LIMIT
  ? Number(process.env.MIGRATION_LIMIT)
  : process.env.BACKFILL_LIMIT
    ? Number(process.env.BACKFILL_LIMIT)
    : null;
const dryRun = process.env.DRY_RUN !== "0";

const IMAGE_JOBS = [
  {
    table: "artworks",
    supabaseBucketName: "artworks",
    mediaBucketPrefix: "artworks",
  },
  {
    table: "prints",
    supabaseBucketName: "artworks",
    mediaBucketPrefix: "artworks",
  },
  {
    table: "hero_carousel_images",
    supabaseBucketName: "artworks",
    mediaBucketPrefix: "artworks",
  },
  {
    table: "workshops",
    supabaseBucketName: "workshop-image",
    mediaBucketPrefix: "workshop-image",
  },
];

const VIDEO_JOBS = [
  {
    table: "workshops",
    column: "video_url",
    supabaseBucketName: "workshop-videos",
    mediaBucketPrefix: "workshop-videos",
  },
];

function inferContentType(url) {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".mp4") || pathname.endsWith(".m4v")) {
    return "video/mp4";
  }
  if (pathname.endsWith(".webm")) return "video/webm";

  return "application/octet-stream";
}

function toJsonb(value) {
  return value ? JSON.stringify(value) : null;
}

function shouldProcessId(row) {
  return !selectedId || Number(row.id) === selectedId;
}

function shouldProcessTable(table) {
  return !selectedTable || selectedTable === table;
}

function isAlreadyS3ProviderUrl(url, mediaBucketPrefix) {
  return Boolean(extractConfiguredPublicObjectPath(url, mediaBucketPrefix));
}

async function downloadMedia(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed for ${url} (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || inferContentType(url),
  };
}

async function uploadSupabaseUrlToS3Provider({
  sourceUrl,
  supabaseBucketName,
  mediaBucketPrefix,
  uploadedByUrl,
}) {
  if (!sourceUrl || isAlreadyS3ProviderUrl(sourceUrl, mediaBucketPrefix)) {
    return { url: sourceUrl, changed: false };
  }

  if (uploadedByUrl.has(sourceUrl)) {
    return { url: uploadedByUrl.get(sourceUrl), changed: true };
  }

  const objectPath = extractSupabasePublicObjectPath(
    sourceUrl,
    supabaseBucketName,
  );

  if (!objectPath) {
    console.warn(`Skipping non-Supabase URL: ${sourceUrl}`);
    return { url: sourceUrl, changed: false };
  }

  if (dryRun) {
    const plannedUrl = getConfiguredPublicUrlForKey(
      `${mediaBucketPrefix}/${objectPath}`,
    );
    uploadedByUrl.set(sourceUrl, plannedUrl);
    return { url: plannedUrl, changed: true };
  }

  const { buffer, contentType } = await downloadMedia(sourceUrl);
  const uploaded = await uploadPublicMediaObject({
    supabase,
    bucketName: mediaBucketPrefix,
    objectPath,
    buffer,
    contentType,
    cacheControl: CACHE_CONTROL_SECONDS,
    upsert: false,
  });

  uploadedByUrl.set(sourceUrl, uploaded.publicUrl);

  return { url: uploaded.publicUrl, changed: true };
}

async function migrateImageJob(job, uploadedByUrl) {
  if (!shouldProcessTable(job.table)) return 0;

  const rows = await sql`
    SELECT id, image_url, image_variants
    FROM ${sql(job.table)}
    WHERE image_url IS NOT NULL
    ORDER BY id ASC
  `;
  let changedCount = 0;

  for (const row of rows.filter(shouldProcessId)) {
    if (limit !== null && changedCount >= limit) return changedCount;

    const imageResult = await uploadSupabaseUrlToS3Provider({
      sourceUrl: row.image_url,
      supabaseBucketName: job.supabaseBucketName,
      mediaBucketPrefix: job.mediaBucketPrefix,
      uploadedByUrl,
    });

    const nextVariants = row.image_variants
      ? { ...row.image_variants }
      : row.image_variants;
    let changed = imageResult.changed;

    if (nextVariants && typeof nextVariants === "object") {
      for (const [key, sourceUrl] of Object.entries(nextVariants)) {
        const variantResult = await uploadSupabaseUrlToS3Provider({
          sourceUrl,
          supabaseBucketName: job.supabaseBucketName,
          mediaBucketPrefix: job.mediaBucketPrefix,
          uploadedByUrl,
        });

        if (variantResult.changed) {
          nextVariants[key] = variantResult.url;
          changed = true;
        }
      }
    }

    if (!changed) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}${job.table}#${row.id}: migrate image URLs`,
    );

    if (!dryRun) {
      await sql`
        UPDATE ${sql(job.table)}
        SET
          image_url = ${imageResult.url},
          image_variants = ${toJsonb(nextVariants)}::jsonb
        WHERE id = ${row.id}
      `;
    }

    changedCount += 1;
  }

  return changedCount;
}

async function migrateVideoJob(job, uploadedByUrl) {
  if (!shouldProcessTable(job.table)) return 0;

  const rows = await sql`
    SELECT id, ${sql(job.column)}
    FROM ${sql(job.table)}
    WHERE ${sql(job.column)} IS NOT NULL
    ORDER BY id ASC
  `;
  let changedCount = 0;

  for (const row of rows.filter(shouldProcessId)) {
    if (limit !== null && changedCount >= limit) return changedCount;

    const sourceUrl = row[job.column];
    const result = await uploadSupabaseUrlToS3Provider({
      sourceUrl,
      supabaseBucketName: job.supabaseBucketName,
      mediaBucketPrefix: job.mediaBucketPrefix,
      uploadedByUrl,
    });

    if (!result.changed) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}${job.table}#${row.id}: migrate ${job.column}`,
    );

    if (!dryRun) {
      await sql`
        UPDATE ${sql(job.table)}
        SET ${sql(job.column)} = ${result.url}
        WHERE id = ${row.id}
      `;
    }

    changedCount += 1;
  }

  return changedCount;
}

async function migrateCourseVideo() {
  if (!shouldProcessTable("course_page")) return 0;

  const rows = await sql`
    SELECT id, video_path
    FROM course_page
    WHERE video_path IS NOT NULL
  `;
  let changedCount = 0;

  for (const row of rows) {
    if (row.video_path.startsWith("course-vids/")) continue;

    const sourceUrl = /^https?:\/\//i.test(row.video_path)
      ? row.video_path
      : getSupabasePublicUrl(supabase, "course vids", row.video_path);
    const objectPath =
      extractSupabasePublicObjectPath(sourceUrl, "course vids") ||
      row.video_path;
    const targetKey = `course-vids/${objectPath}`;

    console.log(
      `${dryRun ? "[dry-run] " : ""}course_page: migrate course video`,
    );

    if (!dryRun) {
      const { buffer, contentType } = await downloadMedia(sourceUrl);
      const uploaded = await uploadPublicMediaObject({
        supabase,
        bucketName: "course-vids",
        objectPath,
        buffer,
        contentType,
        cacheControl: CACHE_CONTROL_SECONDS,
        upsert: false,
      });

      await sql`
        UPDATE course_page
        SET video_path = ${uploaded.objectKey}
        WHERE id = ${row.id}
      `;
    } else {
      console.log(`[dry-run] course_page target path: ${targetKey}`);
    }

    changedCount += 1;
  }

  return changedCount;
}

async function run() {
  if (!isS3CompatibleMediaStorageEnabled()) {
    throw new Error("Set MEDIA_STORAGE_DRIVER to b2 or r2 before migrating.");
  }

  if (
    selectedTable &&
    ![
      ...IMAGE_JOBS.map((job) => job.table),
      ...VIDEO_JOBS.map((job) => job.table),
      "course_page",
    ].includes(selectedTable)
  ) {
    throw new Error(`Unknown migration table: ${selectedTable}`);
  }

  const uploadedByUrl = new Map();
  let totalChanged = 0;

  for (const job of IMAGE_JOBS) {
    totalChanged += await migrateImageJob(job, uploadedByUrl);
  }

  for (const job of VIDEO_JOBS) {
    totalChanged += await migrateVideoJob(job, uploadedByUrl);
  }

  totalChanged += await migrateCourseVideo();

  console.log(
    `${dryRun ? "Dry run complete" : "Migration complete"}: ${totalChanged} row(s) ${dryRun ? "would be updated" : "updated"}.`,
  );
}

run()
  .then(async () => {
    await sql.end({ timeout: 5 });
  })
  .catch(async (error) => {
    await sql.end({ timeout: 5 });
    console.error(error);
    process.exit(1);
  });
