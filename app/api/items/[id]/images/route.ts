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
      SELECT * FROM item_images WHERE item_id = ${id} ORDER BY created_at ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[v0] Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url } = await request.json();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO item_images (item_id, image_url)
      VALUES (${id}, ${url})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Error adding image:', error);
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'No image ID provided' }, { status: 400 });
    }

    await sql`
      DELETE FROM item_images WHERE id = ${imageId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
