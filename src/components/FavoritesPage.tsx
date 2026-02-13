'use client';

import { Product } from '@/types/chat';

interface FavoritesPageProps {
  favorites: Product[];
  onToggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  onItemSelect: (product: Product) => void;
  onClose: () => void;
}

function getDisplayTitle(product: Product): string {
  return (product as { name?: string }).name ?? (product as { title?: string }).title ?? 'Product';
}

function getPrimaryImage(product: Product): string | undefined {
  const p = product as { image?: { primary?: string }; image_url?: string; primaryImage?: string };
  return p.image?.primary || p.image_url || p.primaryImage || undefined;
}

export default function FavoritesPage({ favorites, onToggleFavorite, isFavorite, onItemSelect, onClose }: FavoritesPageProps) {
  const primaryImage = (product: Product) => getPrimaryImage(product);
  const hasValidImage = (product: Product) => {
    const img = primaryImage(product);
    return img && typeof img === 'string' && img.trim().length > 0 && !img.toLowerCase().includes('.svg');
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-black">Favorites</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-black/60 text-sm">No favorites yet</p>
            <p className="text-black/40 text-xs mt-1">Start liking products to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg p-3 border border-black/10 hover:border-black/20 transition-all duration-200 cursor-pointer"
                onClick={() => onItemSelect(product)}
              >
                {/* Image */}
                <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  {hasValidImage(product) ? (
                    <img
                      src={primaryImage(product)!}
                      alt={getDisplayTitle(product)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-text')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-text text-black/40 text-xs absolute inset-0 flex items-center justify-center text-center px-2';
                          fallback.textContent = 'No Image';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="text-black/40 text-xs text-center px-2">No Image</div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-black leading-tight line-clamp-2">
                    {getDisplayTitle(product)}
                  </h4>
                  {((product as { brand?: string }).brand || (product as { source?: string }).source) && (
                    <p className="text-xs text-black/50">
                      {[(product as { brand?: string }).brand, (product as { source?: string }).source].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {((product as { price_text?: string }).price_text || (product as { price?: number }).price) && (
                    <p className="text-sm font-bold text-[#8C1515]">
                      {(product as { price_text?: string }).price_text || ((product as { price?: number }).price ? `$${(product as { price?: number }).price!.toLocaleString()}` : 'N/A')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
