import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
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
      SELECT * FROM item_listings WHERE item_id = ${id} ORDER BY created_at ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[v0] Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { platform, url } = await request.json();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!platform || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO item_listings (item_id, platform, listing_url)
      VALUES (${id}, ${platform}, ${url})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Error adding listing:', error);
    return NextResponse.json({ error: 'Failed to add listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'No listing ID provided' }, { status: 400 });
    }

    await sql`
      DELETE FROM item_listings WHERE id = ${listingId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
