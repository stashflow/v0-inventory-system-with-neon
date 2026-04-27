'use client';

interface ArchiveTableProps {
  items: Array<{
    id: string;
    name: string;
    price_bought: number;
    price_selling: number;
    total_expenses?: number;
    date_bought?: string | null;
    date_listed?: string | null;
    date_sold?: string | null;
    archived_at?: string | null;
  }>;
}

export function ArchiveTable({ items }: ArchiveTableProps) {
  if (!items || items.length === 0) {
    return <div className="text-center py-8 text-gray-500">No archived items yet</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const expenses = Number(item.total_expenses || 0);
        const profit = Number(item.price_selling) - Number(item.price_bought) - expenses;

        return (
          <div key={item.id} className="border border-black rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-black">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  ${Number(item.price_bought).toFixed(2)} → ${Number(item.price_selling).toFixed(2)}
                  {expenses > 0 && <> · Fees ${expenses.toFixed(2)}</>}
                </p>
              </div>
              <div className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-gray-600">
              <div>
                <span className="font-medium text-black">Bought:</span>{' '}
                {item.date_bought ? new Date(item.date_bought).toLocaleDateString() : '—'}
              </div>
              <div>
                <span className="font-medium text-black">Listed:</span>{' '}
                {item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'}
              </div>
              <div>
                <span className="font-medium text-black">Sold:</span>{' '}
                {item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'}
              </div>
              <div>
                <span className="font-medium text-black">Archived:</span>{' '}
                {item.archived_at ? new Date(item.archived_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
