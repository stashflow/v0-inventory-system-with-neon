import { NextResponse } from 'next/server';
import { getEmailConfigSummary, sendTestEmail } from '@/lib/email';

export async function POST() {
  try {
    const result = await sendTestEmail();
    if (!result.ok) {
      return NextResponse.json(
        {
          error: `Failed to send test email: ${result.error}`,
          code: result.code || null,
          hint: result.hint || null,
          config: getEmailConfigSummary(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config: getEmailConfigSummary() });
  } catch (error) {
    console.error('[v0] Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', config: getEmailConfigSummary() },
      { status: 500 }
    );
  }
}
