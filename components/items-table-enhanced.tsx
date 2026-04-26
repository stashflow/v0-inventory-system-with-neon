'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { ImageCarousel } from './image-carousel';
import { ListingLinks } from './listing-links';
import { StatusBadge } from './status-badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ItemsTableProps {
  items: Array<{
    id: string;
    name: string;
    price_bought: number;
    price_selling: number;
    status: string;
    image_url: string | null;
    created_at: string;
  }>;
}

export function ItemsTableEnhanced({ items }: ItemsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: allImages } = useSWR(
    expandedId ? `/api/items/${expandedId}/images` : null,
    (url) => fetch(url).then((r) => r.json())
  );

  const { data: allListings } = useSWR(
    expandedId ? `/api/items/${expandedId}/listings` : null,
    (url) => fetch(url).then((r) => r.json())
  );

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      mutate('/api/items');
    } catch (error) {
      console.error('[v0] Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setDeleting(itemId);
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');
      mutate('/api/items');
    } catch (error) {
      console.error('[v0] Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const profit = item.price_selling - item.price_bought;
        const isExpanded = expandedId === item.id;

        return (
          <div key={item.id} className="border border-black rounded overflow-hidden">
            {/* Header Row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <div className="w-12 h-12 rounded overflow-hidden border border-gray-300 flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-black truncate">{item.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.price_bought > 0 || item.price_selling > 0 ? (
                      <>
                        {item.price_bought > 0 ? `$${item.price_bought.toFixed(2)}` : '-'}
                        {' → '}
                        {item.price_selling > 0 ? `$${item.price_selling.toFixed(2)}` : '-'}
                      </>
                    ) : (
                      <span className="text-gray-400">No prices set</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(item.price_bought > 0 || item.price_selling > 0) && (
                  <div className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </div>
                )}
                <StatusBadge status={item.status} />
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-black bg-gray-50 p-4 space-y-4">
                {/* Images */}
                <div>
                  <h4 className="font-medium text-black mb-2">Images</h4>
                  {allImages && <ImageCarousel images={allImages} itemId={item.id} />}
                </div>

                {/* Listings */}
                <div>
                  <h4 className="font-medium text-black mb-2">Listing Links</h4>
                  {allListings && <ListingLinks listings={allListings} itemId={item.id} />}
                </div>

                {/* Status & Actions */}
                <div className="flex gap-2 pt-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-3 py-2 border border-black rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  >
                    <option value="bought">Bought</option>
                    <option value="in_inventory">In Inventory</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
