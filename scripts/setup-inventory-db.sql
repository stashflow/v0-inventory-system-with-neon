-- Create inventory items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price_bought DECIMAL(10, 2) NOT NULL,
  price_selling DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'bought',
  image_url TEXT,
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (price_selling - price_bought) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_items_status ON items(status);
