import "dotenv/config";

import sql from "../config/db.js";
import {
  extractCloudinaryPublicObjectPath,
  extractSupabasePublicObjectPath,
} from "../lib/storage.js";

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function collectStringValues(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(collectStringValues);
  }

  return [];
}

function analyzeMediaReference(value, bucketName, allowBarePath = false) {
  if (value === undefined || value === null) {
    return { status: "empty" };
  }

  if (typeof value !== "string") {
    return { status: "invalid" };
  }

  if (!isHttpUrl(value)) {
    if (allowBarePath) {
      return { status: "supabase_path", value };
    }

    return { status: "invalid" };
  }

  if (extractCloudinaryPublicObjectPath(value, bucketName)) {
    return { status: "cloudinary", value };
  }

  if (extractSupabasePublicObjectPath(value, bucketName)) {
    return { status: "supabase_url", value };
  }

  return { status: "other_external", value };
}

const MEDIA_COLUMNS = [
  {
    table: "artworks",
    idColumn: "id",
    columns: [
      { name: "image_url", bucketName: "artworks", type: "url" },
      { name: "image_variants", bucketName: "artworks", type: "json" },
    ],
  },
  {
    table: "prints",
    idColumn: "id",
    columns: [
      { name: "image_url", bucketName: "artworks", type: "url" },
      { name: "image_variants", bucketName: "artworks", type: "json" },
    ],
  },
  {
    table: "hero_carousel_images",
    idColumn: "id",
    columns: [
      { name: "image_url", bucketName: "artworks", type: "url" },
      { name: "image_variants", bucketName: "artworks", type: "json" },
    ],
  },
  {
    table: "workshops",
    idColumn: "id",
    columns: [
      { name: "image_url", bucketName: "workshop-image", type: "url" },
      { name: "image_variants", bucketName: "workshop-image", type: "json" },
      { name: "video_url", bucketName: "workshop-videos", type: "url" },
    ],
  },
  {
    table: "course_page",
    idColumn: "id",
    columns: [
      { name: "video_path", bucketName: "course vids", type: "video_path" },
    ],
  },
];

function summarizeStatuses() {
  return {
    cloudinary: 0,
    supabase_url: 0,
    supabase_path: 0,
    other_external: 0,
    invalid: 0,
    empty: 0,
    totalReferences: 0,
  };
}

async function scanColumn(table, idColumn, column, bucketName, type) {
  const rows = await sql`
    SELECT ${sql(idColumn)}, ${sql(column)}
    FROM ${sql(table)}
    WHERE ${sql(column)} IS NOT NULL
    ORDER BY ${sql(idColumn)} ASC
  `;

  const summary = summarizeStatuses();
  const samples = {
    supabase_url: [],
    supabase_path: [],
    other_external: [],
    invalid: [],
  };

  for (const row of rows) {
    let values = [];

    if (type === "json") {
      values = collectStringValues(row[column]);
    } else {
      values = [row[column]];
    }

    for (const value of values) {
      const result = analyzeMediaReference(
        value,
        bucketName,
        type === "video_path",
      );

      summary.totalReferences += 1;
      summary[result.status] += 1;

      if (
        (result.status === "supabase_url" ||
          result.status === "supabase_path" ||
          result.status === "other_external" ||
          result.status === "invalid") &&
        samples[result.status].length < 5
      ) {
        samples[result.status].push({ id: row[idColumn], value });
      }
    }
  }

  return { summary, samples, rowCount: rows.length };
}

function formatSample(sample) {
  return sample.map((entry) => `    - ${entry.id}: ${entry.value}`).join("\n");
}

async function run() {
  console.log("Verifying Supabase media references...");

  let foundSupabaseReferences = false;

  for (const spec of MEDIA_COLUMNS) {
    for (const column of spec.columns) {
      const { summary, samples, rowCount } = await scanColumn(
        spec.table,
        spec.idColumn,
        column.name,
        column.bucketName,
        column.type,
      );

      console.log(`\nTable: ${spec.table}`);
      console.log(`Column: ${column.name}`);
      console.log(`Rows scanned: ${rowCount}`);
      console.log(`Total references: ${summary.totalReferences}`);
      console.log(`  · Cloudinary URLs: ${summary.cloudinary}`);
      console.log(`  · Supabase URLs: ${summary.supabase_url}`);
      console.log(`  · Supabase object paths: ${summary.supabase_path}`);
      console.log(`  · Other external URLs: ${summary.other_external}`);
      console.log(`  · Invalid values: ${summary.invalid}`);

      if (summary.supabase_url || summary.supabase_path) {
        foundSupabaseReferences = true;
      }

      if (
        summary.supabase_url ||
        summary.supabase_path ||
        summary.other_external ||
        summary.invalid
      ) {
        if (summary.supabase_url > 0) {
          console.log("  Sample Supabase URLs:");
          console.log(formatSample(samples.supabase_url));
        }

        if (summary.supabase_path > 0) {
          console.log("  Sample Supabase object paths:");
          console.log(formatSample(samples.supabase_path));
        }

        if (summary.other_external > 0) {
          console.log("  Sample other external URLs:");
          console.log(formatSample(samples.other_external));
        }

        if (summary.invalid > 0) {
          console.log("  Sample invalid values:");
          console.log(formatSample(samples.invalid));
        }
      }
    }
  }

  if (foundSupabaseReferences) {
    console.log(
      "\nSupabase media references were found in the database. Do not delete Supabase buckets until these are migrated and verified.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      "\nNo Supabase media references were found in the scanned tables. Cloudinary migration appears complete for these media columns.",
    );
  }
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
