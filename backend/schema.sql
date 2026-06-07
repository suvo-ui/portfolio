CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artworks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_variants JSONB,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price_inr NUMERIC,
  size TEXT,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  available_for_print BOOLEAN NOT NULL DEFAULT FALSE,
  for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prints (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_variants JSONB,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  source_artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL,
  price_inr NUMERIC,
  size TEXT,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS price_inr NUMERIC;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS image_variants JSONB;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS available_for_print BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE prints ADD COLUMN IF NOT EXISTS price_inr NUMERIC;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS image_variants JSONB;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE prints ADD COLUMN IF NOT EXISTS source_artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS prints_source_artwork_id_unique
ON prints (source_artwork_id)
WHERE source_artwork_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS hero_carousel_images (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_variants JSONB,
  title TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE hero_carousel_images DROP COLUMN IF EXISTS description;
ALTER TABLE hero_carousel_images ADD COLUMN IF NOT EXISTS image_variants JSONB;

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS venue TEXT;

CREATE TABLE IF NOT EXISTS course_page (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  markdown TEXT NOT NULL,
  video_path TEXT,
  demo_video_1_url TEXT,
  demo_video_2_url TEXT,
  demo_video_3_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE course_page ADD COLUMN IF NOT EXISTS demo_video_1_url TEXT;
ALTER TABLE course_page ADD COLUMN IF NOT EXISTS demo_video_2_url TEXT;
ALTER TABLE course_page ADD COLUMN IF NOT EXISTS demo_video_3_url TEXT;

CREATE TABLE IF NOT EXISTS course_demo_videos (
  id SERIAL PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  youtube_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  duration TEXT,
  price NUMERIC,
  max_seats INTEGER,
  image_url TEXT,
  image_variants JSONB,
  video_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS image_variants JSONB;

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
);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS media_cleanup_jobs_pending_url_unique
ON media_cleanup_jobs (public_url, bucket_name)
WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  request_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO categories (name)
VALUES
  ('Portrait'),
  ('Landscape'),
  ('Abstract'),
  ('Nature'),
  ('Digital')
ON CONFLICT DO NOTHING;

INSERT INTO course_page (id, markdown)
VALUES (
  TRUE,
  '# Master Abstract Art

A comprehensive journey into the world of abstract expression.

## Module 1
### Foundations of Abstract Expression
- Understanding color theory
- Emotional composition basics
- Materials and tools overview'
)
ON CONFLICT (id) DO NOTHING;
