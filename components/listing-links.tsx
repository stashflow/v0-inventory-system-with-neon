import { Link, X } from 'lucide-react';
import { useState } from 'react';
import { mutate } from 'swr';

interface ListingLinksProps {
  listings: Array<{ id: string; platform: string; listing_url: string }>;
  itemId: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-900 border-blue-300',
  ebay: 'bg-red-100 text-red-900 border-red-300',
  amazon: 'bg-orange-100 text-orange-900 border-orange-300',
  etsy: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  mercari: 'bg-pink-100 text-pink-900 border-pink-300',
  depop: 'bg-purple-100 text-purple-900 border-purple-300',
  poshmark: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  other: 'bg-gray-100 text-gray-900 border-gray-300',
};

export function ListingLinks({ listings, itemId }: ListingLinksProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (listingId: string) => {
    setDeleting(listingId);
    try {
      const response = await fetch(`/api/items/${itemId}/listings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) throw new Error('Failed to delete listing');
      mutate(`/api/items/${itemId}/listings`);
    } catch (error) {
      console.error('[v0] Error deleting listing:', error);
      alert('Failed to delete listing');
    } finally {
      setDeleting(null);
    }
  };

  if (!listings || listings.length === 0) {
    return <div className="text-sm text-gray-500">No listings</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {listings.map((listing) => (
        <a
          key={listing.id}
          href={listing.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm border transition-opacity hover:opacity-80 ${
            PLATFORM_COLORS[listing.platform.toLowerCase()] || PLATFORM_COLORS.other
          }`}
        >
          <Link size={14} />
          <span className="capitalize">{listing.platform}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDelete(listing.id);
            }}
            disabled={deleting === listing.id}
            className="ml-1 hover:scale-125 disabled:opacity-50 transition-transform"
          >
            <X size={14} />
          </button>
        </a>
      ))}
    </div>
  );
}
