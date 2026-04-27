import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyStats } from '@/lib/monthly-stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
    }

    const parsedMonth = Number.parseInt(month, 10);
    const parsedYear = Number.parseInt(year, 10);
    const stats = await getMonthlyStats(parsedMonth, parsedYear);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[v0] Error fetching monthly stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
