import sql from "./db.js";

let schemaReadyPromise;

export function ensureSchemaReady() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = sql.begin(async (tx) => {
      await tx`
        CREATE TABLE IF NOT EXISTS course_page (
          id BOOLEAN PRIMARY KEY DEFAULT TRUE,
          markdown TEXT NOT NULL,
          video_path TEXT,
          demo_video_1_url TEXT,
          demo_video_2_url TEXT,
          demo_video_3_url TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS course_demo_videos (
          id SERIAL PRIMARY KEY,
          position INTEGER NOT NULL UNIQUE,
          youtube_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await tx`
        ALTER TABLE categories
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `;

      await tx`
        ALTER TABLE artworks
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `;

      await tx`
        ALTER TABLE workshops
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `;

      await tx`
        ALTER TABLE course_page
        ADD COLUMN IF NOT EXISTS demo_video_1_url TEXT
      `;

      await tx`
        ALTER TABLE course_page
        ADD COLUMN IF NOT EXISTS demo_video_2_url TEXT
      `;

      await tx`
        ALTER TABLE course_page
        ADD COLUMN IF NOT EXISTS demo_video_3_url TEXT
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          before_state TEXT,
          after_state TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
    });
  }

  return schemaReadyPromise;
}
