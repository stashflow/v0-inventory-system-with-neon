'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { ItemForm } from './item-form';
import { ItemsTableEnhanced } from './items-table-enhanced';
import { MonthlyStatements } from './monthly-statements';
import { ArchiveTable } from './archive-table';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed: ${response.status}`);
  }
  return data;
};

export function InventoryApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [view, setView] = useState<'inventory' | 'statements' | 'archive'>('inventory');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'bought' | 'in_inventory' | 'sold'>('all');
  const { data: itemsData, isLoading, error: itemsError } = useSWR('/api/items', fetcher);
  const { data: archivedData, isLoading: archiveLoading } = useSWR('/api/archive', fetcher);

  const items = Array.isArray(itemsData) ? itemsData : [];
  const archivedItems = Array.isArray(archivedData) ? archivedData : [];

  const filteredItems = items.filter((item: any) => {
    const searchMatches =
      search.trim().length === 0 || String(item.name || '').toLowerCase().includes(search.toLowerCase());
    const statusMatches = statusFilter === 'all' || item.status === statusFilter;
    return searchMatches && statusMatches;
  });

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
            <button
              onClick={() => setView('archive')}
              className={`px-4 py-2 font-medium transition-colors ${
                view === 'archive'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Archive
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
            {itemsError && (
              <div className="mb-4 border border-red-400 bg-red-50 text-red-700 px-4 py-3 rounded">
                Failed to load inventory: {itemsError.message}
              </div>
            )}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item name..."
                className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'bought' | 'in_inventory' | 'sold')}
                className="w-full px-3 py-2 border border-black rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Statuses</option>
                <option value="bought">Bought</option>
                <option value="in_inventory">In Inventory</option>
                <option value="sold">Sold</option>
              </select>
              <div className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-gray-50">
                Showing {filteredItems.length} of {items.length}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-600">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No items match your search/filter.</p>
              </div>
            ) : (
              <ItemsTableEnhanced items={filteredItems} />
            )}
          </>
        ) : view === 'statements' ? (
          <MonthlyStatements />
        ) : archiveLoading ? (
          <div className="text-center py-12 text-gray-600">Loading archive...</div>
        ) : (
          <ArchiveTable items={archivedItems} />
        )}
      </main>
    </div>
  );
}
