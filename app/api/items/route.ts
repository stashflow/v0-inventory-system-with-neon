import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureInventorySchema } from '@/lib/schema';
import { archiveSoldItems } from '@/lib/archive';

export async function GET() {
  try {
    try {
      await ensureInventorySchema();
      await archiveSoldItems();
    } catch (error) {
      console.warn('[v0] Schema/archive init warning:', error);
    }

    let result;
    try {
      result = await sql`
        SELECT
          i.*,
          COALESCE(exp.total_expenses, 0) AS total_expenses
        FROM items i
        LEFT JOIN (
          SELECT item_id, SUM(amount) AS total_expenses
          FROM item_expenses
          GROUP BY item_id
        ) exp ON exp.item_id = i.id
        ORDER BY i.created_at DESC
      `;
    } catch (error) {
      console.warn('[v0] Falling back to basic items query:', error);
      result = await sql`SELECT * FROM items ORDER BY created_at DESC`;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[v0] Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInventorySchema();

    const { name, price_bought, price_selling, image_url, date_bought, expense_amount, expense_note } =
      await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO items (name, price_bought, price_selling, image_url, date_bought)
      VALUES (
        ${name},
        ${price_bought ?? 0},
        ${price_selling ?? 0},
        ${image_url || null},
        ${date_bought ? new Date(date_bought).toISOString() : null}
      )
      RETURNING *
    `;

    const item = result.rows[0];

    if (expense_amount && Number(expense_amount) > 0) {
      await sql`
        INSERT INTO item_expenses (item_id, amount, note)
        VALUES (${item.id}, ${expense_amount}, ${expense_note || null})
      `;
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
