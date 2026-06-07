import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import sharp from "sharp";
import {
  IMAGE_VARIANT_KEYS,
  uploadImageVariantsToStorage,
} from "../lib/storage.js";
import {
  getImageVariantMetadata,
  getImageVariantUrl,
  hasCompleteImageVariantMetadata,
} from "../lib/imageVariants.js";

const JOBS = [
  {
    table: "artworks",
    bucketName: "artworks",
    prefix: "artworks/backfill",
  },
  {
    table: "prints",
    bucketName: "artworks",
    prefix: "artworks/backfill",
  },
  {
    table: "hero_carousel_images",
    bucketName: "artworks",
    prefix: "artworks/backfill",
  },
  {
    table: "workshops",
    bucketName: "workshop-image",
    prefix: "images/backfill",
  },
];

const selectedTable = process.env.BACKFILL_TABLE?.trim();
const selectedId = process.env.BACKFILL_ID
  ? Number(process.env.BACKFILL_ID)
  : null;
const limit = process.env.BACKFILL_LIMIT
  ? Number(process.env.BACKFILL_LIMIT)
  : null;
const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function probeImageVariant(url) {
  const buffer = await downloadImage(url);
  const metadata = await sharp(buffer).metadata();

  return {
    url,
    width: metadata.width,
    height: metadata.height,
    bytes: buffer.length,
  };
}

async function buildMetadataFromExistingVariants(variants) {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return null;
  }

  const urls = IMAGE_VARIANT_KEYS.map((key) =>
    getImageVariantUrl(variants[key]),
  );

  if (urls.some((url) => !url)) {
    return null;
  }

  const entries = await Promise.all(
    IMAGE_VARIANT_KEYS.map(async (key) => {
      const existingMetadata = getImageVariantMetadata(variants[key]);
      const url = getImageVariantUrl(variants[key]);

      if (
        existingMetadata?.url &&
        Number.isFinite(existingMetadata.width) &&
        Number.isFinite(existingMetadata.height) &&
        Number.isFinite(existingMetadata.bytes)
      ) {
        return [key, existingMetadata];
      }

      return [key, await probeImageVariant(url)];
    }),
  );

  return Object.fromEntries(entries);
}

async function fetchRows(job) {
  const rows = await sql`
    SELECT id, image_url, image_variants
    FROM ${sql(job.table)}
    WHERE image_url IS NOT NULL
    ORDER BY id ASC
  `;

  return rows
    .filter((row) => !selectedId || Number(row.id) === selectedId)
    .filter((row) => !hasCompleteImageVariantMetadata(row.image_variants));
}

async function updateRow(job, row, variants) {
  await sql`
    UPDATE ${sql(job.table)}
    SET image_variants = ${JSON.stringify(variants)}::jsonb
    WHERE id = ${row.id}
  `;
}

async function run() {
  const jobs = selectedTable
    ? JOBS.filter((job) => job.table === selectedTable)
    : JOBS;

  if (selectedTable && jobs.length === 0) {
    throw new Error(`Unknown BACKFILL_TABLE: ${selectedTable}`);
  }

  const uploadedByUrl = new Map();
  let processedCount = 0;

  for (const job of jobs) {
    const rows = await fetchRows(job);

    for (const row of rows) {
      if (limit !== null && processedCount >= limit) {
        return;
      }

      console.log(
        `${dryRun ? "[dry-run] " : ""}${job.table}#${row.id}: backfilling variants`,
      );

      if (dryRun) {
        processedCount += 1;
        continue;
      }

      try {
        let variants =
          (await buildMetadataFromExistingVariants(row.image_variants)) ||
          uploadedByUrl.get(row.image_url);

        if (!variants) {
          const sourceBuffer = await downloadImage(row.image_url);
          variants = await uploadImageVariantsToStorage({
            supabase,
            bucketName: job.bucketName,
            prefix: job.prefix,
            sourceBuffer,
          });
          uploadedByUrl.set(row.image_url, variants);
        }

        await updateRow(job, row, variants);
        processedCount += 1;
      } catch (error) {
        console.error(
          `${job.table}#${row.id}: ${error instanceof Error ? error.message : "Backfill failed"}`,
        );
      }
    }
  }
}

run()
  .then(async () => {
    await sql.end({ timeout: 5 });
    console.log("Image variant backfill finished.");
  })
  .catch(async (error) => {
    await sql.end({ timeout: 5 });
    console.error(error);
    process.exit(1);
  });
