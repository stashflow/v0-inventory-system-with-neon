import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureInventorySchema } from '@/lib/schema';
import { archiveSoldItems } from '@/lib/archive';

export async function GET() {
  try {
    try {
      await ensureInventorySchema();
      await archiveSoldItems();
    } catch (error) {
      console.warn('[v0] Archive schema/init warning:', error);
    }

    try {
      const result = await sql`
        SELECT *
        FROM item_archive
        ORDER BY archived_at DESC
      `;
      return NextResponse.json(result.rows);
    } catch (error) {
      console.warn('[v0] Archive table unavailable, returning empty list:', error);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('[v0] Error fetching archive:', error);
    return NextResponse.json([]);
  }
}
