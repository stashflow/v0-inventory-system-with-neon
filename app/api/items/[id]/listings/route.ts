import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureInventorySchema } from '@/lib/schema';

async function getListingUrlColumn(): Promise<'listing_url' | 'url'> {
  const columns = await sql<{ column_name: string }>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'item_listings'
      AND column_name IN ('listing_url', 'url')
  `;

  if (columns.rows.some((column) => column.column_name === 'listing_url')) {
    return 'listing_url';
  }

  return 'url';
}

export async function GET(
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

    const listingUrlColumn = await getListingUrlColumn();
    const result =
      listingUrlColumn === 'listing_url'
        ? await sql`
            SELECT id, item_id, platform, listing_url, created_at, display_order
            FROM item_listings
            WHERE item_id = ${id}
            ORDER BY created_at ASC
          `
        : await sql`
            SELECT id, item_id, platform, url AS listing_url, created_at, display_order
            FROM item_listings
            WHERE item_id = ${id}
            ORDER BY created_at ASC
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
    await ensureInventorySchema();
    const { platform, url } = await request.json();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!platform || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const listingUrlColumn = await getListingUrlColumn();
    const result =
      listingUrlColumn === 'listing_url'
        ? await sql`
            INSERT INTO item_listings (item_id, platform, listing_url)
            VALUES (${id}, ${platform}, ${url})
            RETURNING id, item_id, platform, listing_url, created_at, display_order
          `
        : await sql`
            INSERT INTO item_listings (item_id, platform, url)
            VALUES (${id}, ${platform}, ${url})
            RETURNING id, item_id, platform, url AS listing_url, created_at, display_order
          `;

    await sql`
      UPDATE items
      SET date_listed = COALESCE(date_listed, NOW()), updated_at = NOW()
      WHERE id = ${id}
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
    await ensureInventorySchema();
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
