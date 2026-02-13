'use client';

import { Product } from '@/types/chat';
import RecommendationCard from './RecommendationCard';

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
        {productsToShow.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            onItemSelect={onItemSelect}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
