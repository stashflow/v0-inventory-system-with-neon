import nodemailer from 'nodemailer';
import type { MonthlyStats } from './monthly-stats';

type EmailResult = { ok: true } | { ok: false; error: string };

const EMAIL_HOST = process.env.SMTP_HOST || 'smtppro.zoho.com';
const EMAIL_PORT = Number(process.env.SMTP_PORT || 465);
const EMAIL_SECURE = process.env.SMTP_SECURE !== 'false';
const EMAIL_USER = process.env.SMTP_USER || 'hello@ambrossslides.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@ambrossslides.com';
const EMAIL_TO = process.env.EMAIL_TO || 'ejmeade22@gmail.com';

export function getEmailConfigSummary() {
  return {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    user: EMAIL_USER,
    from: EMAIL_FROM,
    to: EMAIL_TO,
    hasPassword: Boolean(process.env.SMTP_PASS),
  };
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function htmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendEmail(subject: string, text: string, html: string): Promise<EmailResult> {
  const password = process.env.SMTP_PASS;
  if (!password) {
    return { ok: false, error: 'SMTP_PASS is not set' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: password,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject,
      text,
      html,
    });

    return { ok: true };
  } catch (error) {
    const maybeError = error as { message?: string; code?: string; response?: string; command?: string };
    const message = maybeError?.message || 'Unknown email error';
    const details = [maybeError?.code, maybeError?.command, maybeError?.response]
      .filter(Boolean)
      .join(' | ');
    return { ok: false, error: details ? `${message} (${details})` : message };
  }
}

export async function sendSaleEmail(input: {
  itemName: string;
  priceBought: number;
  priceSelling: number;
}): Promise<EmailResult> {
  const profit = input.priceSelling - input.priceBought;
  const subject = `Sale Alert: ${input.itemName}`;
  const text = [
    `Item sold: ${input.itemName}`,
    `Bought: ${formatMoney(input.priceBought)}`,
    `Sold: ${formatMoney(input.priceSelling)}`,
    `Profit: ${profit >= 0 ? '+' : ''}${formatMoney(profit)}`,
  ].join('\n');

  const safeItemName = htmlEscape(input.itemName);
  const html = `
    <h2>Sale Alert</h2>
    <p><strong>Item sold:</strong> ${safeItemName}</p>
    <p><strong>Bought:</strong> ${formatMoney(input.priceBought)}</p>
    <p><strong>Sold:</strong> ${formatMoney(input.priceSelling)}</p>
    <p><strong>Profit:</strong> ${profit >= 0 ? '+' : ''}${formatMoney(profit)}</p>
  `;

  return sendEmail(subject, text, html);
}

export async function sendMonthlyStatementEmail(input: {
  monthName: string;
  stats: MonthlyStats;
}): Promise<EmailResult> {
  const soldItems = input.stats.items.filter((item) => item.status === 'sold');
  const soldText = soldItems.length
    ? soldItems
        .map((item) => `- ${item.name}: ${formatMoney(item.price_bought)} -> ${formatMoney(item.price_selling)} (${item.profit >= 0 ? '+' : ''}${formatMoney(item.profit)})`)
        .join('\n')
    : 'No sold items this month.';

  const subject = `Monthly Statement: ${input.monthName}`;
  const text = [
    `Monthly Statement - ${input.monthName}`,
    '',
    `Total items: ${input.stats.totalItems}`,
    `Bought: ${input.stats.boughtItems} (${formatMoney(input.stats.boughtInvested)} invested)`,
    `In inventory: ${input.stats.inventoryItems} (${formatMoney(input.stats.inventoryInvested)} invested)`,
    `Sold: ${input.stats.soldItems}`,
    `Sold invested: ${formatMoney(input.stats.soldInvested)}`,
    `Revenue: ${formatMoney(input.stats.soldRevenue)}`,
    `Profit: ${input.stats.soldProfit >= 0 ? '+' : ''}${formatMoney(input.stats.soldProfit)}`,
    '',
    'Sold items:',
    soldText,
  ].join('\n');

  const html = `
    <h2>Monthly Statement - ${htmlEscape(input.monthName)}</h2>
    <ul>
      <li><strong>Total items:</strong> ${input.stats.totalItems}</li>
      <li><strong>Bought:</strong> ${input.stats.boughtItems} (${formatMoney(input.stats.boughtInvested)} invested)</li>
      <li><strong>In inventory:</strong> ${input.stats.inventoryItems} (${formatMoney(input.stats.inventoryInvested)} invested)</li>
      <li><strong>Sold:</strong> ${input.stats.soldItems}</li>
      <li><strong>Sold invested:</strong> ${formatMoney(input.stats.soldInvested)}</li>
      <li><strong>Revenue:</strong> ${formatMoney(input.stats.soldRevenue)}</li>
      <li><strong>Profit:</strong> ${input.stats.soldProfit >= 0 ? '+' : ''}${formatMoney(input.stats.soldProfit)}</li>
    </ul>
    <h3>Sold Items</h3>
    ${
      soldItems.length
        ? `<ul>${soldItems
            .map(
              (item) =>
                `<li>${htmlEscape(item.name)}: ${formatMoney(item.price_bought)} -> ${formatMoney(item.price_selling)} (${item.profit >= 0 ? '+' : ''}${formatMoney(item.profit)})</li>`
            )
            .join('')}</ul>`
        : '<p>No sold items this month.</p>'
    }
  `;

  return sendEmail(subject, text, html);
}

export async function sendTestEmail(): Promise<EmailResult> {
  const now = new Date();
  const subject = `Inventory Test Email - ${now.toLocaleString('en-US')}`;
  const text = [
    'This is a test email from your inventory app.',
    '',
    `Sent at: ${now.toISOString()}`,
    `From: ${EMAIL_FROM}`,
    `To: ${EMAIL_TO}`,
  ].join('\n');

  const html = `
    <h2>Inventory Test Email</h2>
    <p>This is a test email from your inventory app.</p>
    <p><strong>Sent at:</strong> ${htmlEscape(now.toISOString())}</p>
    <p><strong>From:</strong> ${htmlEscape(EMAIL_FROM)}</p>
    <p><strong>To:</strong> ${htmlEscape(EMAIL_TO)}</p>
  `;

  return sendEmail(subject, text, html);
}
