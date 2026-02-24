'use client';

import { Product } from '@/types/chat';
import RecommendationCard from './RecommendationCard';

// ---------------------------------------------------------------------------
// Helpers — derive human-readable pros tags from product attributes
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

/**
 * Read a spec field from a UnifiedProduct, trying laptop.specs first then
 * top-level (for legacy/vehicle products that store fields flat).
 */
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

/** Return up to 4 factual pros tags for a product. */
function getProductPros(product: Product): string[] {
  const p = product as Record<string, unknown>;
  const pros: string[] = [];

  // Storage type — fast SSD vs HDD
  const stRaw = _spec(product, 'storage_type');
  const st = typeof stRaw === 'string' ? stRaw.toUpperCase() : '';
  if (st === 'SSD') pros.push('Fast SSD');

  // RAM tier — "16 GB" string or raw number
  const ram = _parseGb(_spec(product, 'ram'));
  if (ram >= 32) pros.push(`${ram} GB RAM`);
  else if (ram >= 16) pros.push('16 GB RAM');

  // Dedicated GPU (laptop.specs uses 'graphics'; top-level raw may use 'gpu')
  const gpuRaw = _spec(product, 'graphics', 'gpu');
  if (gpuRaw && typeof gpuRaw === 'string') pros.push('Dedicated GPU');

  // High-end CPU keywords
  const cpuRaw = _spec(product, 'processor', 'cpu');
  const cpu = typeof cpuRaw === 'string' ? cpuRaw.toLowerCase() : '';
  if (cpu.match(/\b(m3|m4|i9|ryzen 9|ultra 9|ultra 7)\b/)) pros.push('High-end CPU');

  // Long battery life — "12 hrs" string or raw number
  const batt = _parseHours(_spec(product, 'battery_life'));
  if (batt >= 12) pros.push('All-day battery');
  else if (batt >= 8) pros.push('Good battery');

  // Source-inferred repairable (Framework / System76)
  const src = typeof p.source === 'string' ? p.source : '';
  if (src === 'Framework' || src === 'System76') pros.push('Modular & repairable');

  // Highly rated
  const rating = typeof p.rating === 'number' ? p.rating : 0;
  if (rating >= 4.5) pros.push('Highly rated');

  // Price tier — only if no other tags derived yet (fallback signal)
  const price = typeof p.price === 'number' ? p.price : 0;
  if (pros.length === 0) {
    if (price > 0 && price < 600) pros.push('Budget-friendly');
    else if (price >= 600 && price < 1200) pros.push('Mid-range value');
    else if (price >= 1200) pros.push('Premium tier');
  }

  return pros.slice(0, 4);
}

/** Return one sentence explaining why this product stands out relative to its bucket siblings. */
function getProductHighlight(product: Product, row: Product[]): string | null {
  if (row.length <= 1) return null;

  const p = product as Record<string, unknown>;
  const others = row.filter(o => o.id !== product.id);

  const price = typeof p.price === 'number' ? p.price : Infinity;
  const otherPrices = others.map(o => typeof (o as Record<string, unknown>).price === 'number' ? (o as Record<string, unknown>).price as number : Infinity);
  if (price < Infinity && otherPrices.every(op => price < op)) return 'Cheapest option in this tier';
  if (price < Infinity && otherPrices.every(op => price > op)) return 'Top-tier performance pick';

  const ram = _parseGb(_spec(product, 'ram'));
  const otherRams = others.map(o => _parseGb(_spec(o, 'ram')));
  if (ram > 0 && otherRams.every(or => ram > or)) return `Most RAM — ${_spec(product, 'ram')}`;

  const batt = _parseHours(_spec(product, 'battery_life'));
  const otherBatts = others.map(o => _parseHours(_spec(o, 'battery_life')));
  if (batt > 0 && otherBatts.every(ob => batt > ob)) return `Best battery — ${_spec(product, 'battery_life')}`;

  const rating = typeof p.rating === 'number' ? p.rating : 0;
  const otherRatings = others.map(o => typeof (o as Record<string, unknown>).rating === 'number' ? (o as Record<string, unknown>).rating as number : 0);
  if (rating >= 4.0 && otherRatings.every(or => rating > or)) return 'Best-rated in this group';

  const gpuRaw = _spec(product, 'graphics', 'gpu');
  if (gpuRaw && others.every(o => !_spec(o, 'graphics', 'gpu'))) return 'Only one with dedicated GPU';

  const stRaw = _spec(product, 'storage_type');
  const st = typeof stRaw === 'string' ? stRaw.toUpperCase() : '';
  if (st === 'SSD' && others.every(o => {
    const oSt = _spec(o, 'storage_type');
    return typeof oSt !== 'string' || oSt.toUpperCase() !== 'SSD';
  })) return 'Only SSD option here';

  return null;
}

interface StackedRecommendationCardsProps {
  recommendations: Product[][]; // 2D array: rows of products
  bucket_labels?: string[]; // Labels for each row
  diversification_dimension?: string; // Dimension used for diversification
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
  onAddToCart?: (product: Product) => void;
}

export default function StackedRecommendationCards({
  recommendations,
  bucket_labels,
  diversification_dimension,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
}: StackedRecommendationCardsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Limit to 3 rows maximum
  const rowsToShow = recommendations.slice(0, 3);

  return (
    <div className="space-y-8 mt-6">
      {/* Diversification Header - Above all rows */}
      {diversification_dimension && (
        <div className="pb-2 border-b border-black/10">
          <p className="text-lg font-semibold text-[#8C1515]">
            Diversified by: {diversification_dimension}
          </p>
        </div>
      )}
      
      {rowsToShow.map((row, rowIndex) => {
        const label = bucket_labels?.[rowIndex] || `Option ${rowIndex + 1}`;
        
        return (
          <RecommendationRow
            key={rowIndex}
            row={row}
            label={label}
            onItemSelect={onItemSelect}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            onAddToCart={onAddToCart}
          />
        );
      })}
    </div>
  );
}

interface RecommendationRowProps {
  row: Product[];
  label: string;
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
  onAddToCart?: (product: Product) => void;
}

function RecommendationRow({
  row,
  label,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
}: RecommendationRowProps) {
  // Show up to 3 items per row side-by-side (instead of a carousel)
  const productsToShow = row.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Row Label */}
      <div className="pb-2 border-b border-black/10">
        <h3 className="text-xl font-semibold text-black uppercase tracking-wide">
          {label}
        </h3>
      </div>

      {/* 3-up grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {productsToShow.map((product) => {
          const pros = getProductPros(product);
          const highlight = getProductHighlight(product, productsToShow);
          return (
            <div key={product.id} className="flex flex-col">
              <RecommendationCard
                product={product}
                onItemSelect={onItemSelect}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                onAddToCart={onAddToCart}
              />
              {pros.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 px-1">
                  {pros.map((pro, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-black/5 text-black/70 border border-black/10">
                      ✓ {pro}
                    </span>
                  ))}
                </div>
              )}
              {highlight && (
                <p className="text-xs text-black/50 mt-1 px-1 italic">↳ {highlight}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
