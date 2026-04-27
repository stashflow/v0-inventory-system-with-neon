import { sql } from '@vercel/postgres';
import { ensureInventorySchema } from './schema';

export interface MonthlyStatsItem {
  id: number;
  name: string;
  price_bought: number;
  price_selling: number;
  total_expenses: number;
  status: string;
  created_at: string;
  profit: number;
}

export interface MonthlyStats {
  totalItems: number;
  boughtItems: number;
  boughtInvested: number;
  inventoryItems: number;
  inventoryInvested: number;
  soldItems: number;
  soldInvested: number;
  soldRevenue: number;
  soldProfit: number;
  items: MonthlyStatsItem[];
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getMonthlyStats(month: number, year: number): Promise<MonthlyStats> {
  await ensureInventorySchema();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Invalid month');
  }

  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    throw new Error('Invalid year');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await sql`
    SELECT
      id,
      name,
      price_bought,
      price_selling,
      COALESCE(exp.total_expenses, 0) AS total_expenses,
      status,
      created_at,
      (price_selling - price_bought - COALESCE(exp.total_expenses, 0)) AS profit
    FROM items
    LEFT JOIN (
      SELECT item_id, SUM(amount) AS total_expenses
      FROM item_expenses
      GROUP BY item_id
    ) exp ON exp.item_id = items.id
    WHERE created_at >= ${startDate.toISOString()}
      AND created_at <= ${endDate.toISOString()}
    ORDER BY created_at DESC
  `;

  const items = result.rows.map((item) => ({
    id: toNumber(item.id),
    name: String(item.name ?? ''),
    price_bought: toNumber(item.price_bought),
    price_selling: toNumber(item.price_selling),
    total_expenses: toNumber(item.total_expenses),
    status: String(item.status ?? ''),
    created_at: String(item.created_at ?? ''),
    profit: toNumber(item.profit),
  }));

  const bought = items.filter((item) => item.status === 'bought');
  const inInventory = items.filter((item) => item.status === 'in_inventory');
  const sold = items.filter((item) => item.status === 'sold');

  return {
    totalItems: items.length,
    boughtItems: bought.length,
    boughtInvested: bought.reduce((sum, item) => sum + item.price_bought, 0),
    inventoryItems: inInventory.length,
    inventoryInvested: inInventory.reduce((sum, item) => sum + item.price_bought, 0),
    soldItems: sold.length,
    soldInvested: sold.reduce((sum, item) => sum + item.price_bought, 0),
    soldRevenue: sold.reduce((sum, item) => sum + item.price_selling, 0),
    soldProfit: sold.reduce((sum, item) => sum + item.profit, 0),
    items,
  };
}
