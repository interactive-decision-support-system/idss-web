'use client';

import { useState } from 'react';
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
    <div className="space-y-8 mt-6">
      {rowsToShow.map((row, rowIndex) => {
        const label = bucket_labels?.[rowIndex] || `Option ${rowIndex + 1}`;
        
        return (
          <RecommendationRow
            key={rowIndex}
            row={row}
            label={label}
            diversification_dimension={diversification_dimension}
            onItemSelect={onItemSelect}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        );
      })}
    </div>
  );
}

interface RecommendationRowProps {
  row: Product[];
  label: string;
  diversification_dimension?: string;
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
}

function RecommendationRow({
  row,
  label,
  diversification_dimension,
  onItemSelect,
  onToggleFavorite,
  isFavorite,
}: RecommendationRowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProduct = row[currentIndex];
  const hasMultiple = row.length > 1;

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % row.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + row.length) % row.length);
  };

  const handleFavorite = () => {
    if (onToggleFavorite && currentProduct) {
      onToggleFavorite(currentProduct);
    }
  };

  return (
    <div className="space-y-3">
      {/* Row Label */}
      <div className="pb-2 border-b border-[#8b959e]/20">
        <h3 className="text-base font-semibold text-[#8C1515] uppercase tracking-wide">
          {label}
        </h3>
        {diversification_dimension && (
            <p className="text-xs text-[#8b959e] mt-1">
            Diversified by: {diversification_dimension}
          </p>
        )}
      </div>

      {/* Product Card */}
      <RecommendationCard
        products={row}
        currentIndex={currentIndex}
        onItemSelect={onItemSelect}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
      />

      {/* Bottom Controls - Heart and Navigation */}
      <div className="flex items-center justify-start gap-3 pt-2">
        {/* Heart Button */}
        <button
          onClick={handleFavorite}
            className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200"
          aria-label="Toggle favorite"
        >
          <svg 
            className={`w-7 h-7 transition-all duration-200 ${
              isFavorite && currentProduct && isFavorite(currentProduct.id) 
                ? 'text-[#ff1323] fill-[#ff1323]' 
                : 'text-[#8b959e]'
            }`}
            fill={isFavorite && currentProduct && isFavorite(currentProduct.id) ? 'currentColor' : 'none'}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Navigation Arrows - Only show if multiple products */}
        {hasMultiple && (
          <>
              <button
              onClick={prevProduct}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 transition-all duration-200 text-[#8C1515] hover:text-[#8C1515]"
              aria-label="Previous product"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-[#8b959e]">
              {currentIndex + 1} / {row.length}
            </span>
            <button
              onClick={nextProduct}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 transition-all duration-200 text-[#8C1515] hover:text-[#8C1515]"
              aria-label="Next product"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}