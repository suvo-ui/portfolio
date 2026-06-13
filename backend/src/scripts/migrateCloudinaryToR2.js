import "dotenv/config";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import {
  getImageVariantUrl,
  getPreferredImageVariantUrl,
} from "../lib/imageVariants.js";
import {
  uploadImageVariantsToStorage,
  buildStorageObjectPath,
} from "../lib/storage.js";
import { uploadPublicMediaObject } from "../lib/mediaStorage.js";

const dryRun = process.argv.includes("--dry-run");
const LOG_INTERVAL = 10;

const IMAGE_JOBS = [
  {
    table: "artworks",
    bucketName: "artworks",
    prefix: "artworks",
  },
  {
    table: "prints",
    bucketName: "artworks",
    prefix: "artworks",
  },
  {
    table: "hero_carousel_images",
    bucketName: "artworks",
    prefix: "artworks",
  },
  {
    table: "workshops",
    bucketName: "workshop-image",
    prefix: "images",
  },
];

const VIDEO_JOBS = [
  {
    table: "workshops",
    column: "video_url",
    bucketName: "workshop-videos",
    folder: "videos",
  },
];

const COURSE_VIDEO_BUCKET = "course-vids";
const COURSE_VIDEO_FOLDER = "course";

const summary = {
  migrated: 0,
  skipped: 0,
  failed: 0,
};

const failedRecords = [];

function isCloudinaryUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.hostname === "res.cloudinary.com" && url.pathname.includes("/upload/")
    );
  } catch {
    return false;
  }
}

function collectVariantUrls(variants) {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return [];
  }

  return ["thumb", "card", "large"]
    .map((key) => getImageVariantUrl(variants[key]))
    .filter(Boolean);
}

function hasCloudinaryReference(row) {
  if (isCloudinaryUrl(row.image_url)) return true;
  if (collectVariantUrls(row.image_variants).some(isCloudinaryUrl)) return true;
  if (isCloudinaryUrl(row.video_url)) return true;
  if (isCloudinaryUrl(row.video_path)) return true;
  return false;
}

async function downloadMedia(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed for ${url} (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType:
      response.headers.get("content-type") || "application/octet-stream",
  };
}

function hasCloudinaryImage(row) {
  if (isCloudinaryUrl(row.image_url)) return true;
  return collectVariantUrls(row.image_variants).some(isCloudinaryUrl);
}

function getFallbackImageUrl(row) {
  if (isCloudinaryUrl(row.image_url)) {
    return row.image_url;
  }

  const variantUrls = collectVariantUrls(row.image_variants);
  return variantUrls.find(isCloudinaryUrl) || null;
}

async function migrateImageRow(table, row, bucketName, prefix) {
  if (!hasCloudinaryImage(row)) {
    summary.skipped += 1;
    return;
  }

  const sourceUrl = getFallbackImageUrl(row);

  if (!sourceUrl) {
    summary.failed += 1;
    failedRecords.push({
      table,
      id: row.id,
      reason: "No Cloudinary image source found",
    });
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] ${table}#${row.id}: would download image from ${sourceUrl}`,
    );
    console.log(
      `[dry-run] ${table}#${row.id}: would upload optimized thumb/card/large variants to R2`,
    );
    console.log(
      `[dry-run] ${table}#${row.id}: would update image_url and image_variants`,
    );
    summary.skipped += 1;
    return;
  }

  const { buffer } = await downloadMedia(sourceUrl);
  const variants = await uploadImageVariantsToStorage({
    supabase,
    bucketName,
    prefix,
    sourceBuffer: buffer,
  });

  const imageUrl = getPreferredImageVariantUrl(variants, "large");

  if (!imageUrl) {
    throw new Error("Upload pipeline completed without a large image URL");
  }

  await sql`
    UPDATE ${sql(table)}
    SET
      image_url = ${imageUrl},
      image_variants = ${JSON.stringify(variants)}::jsonb
    WHERE id = ${row.id}
  `;

  summary.migrated += 1;
}

async function migrateVideoField(table, row, column, bucketName, folder) {
  const sourceUrl = row[column];

  if (!isCloudinaryUrl(sourceUrl)) {
    summary.skipped += 1;
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] ${table}#${row.id}: would download video from ${sourceUrl}`,
    );
    console.log(`[dry-run] ${table}#${row.id}: would upload video to R2`);
    console.log(`[dry-run] ${table}#${row.id}: would update ${column}`);
    summary.skipped += 1;
    return;
  }

  const { buffer, contentType } = await downloadMedia(sourceUrl);
  const extension = contentType?.split("/").pop() || "mp4";
  const objectPath = buildStorageObjectPath(folder, extension);
  const uploaded = await uploadPublicMediaObject({
    supabase,
    bucketName,
    objectPath,
    body: buffer,
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  await sql`
    UPDATE ${sql(table)}
    SET ${sql(column)} = ${uploaded.publicUrl}
    WHERE id = ${row.id}
  `;

  summary.migrated += 1;
}

async function migrateCoursePageRow(row) {
  if (!isCloudinaryUrl(row.video_path)) {
    summary.skipped += 1;
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] course_page: would download video from ${row.video_path}`,
    );
    console.log(`[dry-run] course_page: would upload video to R2`);
    console.log(`[dry-run] course_page: would update video_path`);
    summary.skipped += 1;
    return;
  }

  const { buffer, contentType } = await downloadMedia(row.video_path);
  const extension = contentType?.split("/").pop() || "mp4";
  const objectPath = buildStorageObjectPath(COURSE_VIDEO_FOLDER, extension);
  const uploaded = await uploadPublicMediaObject({
    supabase,
    bucketName: COURSE_VIDEO_BUCKET,
    objectPath,
    body: buffer,
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  await sql`
    UPDATE course_page
    SET video_path = ${uploaded.publicUrl}
    WHERE id = ${row.id}
  `;

  summary.migrated += 1;
}

async function processImageTable(job) {
  const rows = await sql`
    SELECT id, image_url, image_variants
    FROM ${sql(job.table)}
    ORDER BY id ASC
  `;

  let processed = 0;

  for (const row of rows) {
    try {
      await migrateImageRow(job.table, row, job.bucketName, job.prefix);
    } catch (error) {
      summary.failed += 1;
      failedRecords.push({
        table: job.table,
        id: row.id,
        reason: error.message,
      });
    }

    processed += 1;
    if (processed % LOG_INTERVAL === 0) {
      console.log(`${job.table}: processed ${processed} records`);
    }
  }
}

async function processVideoTable(job) {
  const rows = await sql`
    SELECT id, ${sql(job.column)}
    FROM ${sql(job.table)}
    ORDER BY id ASC
  `;

  let processed = 0;

  for (const row of rows) {
    try {
      await migrateVideoField(
        job.table,
        row,
        job.column,
        job.bucketName,
        job.folder,
      );
    } catch (error) {
      summary.failed += 1;
      failedRecords.push({
        table: job.table,
        id: row.id,
        reason: error.message,
      });
    }

    processed += 1;
    if (processed % LOG_INTERVAL === 0) {
      console.log(`${job.table}: processed ${processed} records`);
    }
  }
}

async function processCoursePage() {
  const rows = await sql`
    SELECT id, video_path
    FROM course_page
  `;

  for (const row of rows) {
    try {
      await migrateCoursePageRow(row);
    } catch (error) {
      summary.failed += 1;
      failedRecords.push({
        table: "course_page",
        id: row.id,
        reason: error.message,
      });
    }
  }
}

async function run() {
  if (process.env.MEDIA_STORAGE_DRIVER?.trim().toLowerCase() !== "r2") {
    throw new Error(
      "MEDIA_STORAGE_DRIVER must be set to r2 for migrateCloudinaryToR2.js",
    );
  }

  for (const job of IMAGE_JOBS) {
    await processImageTable(job);
  }

  for (const job of VIDEO_JOBS) {
    await processVideoTable(job);
  }

  await processCoursePage();

  console.log("\nMigration summary:");
  console.log(`  migrated: ${summary.migrated}`);
  console.log(`  skipped: ${summary.skipped}`);
  console.log(`  failed: ${summary.failed}`);

  if (failedRecords.length > 0) {
    console.log("\nFailed records:");
    for (const failure of failedRecords) {
      console.log(`  - ${failure.table}#${failure.id}: ${failure.reason}`);
    }
  }
}

run()
  .then(async () => {
    await sql.end({ timeout: 5 });
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end({ timeout: 5 });
    process.exit(1);
  });
