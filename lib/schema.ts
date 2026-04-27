import { sql } from '@vercel/postgres';

let schemaEnsured = false;

export async function ensureInventorySchema() {
  if (schemaEnsured) {
    return;
  }

  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS date_bought TIMESTAMP`;
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS date_listed TIMESTAMP`;
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS date_sold TIMESTAMP`;

  await sql`
    CREATE TABLE IF NOT EXISTS item_expenses (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_expenses_item_id
    ON item_expenses(item_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_archive_original_item_id
    ON item_archive(original_item_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_archive_archived_at
    ON item_archive(archived_at DESC)
  `;

  schemaEnsured = true;
}
