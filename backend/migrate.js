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
      ALTER TABLE artworks
      ADD COLUMN IF NOT EXISTS image_variants JSONB
    `;

    await sql`
      ALTER TABLE prints
      ADD COLUMN IF NOT EXISTS image_variants JSONB
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hero_carousel_images (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        image_variants JSONB,
        title TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE hero_carousel_images
      ADD COLUMN IF NOT EXISTS image_variants JSONB
    `;

    await sql`
      ALTER TABLE workshops
      ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await sql`
      ALTER TABLE workshops
      ADD COLUMN IF NOT EXISTS venue TEXT
    `;

    await sql`
      ALTER TABLE workshops
      ADD COLUMN IF NOT EXISTS image_variants JSONB
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
