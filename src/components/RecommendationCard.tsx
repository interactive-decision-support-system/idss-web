'use client';

import { Product, UnifiedProduct } from '@/types/chat';
import { currentDomainConfig } from '@/config/domain-config';
import { isSoldOut } from '@/utils/inventory';
import VehicleCard from '@/components/cards/VehicleCard';
import LaptopCard from '@/components/cards/LaptopCard';
import BookCard from '@/components/cards/BookCard';

interface RecommendationCardProps {
  product?: Product | null;
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
  onAddToCart?: (product: Product) => void;
}

export default function RecommendationCard({
  product,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
}: RecommendationCardProps) {
  const config = currentDomainConfig;

  if (!product) {
    return null;
  }

  // Unified Product Dispatch
  // We assume that if productType is one of these, it matches the UnifiedProduct schema
  if (product.productType === 'vehicle') {
    return (
      <VehicleCard
        data={product as UnifiedProduct}
        onItemSelect={onItemSelect as ((p: UnifiedProduct) => void) | undefined}
        onToggleFavorite={onToggleFavorite as ((p: UnifiedProduct) => void) | undefined}
        isFavorite={isFavorite}
        onAddToCart={onAddToCart as ((p: UnifiedProduct) => void) | undefined}
      />
    );
  }
  if (product.productType === 'laptop') {
    return (
      <LaptopCard
        data={product as UnifiedProduct}
        onItemSelect={onItemSelect as ((p: UnifiedProduct) => void) | undefined}
        onToggleFavorite={onToggleFavorite as ((p: UnifiedProduct) => void) | undefined}
        isFavorite={isFavorite}
        onAddToCart={onAddToCart as ((p: UnifiedProduct) => void) | undefined}
      />
    );
  }
  if (product.productType === 'book') {
    return (
      <BookCard
        data={product as UnifiedProduct}
        onItemSelect={onItemSelect as ((p: UnifiedProduct) => void) | undefined}
        onToggleFavorite={onToggleFavorite as ((p: UnifiedProduct) => void) | undefined}
        isFavorite={isFavorite}
        onAddToCart={onAddToCart as ((p: UnifiedProduct) => void) | undefined}
      />
    );
  }

  // --- Legacy / Generic Card Rendering ---

  // Show a compact subset so 3 cards fit per row
  const fieldsToShow = config.recommendationCardFields.slice(0, 3);

  // Render field based on config
  const renderField = (fieldConfig: typeof config.recommendationCardFields[0]) => {
    // Special handling for category field - check both part_type and category
    let value = product[fieldConfig.key];
    if (fieldConfig.key === 'part_type' && (value === undefined || value === null)) {
      value = product['category'];
    }

    // Check condition if provided
    if (fieldConfig.condition && !fieldConfig.condition(product)) {
      return null;
    }

    // Don't render if value is undefined/null
    if (value === undefined || value === null) {
      return null;
    }

    const displayValue = fieldConfig.format
      ? fieldConfig.format(value)
      : String(value);

    return (
      <div key={fieldConfig.key} className="flex items-baseline justify-between gap-3">
        <span className={fieldConfig.labelClassName ?? 'text-xs text-black/60'}>
          {fieldConfig.label}
        </span>
        <span
          className={
            fieldConfig.valueClassName ??
            (fieldConfig.key === 'price'
              ? 'text-sm font-bold text-[#8C1515]'
              : 'text-sm text-black')
          }
        >
          {displayValue}
          {fieldConfig.key === 'rating' && (product as { rating_count?: number }).rating_count && ` (${(product as { rating_count?: number }).rating_count})`}
        </span>
      </div>
    );
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(product);
  };

  const favorited = Boolean(isFavorite && isFavorite(product.id));

  // Handle UnifiedProduct in generic fallback (map new fields to old structure if needed, or rely on them being similar)
  // UnifiedProduct has 'image.primary' instead of 'image_url' or 'primaryImage'.
  // UnifiedProduct has 'name' instead of 'title'.
  // Adapt for display:
  const p = product as { name?: string; image?: { primary?: string }; image_url?: string; primaryImage?: string; title?: string };
  const displayTitle = p.name || p.title || 'Product';
  const displayImage = p.image?.primary || p.image_url || p.primaryImage;

  return (
    <div className="bg-white border border-black/10 rounded-xl p-3 hover:border-black/20 transition-all duration-200">
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
        {(() => {
          return displayImage ? (
            <img
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-text')) {
                  const fallback = document.createElement('div');
                  // Make sure overlays (like the heart) remain clickable.
                  fallback.className =
                    'fallback-text pointer-events-none text-black/40 text-xs absolute inset-0 flex items-center justify-center text-center px-2';
                  fallback.textContent = 'No Image';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="pointer-events-none text-black/40 text-xs text-center px-2">No Image</div>
          );
        })()}

        {/* Like button (per product) */}
        {onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all duration-200 border border-black/10"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            title={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <svg
              className={`w-5 h-5 transition-all duration-200 ${favorited ? 'text-[#ff1323] fill-[#ff1323]' : 'text-black/50'
                }`}
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Details under image */}
      <div className="mt-3 space-y-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-black leading-tight line-clamp-2">
            {displayTitle}
          </h4>
          {(() => {
            const subtitleKey = config.recommendationCardSubtitleKey;
            const subtitleValue = subtitleKey ? product[subtitleKey] : undefined;
            return subtitleValue ? (
              <p className={(config.recommendationCardSubtitleClassName ?? 'text-sm text-black/60') + ' truncate'}>
                {String(subtitleValue)}
              </p>
            ) : null;
          })()}
        </div>

        <div className="space-y-1">
          {fieldsToShow.map(renderField)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onItemSelect && onItemSelect(product)}
            className="text-left text-sm text-[#8C1515] hover:text-[#750013] font-medium"
          >
            {config.viewDetailsButtonText} →
          </button>
          {onAddToCart && (
            <>
              {isSoldOut(product) ? (
                <span className="text-xs text-red-600 font-medium">Sold out</span>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="text-sm font-medium text-[#8C1515] hover:text-[#750013]"
                >
                  Add to cart
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
