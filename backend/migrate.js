import sql from "./src/config/db.js";
import { ensureSchemaReady } from "./src/config/schema.js";

async function runMigration() {
  try {
    console.log("Running workshop completed column migration...");

    await sql`
      ALTER TABLE artworks
      ADD COLUMN IF NOT EXISTS available_for_print BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await sql`
      ALTER TABLE artworks
      ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await sql`
      ALTER TABLE workshops
      ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await sql`
      ALTER TABLE workshops
      ADD COLUMN IF NOT EXISTS venue TEXT
    `;

    await ensureSchemaReady();

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
