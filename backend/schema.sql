-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name) VALUES
('Portrait'),
('Landscape'),
('Abstract'),
('Nature'),
('Digital')
ON CONFLICT DO NOTHING;

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price NUMERIC,
  syllabus TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE courses
ADD COLUMN video_path TEXT;

ALTER TABLE courses
DROP COLUMN thumbnail_url;

ALTER TABLE courses
DROP COLUMN price;

DROP TABLE courses;

CREATE TABLE IF NOT EXISTS course_page (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  markdown TEXT NOT NULL,
  video_path TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

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


CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
