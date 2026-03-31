CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artworks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price_inr NUMERIC,
  size TEXT,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS price_inr NUMERIC;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS available_for_print BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS course_page (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  markdown TEXT NOT NULL,
  video_path TEXT,
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
  video_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

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
