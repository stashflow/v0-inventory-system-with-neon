-- Add item_images table for multiple images per item
CREATE TABLE IF NOT EXISTS item_images (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  display_order INTEGER DEFAULT 0
);

-- Add item_listings table for multiple listing links per item
CREATE TABLE IF NOT EXISTS item_listings (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'ebay', 'other'
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  display_order INTEGER DEFAULT 0
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_listings_item_id ON item_listings(item_id);

-- Add per-item expenses tracking
CREATE TABLE IF NOT EXISTS item_expenses (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_expenses_item_id ON item_expenses(item_id);

-- Add sold archive table
CREATE TABLE IF NOT EXISTS item_archive (
  id SERIAL PRIMARY KEY,
  original_item_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_bought DECIMAL(10, 2) NOT NULL,
  price_selling DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  image_url TEXT,
  total_expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date_bought TIMESTAMP,
  date_listed TIMESTAMP,
  date_sold TIMESTAMP,
  archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_archive_original_item_id ON item_archive(original_item_id);
CREATE INDEX IF NOT EXISTS idx_item_archive_archived_at ON item_archive(archived_at DESC);
