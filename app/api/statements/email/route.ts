import { NextRequest, NextResponse } from 'next/server';
import { sendMonthlyStatementEmail } from '@/lib/email';
import { getMonthlyStats } from '@/lib/monthly-stats';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const month = Number.parseInt(String(body.month ?? now.getMonth() + 1), 10);
    const year = Number.parseInt(String(body.year ?? now.getFullYear()), 10);

    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const stats = await getMonthlyStats(month, year);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const result = await sendMonthlyStatementEmail({ monthName, stats });

    if (!result.ok) {
      return NextResponse.json(
        { error: `Failed to send email: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error emailing monthly statement:', error);
    return NextResponse.json({ error: 'Failed to email statement' }, { status: 500 });
  }
}
