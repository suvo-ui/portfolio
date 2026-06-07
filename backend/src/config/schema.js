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
        ALTER TABLE artworks
        ADD COLUMN IF NOT EXISTS image_variants JSONB
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS prints (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT NOT NULL,
          image_variants JSONB,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          price_inr NUMERIC,
          size TEXT,
          is_sold BOOLEAN NOT NULL DEFAULT FALSE,
          for_sale BOOLEAN NOT NULL DEFAULT FALSE,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS price_inr NUMERIC
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS image_variants JSONB
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS size TEXT
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE
      `;

      await tx`
        ALTER TABLE prints
        ADD COLUMN IF NOT EXISTS source_artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL
      `;

      await tx`
        CREATE UNIQUE INDEX IF NOT EXISTS prints_source_artwork_id_unique
        ON prints (source_artwork_id)
        WHERE source_artwork_id IS NOT NULL
      `;

      await tx`
        ALTER TABLE workshops
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `;

      await tx`
        ALTER TABLE workshops
        ADD COLUMN IF NOT EXISTS image_variants JSONB
      `;

      await tx`
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

      await tx`
        ALTER TABLE hero_carousel_images
        ADD COLUMN IF NOT EXISTS image_variants JSONB
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

      await tx`
        CREATE TABLE IF NOT EXISTS media_cleanup_jobs (
          id SERIAL PRIMARY KEY,
          public_url TEXT NOT NULL,
          bucket_name TEXT NOT NULL,
          resource_type TEXT NOT NULL DEFAULT 'image',
          reason TEXT NOT NULL,
          not_before TIMESTAMP NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          processed_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;

      await tx`
        CREATE UNIQUE INDEX IF NOT EXISTS media_cleanup_jobs_pending_url_unique
        ON media_cleanup_jobs (public_url, bucket_name)
        WHERE status = 'pending'
      `;
    });
  }

  return schemaReadyPromise;
}
