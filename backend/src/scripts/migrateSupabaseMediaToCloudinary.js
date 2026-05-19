import "dotenv/config";

process.env.MEDIA_STORAGE_DRIVER = "cloudinary";

import sharp from "sharp";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { extractSupabasePublicObjectPath } from "../lib/storage.js";
import {
  extractCloudinaryPublicObjectPath,
  getSupabasePublicUrl,
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
const CLOUDINARY_FREE_IMAGE_LIMIT_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_IMAGE_TARGET_BYTES = 9 * 1024 * 1024;

const IMAGE_JOBS = [
  {
    table: "artworks",
    supabaseBucketName: "artworks",
    cloudinaryPrefix: "artworks",
  },
  {
    table: "prints",
    supabaseBucketName: "artworks",
    cloudinaryPrefix: "artworks",
  },
  {
    table: "hero_carousel_images",
    supabaseBucketName: "artworks",
    cloudinaryPrefix: "artworks",
  },
  {
    table: "workshops",
    supabaseBucketName: "workshop-image",
    cloudinaryPrefix: "workshop-image",
  },
];

const VIDEO_JOBS = [
  {
    table: "workshops",
    column: "video_url",
    supabaseBucketName: "workshop-videos",
    cloudinaryPrefix: "workshop-videos",
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

async function fitImageForCloudinary(buffer, contentType) {
  if (
    !contentType?.startsWith("image/") ||
    buffer.length < CLOUDINARY_FREE_IMAGE_LIMIT_BYTES
  ) {
    return { buffer, contentType };
  }

  const attempts = [
    { maxDimension: 1800, quality: 82 },
    { maxDimension: 1800, quality: 72 },
    { maxDimension: 1600, quality: 68 },
    { maxDimension: 1400, quality: 64 },
    { maxDimension: 1200, quality: 58 },
  ];

  let smallest = null;

  for (const attempt of attempts) {
    const nextBuffer = await sharp(buffer, {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: attempt.maxDimension,
        height: attempt.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: attempt.quality,
        effort: 5,
      })
      .toBuffer();

    if (!smallest || nextBuffer.length < smallest.length) {
      smallest = nextBuffer;
    }

    if (nextBuffer.length <= CLOUDINARY_IMAGE_TARGET_BYTES) {
      return { buffer: nextBuffer, contentType: "image/webp" };
    }
  }

  return {
    buffer: smallest || buffer,
    contentType: smallest ? "image/webp" : contentType,
  };
}

function plannedCloudinaryUrl(cloudinaryPrefix, objectPath, contentType) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "cloud-name";
  const resourceType = contentType?.startsWith("video/") ? "video" : "image";
  const publicId = `${cloudinaryPrefix}/${objectPath}`.replace(/\.[^/.]+$/, "");

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
}

async function uploadSupabaseUrlToCloudinary({
  sourceUrl,
  supabaseBucketName,
  cloudinaryPrefix,
  uploadedByUrl,
}) {
  if (
    !sourceUrl ||
    extractCloudinaryPublicObjectPath(sourceUrl, cloudinaryPrefix)
  ) {
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
    const plannedUrl = plannedCloudinaryUrl(
      cloudinaryPrefix,
      objectPath,
      inferContentType(sourceUrl),
    );
    uploadedByUrl.set(sourceUrl, plannedUrl);
    return { url: plannedUrl, changed: true };
  }

  const downloaded = await downloadMedia(sourceUrl);
  const { buffer, contentType } = await fitImageForCloudinary(
    downloaded.buffer,
    downloaded.contentType,
  );
  const uploaded = await uploadPublicMediaObject({
    supabase,
    bucketName: cloudinaryPrefix,
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

    const imageResult = await uploadSupabaseUrlToCloudinary({
      sourceUrl: row.image_url,
      supabaseBucketName: job.supabaseBucketName,
      cloudinaryPrefix: job.cloudinaryPrefix,
      uploadedByUrl,
    });

    const nextVariants = row.image_variants
      ? { ...row.image_variants }
      : row.image_variants;
    let changed = imageResult.changed;

    if (nextVariants && typeof nextVariants === "object") {
      for (const [key, sourceUrl] of Object.entries(nextVariants)) {
        const variantResult = await uploadSupabaseUrlToCloudinary({
          sourceUrl,
          supabaseBucketName: job.supabaseBucketName,
          cloudinaryPrefix: job.cloudinaryPrefix,
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
      `${dryRun ? "[dry-run] " : ""}${job.table}#${row.id}: migrate image URLs to Cloudinary`,
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

    const result = await uploadSupabaseUrlToCloudinary({
      sourceUrl: row[job.column],
      supabaseBucketName: job.supabaseBucketName,
      cloudinaryPrefix: job.cloudinaryPrefix,
      uploadedByUrl,
    });

    if (!result.changed) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}${job.table}#${row.id}: migrate ${job.column} to Cloudinary`,
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

async function migrateCourseVideo(uploadedByUrl) {
  if (!shouldProcessTable("course_page")) return 0;

  const rows = await sql`
    SELECT id, video_path
    FROM course_page
    WHERE video_path IS NOT NULL
  `;
  let changedCount = 0;

  for (const row of rows) {
    if (/^https?:\/\/res\.cloudinary\.com\//i.test(row.video_path)) continue;

    const sourceUrl = /^https?:\/\//i.test(row.video_path)
      ? row.video_path
      : getSupabasePublicUrl(supabase, "course vids", row.video_path);
    const result = await uploadSupabaseUrlToCloudinary({
      sourceUrl,
      supabaseBucketName: "course vids",
      cloudinaryPrefix: "course-vids",
      uploadedByUrl,
    });

    if (!result.changed) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}course_page: migrate course video to Cloudinary`,
    );

    if (!dryRun) {
      await sql`
        UPDATE course_page
        SET video_path = ${result.url}
        WHERE id = ${row.id}
      `;
    }

    changedCount += 1;
  }

  return changedCount;
}

async function run() {
  if (selectedTable && !["course_page"].includes(selectedTable)) {
    const knownTables = [
      ...IMAGE_JOBS.map((job) => job.table),
      ...VIDEO_JOBS.map((job) => job.table),
    ];

    if (!knownTables.includes(selectedTable)) {
      throw new Error(`Unknown migration table: ${selectedTable}`);
    }
  }

  const uploadedByUrl = new Map();
  let totalChanged = 0;

  for (const job of IMAGE_JOBS) {
    totalChanged += await migrateImageJob(job, uploadedByUrl);
  }

  for (const job of VIDEO_JOBS) {
    totalChanged += await migrateVideoJob(job, uploadedByUrl);
  }

  totalChanged += await migrateCourseVideo(uploadedByUrl);

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
