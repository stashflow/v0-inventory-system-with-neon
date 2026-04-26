import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { mutate } from 'swr';

interface ImageCarouselProps {
  images: Array<{ id: string; image_url: string }>;
  itemId: string;
}

export function ImageCarousel({ images, itemId }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (imageId: string) => {
    setDeleting(imageId);
    try {
      const response = await fetch(`/api/items/${itemId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) throw new Error('Failed to delete image');
      mutate(`/api/items/${itemId}/images`);
    } catch (error) {
      console.error('[v0] Error deleting image:', error);
      alert('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-500">
        No images
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeIndex];

  if (!currentImage) {
    return (
      <div className="w-full h-48 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-500">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-48 bg-gray-100 border border-black rounded overflow-hidden">
        <img
          src={currentImage.image_url}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-1 rounded hover:bg-black transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-1 rounded hover:bg-black transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <button
          onClick={() => handleDelete(currentImage.id)}
          disabled={deleting === currentImage.id}
          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-12 w-12 rounded border-2 flex-shrink-0 overflow-hidden transition-colors ${
                idx === currentIndex ? 'border-black' : 'border-gray-300'
              }`}
            >
              <img src={img.image_url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
