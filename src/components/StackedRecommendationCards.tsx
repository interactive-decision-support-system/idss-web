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
}

export default function StackedRecommendationCards({
  recommendations,
  bucket_labels,
  diversification_dimension,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
}: StackedRecommendationCardsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Limit to 3 rows maximum
  const rowsToShow = recommendations.slice(0, 3);

  return (
    <div className="space-y-4 mt-3">
      {rowsToShow.map((row, rowIndex) => {
        const label = bucket_labels?.[rowIndex] || `Option ${rowIndex + 1}`;
        
        return (
          <div key={rowIndex} className="bg-white border border-[#8b959e]/30 rounded-xl p-4 shadow-sm">
            {/* Bucket Label */}
            <div className="mb-3 pb-2 border-b border-[#8b959e]/20">
              <h3 className="text-sm font-semibold text-[#8C1515] uppercase tracking-wide">
                {label}
              </h3>
              {diversification_dimension && (
                <p className="text-xs text-[#8b959e] mt-1">
                  Diversified by: {diversification_dimension}
                </p>
              )}
            </div>
            
            {/* Recommendation Card for this row */}
            <RecommendationCard
              products={row}
              onItemSelect={onItemSelect}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite}
            />
          </div>
        );
      })}
    </div>
  );
}
