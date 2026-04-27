import { sql } from '@vercel/postgres';

export async function archiveSoldItems() {
  const candidates = await sql<{
    id: number;
    name: string;
    price_bought: number | string;
    price_selling: number | string;
    status: string;
    image_url: string | null;
    date_bought: string | null;
    date_listed: string | null;
    date_sold: string | null;
    total_expenses: number | string;
  }>`
    SELECT
      i.id,
      i.name,
      i.price_bought,
      i.price_selling,
      i.status,
      i.image_url,
      i.date_bought,
      i.date_listed,
      i.date_sold,
      COALESCE(exp.total_expenses, 0) AS total_expenses
    FROM items i
    LEFT JOIN (
      SELECT item_id, SUM(amount) AS total_expenses
      FROM item_expenses
      GROUP BY item_id
    ) exp ON exp.item_id = i.id
    WHERE i.status = 'sold'
      AND i.date_sold IS NOT NULL
      AND i.date_sold <= NOW() - INTERVAL '7 days'
  `;

  if (candidates.rows.length === 0) {
    return { archivedCount: 0 };
  }

  for (const item of candidates.rows) {
    await sql`
      INSERT INTO item_archive (
        original_item_id,
        name,
        price_bought,
        price_selling,
        status,
        image_url,
        total_expenses,
        date_bought,
        date_listed,
        date_sold,
        archived_at
      )
      VALUES (
        ${item.id},
        ${item.name},
        ${item.price_bought},
        ${item.price_selling},
        ${item.status},
        ${item.image_url},
        ${item.total_expenses},
        ${item.date_bought},
        ${item.date_listed},
        ${item.date_sold},
        NOW()
      )
    `;

    await sql`DELETE FROM items WHERE id = ${item.id}`;
  }

  return { archivedCount: candidates.rows.length };
}
