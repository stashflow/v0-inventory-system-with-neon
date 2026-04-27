'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed: ${response.status}`);
  }
  return data;
};

export function MonthlyStatements() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return { month: today.getMonth() + 1, year: today.getFullYear() };
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: stats, error } = useSWR(
    `/api/statements?month=${date.month}&year=${date.year}`,
    fetcher
  );

  const handlePrevMonth = () => {
    if (date.month === 1) {
      setDate({ month: 12, year: date.year - 1 });
    } else {
      setDate({ ...date, month: date.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (date.month === 12) {
      setDate({ month: 1, year: date.year + 1 });
    } else {
      setDate({ ...date, month: date.month + 1 });
    }
  };

  const monthName = new Date(date.year, date.month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleEmailStatement = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch('/api/statements/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: date.month, year: date.year }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to email statement');
      }

      alert(`Statement emailed for ${monthName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to email statement';
      alert(message);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-black">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmailStatement}
            disabled={sendingEmail}
            className="px-3 py-2 border border-black rounded text-sm font-medium text-black hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Mail size={16} />
            {sendingEmail ? 'Sending...' : 'Email Statement'}
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-8 text-red-600">Failed to load statement: {error.message}</div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bought Items */}
            <div className="border border-black rounded p-4">
              <h3 className="font-medium text-black mb-2">Bought</h3>
              <div className="text-3xl font-bold text-black">{stats.boughtItems}</div>
              <div className="text-sm text-gray-600 mt-1">
                Invested: ${stats.boughtInvested.toFixed(2)}
              </div>
            </div>

            {/* Inventory Items */}
            <div className="border border-black rounded p-4">
              <h3 className="font-medium text-black mb-2">In Inventory</h3>
              <div className="text-3xl font-bold text-black">{stats.inventoryItems}</div>
              <div className="text-sm text-gray-600 mt-1">
                Invested: ${stats.inventoryInvested.toFixed(2)}
              </div>
            </div>

            {/* Sold Items */}
            <div className="border border-black rounded p-4">
              <h3 className="font-medium text-black mb-2">Sold</h3>
              <div className="text-3xl font-bold text-black">{stats.soldItems}</div>
              <div className="text-sm text-gray-600 mt-1">
                Invested: ${stats.soldInvested.toFixed(2)}
              </div>
            </div>

            {/* Revenue & Profit */}
            <div className="border border-black rounded p-4">
              <h3 className="font-medium text-black mb-2">Revenue & Profit</h3>
              <div className="space-y-1">
                <div className="text-sm">
                  Revenue: <span className="font-bold">${stats.soldRevenue.toFixed(2)}</span>
                </div>
                <div className={`text-sm ${stats.soldProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Profit: <span className="font-bold">{stats.soldProfit >= 0 ? '+' : ''}${stats.soldProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sold Items List */}
          {stats.items.length > 0 && (
            <div>
              <h3 className="font-medium text-black mb-3">Items Sold This Month</h3>
              <div className="space-y-2">
                {stats.items
                  .filter((item: any) => item.status === 'sold')
                  .map((item: any) => (
                    <div key={item.id} className="border border-gray-300 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-black">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          ${item.price_bought.toFixed(2)} → ${item.price_selling.toFixed(2)}
                        </p>
                      </div>
                      <div className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {stats.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items tracked for this month
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      )}
    </div>
  );
}
