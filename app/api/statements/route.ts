import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Get all items for the month
    const result = await sql`
      SELECT 
        id,
        name,
        price_bought,
        price_selling,
        status,
        created_at,
        (price_selling - price_bought) as profit
      FROM items
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
      ORDER BY created_at DESC
    `;

    const items = result.rows;

    // Calculate totals
    const bought = items.filter((i: any) => i.status === 'bought');
    const inInventory = items.filter((i: any) => i.status === 'in_inventory');
    const sold = items.filter((i: any) => i.status === 'sold');

    const stats = {
      totalItems: items.length,
      boughtItems: bought.length,
      boughtInvested: bought.reduce((sum: number, i: any) => sum + i.price_bought, 0),
      inventoryItems: inInventory.length,
      inventoryInvested: inInventory.reduce((sum: number, i: any) => sum + i.price_bought, 0),
      soldItems: sold.length,
      soldInvested: sold.reduce((sum: number, i: any) => sum + i.price_bought, 0),
      soldRevenue: sold.reduce((sum: number, i: any) => sum + i.price_selling, 0),
      soldProfit: sold.reduce((sum: number, i: any) => sum + i.profit, 0),
      items,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[v0] Error fetching monthly stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
