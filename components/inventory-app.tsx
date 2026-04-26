'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { ItemForm } from './item-form';
import { ItemsTableEnhanced } from './items-table-enhanced';
import { MonthlyStatements } from './monthly-statements';

export function InventoryApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [view, setView] = useState<'inventory' | 'statements'>('inventory');
  const { data: items = [], isLoading } = useSWR('/api/items', (url) =>
    fetch(url).then((res) => res.json())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black" style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              inventory
            </h1>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-black text-white px-6 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Add Item
            </button>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-2 border-t border-gray-300 pt-4">
            <button
              onClick={() => setView('inventory')}
              className={`px-4 py-2 font-medium transition-colors ${
                view === 'inventory'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setView('statements')}
              className={`px-4 py-2 font-medium transition-colors ${
                view === 'statements'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Monthly Statements
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFormOpen && (
          <div className="mb-8 border border-black rounded p-6 bg-white">
            <ItemForm
              onSuccess={() => {
                setIsFormOpen(false);
                mutate('/api/items');
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        )}

        {view === 'inventory' ? (
          <>
            {isLoading ? (
              <div className="text-center py-12 text-gray-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No items yet. Add one to get started!</p>
              </div>
            ) : (
              <ItemsTableEnhanced items={items} />
            )}
          </>
        ) : (
          <MonthlyStatements />
        )}
      </main>
    </div>
  );
}
