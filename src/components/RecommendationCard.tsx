'use client';

import { Product, UnifiedProduct } from '@/types/chat';
import Image from 'next/image';
import { getDomainConfigForProduct } from '@/config/domain-config';
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
  // Resolve domain from product (category/productType) so cards use the right fields
  const config = getDomainConfigForProduct(product as Record<string, unknown> & { productType?: string });

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
    <div className="card hover:border-black/20 transition-all duration-200">
      {/* Image */}
  <div className="aspect-square bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
        {(() => {
          return displayImage ? (
            <Image
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 600px) 100vw, 33vw"
              onError={() => {}}
              priority={false}
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
          {/* Rating stars and count */}
          {typeof product.rating === 'number' && (
            <div className="flex items-center gap-1 mt-1">
              {/* Stars */}
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(product.rating as number) ? 'text-yellow-400' : 'text-black/15'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.538 1.118l-3.388-2.462a1 1 0 00-1.175 0l-3.388 2.462c-.783.57-1.838-.197-1.538-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
                </svg>
              ))}
              {/* Count */}
              {typeof product.rating_count === 'number' && (
                <span className="text-xs text-[#6B6B6B] ml-2">({product.rating_count as number})</span>
              )}
            </div>
          )}
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

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onItemSelect && onItemSelect(product)}
            className="text-left text-sm text-[#8C1515] hover:text-[#750013] font-medium"
          >
            {config.viewDetailsButtonText} →
          </button>
          {onAddToCart && (
            isSoldOut(product) ? (
              <span className="text-xs text-red-600 font-medium">Sold out</span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(product);
                }}
                className="w-9 h-9 flex items-center justify-center text-[#8C1515] hover:text-[#750013] transition-colors shrink-0"
                aria-label="Add to cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
