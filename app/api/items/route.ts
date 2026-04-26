import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM items ORDER BY created_at DESC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[v0] Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, price_bought, price_selling, image_url } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO items (name, price_bought, price_selling, image_url)
      VALUES (${name}, ${price_bought ?? 0}, ${price_selling ?? 0}, ${image_url || null})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
