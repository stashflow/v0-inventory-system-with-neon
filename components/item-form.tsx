'use client';

import { useState, useRef } from 'react';
import { mutate } from 'swr';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
      setImageUrl(data.url);
    } catch (error) {
      console.error('[v0] Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_bought: parseFloat(formData.price_bought),
          price_selling: parseFloat(formData.price_selling),
          image_url: imageUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to create item');

      setFormData({ name: '', price_bought: '', price_selling: '' });
      setImageUrl(null);
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
            Image
          </label>
          <div className="flex gap-4 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            {imageUrl && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 border border-black rounded overflow-hidden">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-xs text-gray-600 hover:text-black"
                >
                  Remove
                </button>
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
            Price Bought ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price_bought}
            onChange={(e) => setFormData({ ...formData, price_bought: e.target.value })}
            required
            className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            placeholder="0.00"
          />
        </div>

        {/* Price Selling */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Price Selling ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price_selling}
            onChange={(e) => setFormData({ ...formData, price_selling: e.target.value })}
            required
            className="w-full px-3 py-2 border border-black rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            placeholder="0.00"
          />
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
