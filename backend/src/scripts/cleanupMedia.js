import "dotenv/config";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { ensureSchemaReady } from "../config/schema.js";
import { processPendingMediaCleanupJobs } from "../lib/mediaCleanup.js";

const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const limit = process.env.CLEANUP_LIMIT
  ? Number(process.env.CLEANUP_LIMIT)
  : 50;

async function run() {
  await ensureSchemaReady();

  const results = await processPendingMediaCleanupJobs({
    db: sql,
    supabase,
    dryRun,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 50,
  });

  if (results.length === 0) {
    console.log("No media cleanup jobs are due.");
    return;
  }

  for (const result of results) {
    const prefix = dryRun ? "[dry-run] " : "";
    const suffix = result.error ? ` - ${result.error}` : "";
    console.log(
      `${prefix}media_cleanup_jobs#${result.id}: ${result.status}${suffix}`,
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
