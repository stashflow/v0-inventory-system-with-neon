import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { sendSaleEmail } from '@/lib/email';
import { ensureInventorySchema } from '@/lib/schema';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInventorySchema();
    const { status } = await request.json();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!['bought', 'in_inventory', 'sold'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const existingResult = await sql`
      SELECT id, name, status, price_bought, price_selling
      FROM items
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const previousItem = existingResult.rows[0];

    const result =
      status === 'sold'
        ? await sql`
            UPDATE items
            SET status = ${status}, date_sold = COALESCE(date_sold, NOW()), updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
          `
        : await sql`
            UPDATE items
            SET status = ${status}, date_sold = NULL, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
          `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (previousItem.status !== 'sold' && status === 'sold') {
      const updatedItem = result.rows[0];

      void sendSaleEmail({
        itemName: String(updatedItem.name ?? ''),
        priceBought: Number(updatedItem.price_bought ?? 0),
        priceSelling: Number(updatedItem.price_selling ?? 0),
      }).then((emailResult) => {
        if (!emailResult.ok) {
          console.error('[v0] Sale email failed:', emailResult.error);
        }
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[v0] Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInventorySchema();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM items WHERE id = ${id} RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
