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
  onAskAI?: (product: Product) => void;
}

export default function RecommendationCard({
  product,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
  onAskAI,
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
        onAskAI={onAskAI as ((p: UnifiedProduct) => void) | undefined}
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
  const config = getDomainConfigForProduct(product as Record<string, unknown> & { productType?: string });

  // Price pill value from config fields (first field with key 'price' or format that returns $)
  const priceField = config.recommendationCardFields.find(f => f.key === 'price');
  const priceValue = priceField
    ? (priceField.format ? priceField.format(product[priceField.key]) : String(product[priceField.key] ?? ''))
    : null;

  // Up to 2 non-price metadata pills (category, part_type, brand, etc.)
  const metaFields = config.recommendationCardFields
    .filter(f => f.key !== 'price' && f.key !== 'rating')
    .slice(0, 2);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(product);
  };

  const favorited = Boolean(isFavorite && isFavorite(product.id));

  const p = product as { name?: string; image?: { primary?: string }; image_url?: string; primaryImage?: string; title?: string };
  const displayTitle = p.name || p.title || 'Product';
  const displayImage = p.image?.primary || p.image_url || p.primaryImage;

  return (
    <div className="card hover:border-black/20 transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-video bg-gradient-to-br from-[#8C1515]/8 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
        {displayImage ? (
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
        )}

        {onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all border border-black/10"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <svg
              className={`w-4 h-4 ${favorited ? 'text-[#8C1515] fill-[#8C1515]' : 'text-black/50'}`}
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 flex-1 flex flex-col gap-1.5">
        <h4 className="text-sm font-semibold text-black leading-snug line-clamp-2">{displayTitle}</h4>

        <div className="flex items-baseline justify-between gap-2">
          {priceValue && (
            <span className="text-sm font-bold text-[#8C1515]">{priceValue}</span>
          )}
          {typeof product.rating === 'number' && (
            <span className="text-xs text-black/50">
              ⭐ {(product.rating as number).toFixed(1)}
              {typeof product.rating_count === 'number' && ` (${product.rating_count})`}
            </span>
          )}
        </div>

        {/* Meta pills */}
        {metaFields.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metaFields.map(f => {
              let val = product[f.key];
              if (f.key === 'part_type' && val == null) val = product['category'];
              if (f.condition && !f.condition(product)) return null;
              if (val == null) return null;
              const display = f.format ? f.format(val) : String(val);
              return (
                <span key={f.key} className="text-[10px] bg-black/5 text-black/55 px-1.5 py-0.5 rounded border border-black/8">
                  {display}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="mt-3 pt-2.5 border-t border-black/8 flex items-center justify-between gap-2">
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
              className="w-8 h-8 flex items-center justify-center text-[#8C1515] hover:text-[#750013] transition-colors shrink-0"
              aria-label="Add to cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}
