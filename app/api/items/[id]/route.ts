import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!['bought', 'in_inventory', 'sold'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const result = await sql`
      UPDATE items 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
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
