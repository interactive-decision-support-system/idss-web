'use client';

import { Product } from '@/types/chat';

interface FavoritesPageProps {
  favorites: Product[];
  onToggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  onItemSelect: (product: Product) => void;
  onClose: () => void;
}

export default function FavoritesPage({ favorites, onToggleFavorite, isFavorite, onItemSelect, onClose }: FavoritesPageProps) {
  const primaryImage = (product: Product) => (product.image_url as string) || (product.primaryImage as string) || undefined;
  const hasValidImage = (product: Product) => {
    const img = primaryImage(product);
    return img && typeof img === 'string' && img.trim().length > 0 && !img.toLowerCase().includes('.svg');
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-black">Favorites</h2>
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
                className="bg-white rounded-lg p-3 border border-[#8b959e]/30 hover:border-[#8b959e]/40 transition-all duration-200 cursor-pointer"
                onClick={() => onItemSelect(product)}
              >
                {/* Image */}
                <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  {hasValidImage(product) ? (
                    <img
                      src={primaryImage(product)!}
                      alt={product.title}
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
                    {product.title}
                  </h4>
                  {(product.brand || product.source) && (
                    <p className="text-xs text-black/50">
                      {[product.brand, product.source].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {(product.price_text || product.price) && (
                    <p className="text-sm font-bold text-[#8C1515]">
                      {product.price_text || (product.price ? `$${product.price.toLocaleString()}` : 'N/A')}
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