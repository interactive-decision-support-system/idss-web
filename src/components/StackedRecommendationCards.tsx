'use client';

import { Product, UnifiedProduct } from '@/types/chat';
import Image from 'next/image';
import RecommendationCard from './RecommendationCard';
import { isSoldOut } from '@/utils/inventory';

// ---------------------------------------------------------------------------
// Helpers — derive factual "why we picked this" tags from product attributes
// ---------------------------------------------------------------------------

function _parseGb(s: unknown): number {
  if (typeof s === 'number') return s;
  if (typeof s === 'string') return parseInt(s) || 0;
  return 0;
}

function _parseHours(s: unknown): number {
  if (typeof s === 'number') return s;
  if (typeof s === 'string') return parseInt(s) || 0;
  return 0;
}

function _spec(product: Product, laptopKey: string, altKey?: string): unknown {
  const p = product as Record<string, unknown>;
  const specs = ((p.laptop as Record<string, unknown> | undefined)?.specs) as Record<string, unknown> | undefined;
  if (specs) {
    if (specs[laptopKey] != null) return specs[laptopKey];
    if (altKey && specs[altKey] != null) return specs[altKey];
  }
  if (p[laptopKey] != null) return p[laptopKey];
  if (altKey && p[altKey] != null) return p[altKey];
  return undefined;
}

/** Up to 4 factual pros tags for a product. */
function getProductPros(product: Product): string[] {
  const p = product as Record<string, unknown>;
  const pros: string[] = [];

  const stRaw = _spec(product, 'storage_type');
  const st = typeof stRaw === 'string' ? stRaw.toUpperCase() : '';
  if (st === 'SSD') pros.push('Fast SSD');

  const ram = _parseGb(_spec(product, 'ram'));
  if (ram >= 32) pros.push(`${ram} GB RAM`);
  else if (ram >= 16) pros.push('16 GB RAM');

  const gpuRaw = _spec(product, 'graphics', 'gpu');
  if (gpuRaw && typeof gpuRaw === 'string') pros.push('Dedicated GPU');

  const cpuRaw = _spec(product, 'processor', 'cpu');
  const cpu = typeof cpuRaw === 'string' ? cpuRaw.toLowerCase() : '';
  if (cpu.match(/\b(m3|m4|i9|ryzen 9|ultra 9|ultra 7)\b/)) pros.push('High-end CPU');

  const batt = _parseHours(_spec(product, 'battery_life'));
  if (batt >= 12) pros.push('All-day battery');
  else if (batt >= 8) pros.push('Good battery');

  const src = typeof p.source === 'string' ? p.source : '';
  if (src === 'Framework' || src === 'System76') pros.push('Modular & repairable');

  const rating = typeof p.rating === 'number' ? p.rating : 0;
  if (rating >= 4.5) pros.push('Highly rated');

  const price = typeof p.price === 'number' ? p.price : 0;
  if (pros.length === 0) {
    if (price > 0 && price < 600) pros.push('Budget-friendly');
    else if (price >= 600 && price < 1200) pros.push('Mid-range value');
    else if (price >= 1200) pros.push('Premium tier');
  }

  return pros.slice(0, 4);
}

/** One-sentence highlight comparing a product against its row siblings. */
function getProductHighlight(product: Product, row: Product[]): string | null {
  if (row.length <= 1) return null;
  const p = product as Record<string, unknown>;
  const others = row.filter(o => o.id !== product.id);

  const price = typeof p.price === 'number' ? p.price : Infinity;
  const otherPrices = others.map(o => typeof (o as Record<string, unknown>).price === 'number' ? (o as Record<string, unknown>).price as number : Infinity);
  if (price < Infinity && otherPrices.every(op => price < op)) return 'Lowest price in this group';
  if (price < Infinity && otherPrices.every(op => price > op)) return 'Premium pick — highest spec ceiling';

  const ram = _parseGb(_spec(product, 'ram'));
  const otherRams = others.map(o => _parseGb(_spec(o, 'ram')));
  if (ram > 0 && otherRams.every(or => ram > or)) return `Most RAM — ${_spec(product, 'ram')}`;

  const batt = _parseHours(_spec(product, 'battery_life'));
  const otherBatts = others.map(o => _parseHours(_spec(o, 'battery_life')));
  if (batt > 0 && otherBatts.every(ob => batt > ob)) return `Longest battery — ${_spec(product, 'battery_life')}`;

  const rating = typeof p.rating === 'number' ? p.rating : 0;
  const otherRatings = others.map(o => typeof (o as Record<string, unknown>).rating === 'number' ? (o as Record<string, unknown>).rating as number : 0);
  if (rating >= 4.0 && otherRatings.every(or => rating > or)) return 'Best-rated in this group';

  const gpuRaw = _spec(product, 'graphics', 'gpu');
  if (gpuRaw && others.every(o => !_spec(o, 'graphics', 'gpu'))) return 'Only one with dedicated GPU';

  const stRaw = _spec(product, 'storage_type');
  const stype = typeof stRaw === 'string' ? stRaw.toUpperCase() : '';
  if (stype === 'SSD' && others.every(o => {
    const oSt = _spec(o, 'storage_type');
    return typeof oSt !== 'string' || oSt.toUpperCase() !== 'SSD';
  })) return 'Only SSD option here';

  return null;
}

// ---------------------------------------------------------------------------
// BestPickHero — prominent first-card treatment
// ---------------------------------------------------------------------------

interface BestPickHeroProps {
  product: Product;
  allProducts: Product[]; // sibling products for relative highlight
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
  onAddToCart?: (product: Product) => void;
}

function BestPickHero({
  product,
  allProducts,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
}: BestPickHeroProps) {
  const p = product as Record<string, unknown>;

  const name: string = (p.name as string) || (p.title as string) || 'Product';
  const price: number | null = typeof p.price === 'number' ? p.price : null;
  const rating: number | null = typeof p.rating === 'number' ? p.rating : null;
  const reviewsCount: number | null = typeof p.reviews_count === 'number' ? p.reviews_count : null;
  const imgSrc: string | null =
    (p.image as { primary?: string } | undefined)?.primary ||
    (p.image_url as string | undefined) ||
    (p.primaryImage as string | undefined) ||
    null;

  const pros = getProductPros(product);
  const highlight = getProductHighlight(product, allProducts);
  const favorited = Boolean(isFavorite && isFavorite(product.id));
  const soldOut = isSoldOut(product);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(product);
  };

  return (
    <div className="rounded-xl border border-[#8C1515]/25 bg-gradient-to-br from-[#8C1515]/5 to-white p-4 sm:p-5">
      {/* Badge */}
      <div className="flex items-center gap-1.5 mb-4">
        <svg className="w-4 h-4 text-[#8C1515]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.538 1.118l-3.388-2.462a1 1 0 00-1.175 0l-3.388 2.462c-.783.57-1.838-.197-1.538-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
        </svg>
        <span className="text-xs font-bold text-[#8C1515] uppercase tracking-widest">Best Pick for You</span>
      </div>

      {/* Horizontal layout: image + details */}
      <div className="flex gap-4 items-start">
        {/* Image */}
        <div className="w-28 sm:w-36 shrink-0 aspect-square relative rounded-lg overflow-hidden bg-black/5">
          {imgSrc ? (
            <Image src={imgSrc} alt={name} fill className="object-cover" sizes="144px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">No Image</div>
          )}
          {/* Fav button */}
          {onToggleFavorite && (
            <button
              onClick={handleFav}
              className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center border border-black/10 shadow-sm"
              aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <svg className={`w-3.5 h-3.5 ${favorited ? 'text-[#ff1323] fill-[#ff1323]' : 'text-black/40'}`}
                fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">{name}</h3>

          {/* Price + rating row */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {price !== null && (
              <span className="text-[#8C1515] font-bold text-lg">${price.toLocaleString()}</span>
            )}
            {rating !== null && (
              <span className="text-xs text-black/50">
                ⭐ {rating.toFixed(1)}
                {reviewsCount !== null && reviewsCount > 0 && <> · {reviewsCount.toLocaleString()} reviews</>}
              </span>
            )}
          </div>

          {/* Highlight sentence */}
          {highlight && (
            <p className="text-xs text-black/55 italic">{highlight}</p>
          )}

          {/* Why-tags */}
          {pros.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pros.map((pro, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[#8C1515]/8 text-[#8C1515] border border-[#8C1515]/20 font-medium">
                  ✓ {pro}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => onItemSelect && onItemSelect(product)}
              className="text-sm font-semibold text-[#8C1515] hover:text-[#750013] flex items-center gap-1"
            >
              View Details →
            </button>
            {onAddToCart && (
              soldOut ? (
                <span className="text-xs text-red-600 font-medium">Sold out</span>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#8C1515] text-white hover:bg-[#750013] transition-colors"
                >
                  Add to Cart
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface StackedRecommendationCardsProps {
  recommendations: Product[][];
  bucket_labels?: string[];
  diversification_dimension?: string;
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
  onAddToCart?: (product: Product) => void;
  onAskAI?: (product: Product) => void;
}

export default function StackedRecommendationCards({
  recommendations,
  bucket_labels,
  diversification_dimension,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
  onAskAI,
}: StackedRecommendationCardsProps) {
  if (!recommendations || recommendations.length === 0) return null;

  // Best pick = first product of first row
  const firstRow = recommendations[0] ?? [];
  const bestPick = firstRow[0] ?? null;

  // Alternatives = rest of first row + subsequent rows (capped at 3 rows total)
  // Flatten into a single cluster so it reads as "other options", not sub-ranked buckets
  const altProducts: Product[] = [];
  firstRow.slice(1).forEach(p => altProducts.push(p));
  recommendations.slice(1, 3).forEach(row => row.slice(0, 3).forEach(p => altProducts.push(p)));

  // All products in first row used for relative comparisons in hero
  const allFirstRow = firstRow.slice(0, 3);

  return (
    <div className="space-y-6 mt-4">
      {/* Optional diversification header */}
      {diversification_dimension && (
        <p className="text-xs text-black/45 uppercase tracking-widest font-semibold">
          Diversified by: {diversification_dimension}
        </p>
      )}

      {/* Best Pick hero */}
      {bestPick && (
        <BestPickHero
          product={bestPick}
          allProducts={allFirstRow}
          onItemSelect={onItemSelect}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Alternatives cluster */}
      {altProducts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-black/40 uppercase tracking-widest">
            {bucket_labels && bucket_labels.length > 1
              ? 'More Options'
              : 'Alternatives'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {altProducts.slice(0, 6).map((product) => (
              <RecommendationCard
                key={product.id}
                product={product}
                onItemSelect={onItemSelect}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                onAddToCart={onAddToCart}
                onAskAI={onAskAI}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
