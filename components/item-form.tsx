'use client';

import { useState, useRef } from 'react';
import { mutate } from 'swr';
import { X } from 'lucide-react';

interface ItemFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ItemForm({ onSuccess, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price_bought: '',
    price_selling: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [listings, setListings] = useState<Array<{ platform: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setImageUrls([...imageUrls, data.url]);
    } catch (error) {
      console.error('[v0] Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleAddListing = () => {
    setListings([...listings, { platform: 'facebook', url: '' }]);
  };

  const handleRemoveListing = (index: number) => {
    setListings(listings.filter((_, i) => i !== index));
  };

  const handleUpdateListing = (index: number, field: 'platform' | 'url', value: string) => {
    const newListings = [...listings];
    newListings[index] = { ...newListings[index], [field]: value };
    setListings(newListings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price_bought: formData.price_bought ? parseFloat(formData.price_bought) : null,
          price_selling: formData.price_selling ? parseFloat(formData.price_selling) : null,
          image_url: imageUrls[0] || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create item');
      const item = await response.json();

      // Add additional images
      for (let i = 1; i < imageUrls.length; i++) {
        await fetch(`/api/items/${item.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrls[i] }),
        });
      }

      // Add listings
      for (const listing of listings) {
        if (listing.url) {
          await fetch(`/api/items/${item.id}/listings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: listing.platform, url: listing.url }),
          });
        }
      }

      setFormData({ name: '', price_bought: '', price_selling: '' });
      setImageUrls([]);
      setListings([]);
      mutate('/api/items');
      onSuccess();
    } catch (error) {
      console.error('[v0] Error creating item:', error);
      alert('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Images
          </label>
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              accept="image/*"
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2 border border-black text-black rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 border border-black rounded overflow-hidden">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Item Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            placeholder="e.g., iPhone 15"
          />
        </div>

        {/* Price Bought */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Price Bought ($) <span className="text-gray-400 font-normal">optional</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price_bought}
            onChange={(e) => setFormData({ ...formData, price_bought: e.target.value })}
            className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            placeholder="0.00"
          />
        </div>

        {/* Price Selling */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Price Selling ($) <span className="text-gray-400 font-normal">optional</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price_selling}
            onChange={(e) => setFormData({ ...formData, price_selling: e.target.value })}
            className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            placeholder="0.00"
          />
        </div>

        {/* Listing Links */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Listing Links
          </label>
          <div className="space-y-2">
            {listings.map((listing, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <select
                  value={listing.platform}
                  onChange={(e) => handleUpdateListing(idx, 'platform', e.target.value)}
                  className="px-3 py-2 border border-black rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="facebook">Facebook Marketplace</option>
                  <option value="ebay">eBay</option>
                  <option value="amazon">Amazon</option>
                  <option value="etsy">Etsy</option>
                  <option value="mercari">Mercari</option>
                  <option value="depop">Depop</option>
                  <option value="poshmark">Poshmark</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="url"
                  value={listing.url}
                  onChange={(e) => handleUpdateListing(idx, 'url', e.target.value)}
                  placeholder="Listing URL"
                  className="flex-1 px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveListing(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddListing}
              className="w-full px-4 py-2 border border-black text-black rounded hover:bg-gray-100 transition-colors text-sm"
            >
              + Add Listing Link
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Adding...' : 'Add Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-black text-black px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
