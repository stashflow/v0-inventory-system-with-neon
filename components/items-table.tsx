'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { StatusBadge } from './status-badge';

interface Item {
  id: number;
  name: string;
  price_bought: number;
  price_selling: number;
  status: 'bought' | 'in_inventory' | 'sold';
  image_url?: string;
  profit: number;
  created_at: string;
}

interface ItemsTableProps {
  items: Item[];
}

export function ItemsTable({ items }: ItemsTableProps) {
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');
      mutate('/api/items');
    } catch (error) {
      console.error('[v0] Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      mutate('/api/items');
    } catch (error) {
      console.error('[v0] Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(null);
    }
  };

  const totalStats = {
    invested: items.reduce((sum, item) => sum + item.price_bought, 0),
    revenue: items
      .filter((item) => item.status === 'sold')
      .reduce((sum, item) => sum + item.price_selling, 0),
    profit: items
      .filter((item) => item.status === 'sold')
      .reduce((sum, item) => sum + item.profit, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-black rounded p-4 bg-white">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-black">${totalStats.invested.toFixed(2)}</p>
        </div>
        <div className="border border-black rounded p-4 bg-white">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Revenue (Sold)</p>
          <p className="text-2xl font-bold text-black">${totalStats.revenue.toFixed(2)}</p>
        </div>
        <div className="border border-black rounded p-4 bg-white">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Profit</p>
          <p className={`text-2xl font-bold ${totalStats.profit >= 0 ? 'text-black' : 'text-red-600'}`}>
            ${totalStats.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Items Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-black rounded p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            {/* Image */}
            {item.image_url && (
              <div className="mb-3 w-full h-32 border border-black rounded overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Item Details */}
            <h3 className="text-lg font-bold text-black mb-2">{item.name}</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Bought:</span>
                <span className="font-medium text-black">${item.price_bought.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selling:</span>
                <span className="font-medium text-black">${item.price_selling.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit:</span>
                <span
                  className={`font-bold ${item.profit >= 0 ? 'text-black' : 'text-red-600'}`}
                >
                  ${item.profit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                disabled={updating === item.id}
                className="w-full px-3 py-2 border border-black rounded text-black bg-white hover:bg-gray-50 disabled:opacity-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="bought">Bought</option>
                <option value="in_inventory">In Inventory</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Actions */}
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deleting === item.id}
              className="w-full px-3 py-2 border border-black text-black rounded hover:bg-red-50 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {deleting === item.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
