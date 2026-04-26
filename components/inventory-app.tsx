'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { ItemForm } from './item-form';
import { ItemsTable } from './items-table';

export function InventoryApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: items = [], isLoading } = useSWR('/api/items', (url) =>
    fetch(url).then((res) => res.json())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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

        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No items yet. Add one to get started!</p>
          </div>
        ) : (
          <ItemsTable items={items} />
        )}
      </main>
    </div>
  );
}
