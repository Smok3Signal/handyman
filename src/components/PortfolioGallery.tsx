"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
  editable?: boolean;
  onDelete?: (id: string) => void;
}

export default function PortfolioGallery({
  items, editable = false, onDelete,
}: PortfolioGalleryProps) {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
        <p className="text-sm">No portfolio items yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <button
                onClick={() => setSelected(item)}
                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
              >
                <ZoomIn size={16} />
              </button>
              {editable && onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 p-2">
              <p className="text-white text-xs font-medium truncate">{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.imageUrl}
              alt={selected.title}
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{selected.title}</h3>
              {selected.description && (
                <p className="text-gray-500 text-sm mt-1">{selected.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full shadow"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}