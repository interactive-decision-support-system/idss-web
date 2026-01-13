'use client';

import { useState } from 'react';
import { Product } from '@/types/chat';
import { currentDomainConfig } from '@/config/domain-config';

interface RecommendationCardProps {
  products: Product[];
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
}

export default function RecommendationCard({ products, onItemSelect, onToggleFavorite, isFavorite }: RecommendationCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const config = currentDomainConfig;

  if (!products || products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];
  const hasMultiple = products.length > 1;

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Render field based on config
  const renderField = (fieldConfig: typeof config.recommendationCardFields[0]) => {
    // Special handling for category field - check both part_type and category
    let value = currentProduct[fieldConfig.key];
    if (fieldConfig.key === 'part_type' && (value === undefined || value === null)) {
      value = currentProduct['category'];
    }
    
    // Check condition if provided
    if (fieldConfig.condition && !fieldConfig.condition(currentProduct)) {
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
      <div key={fieldConfig.key} className="flex justify-between">
        <span className="text-[#8b959e]">{fieldConfig.label}:</span>
        <span className={fieldConfig.key === 'price' ? 'font-bold text-[#8C1515]' : 'text-black'}>
          {displayValue}
          {fieldConfig.key === 'rating' && currentProduct.rating_count && (
            ` (${currentProduct.rating_count})`
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#8b959e]/30 rounded-xl p-4 shadow-sm mt-3 max-w-md">
      {/* Product Image */}
      <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
        {currentProduct.image_url ? (
          <img
            src={currentProduct.image_url}
            alt={currentProduct.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-[#8b959e] text-sm text-center px-2">
            No Image Available
          </div>
        )}
        
        {/* Navigation Arrows - only show if multiple products */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevProduct();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-[#8b959e]/40 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10"
              aria-label="Previous product"
            >
              <svg className="w-4 h-4 text-[#8C1515]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextProduct();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-[#8b959e]/40 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10"
              aria-label="Next product"
            >
              <svg className="w-4 h-4 text-[#8C1515]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Product Counter */}
        {hasMultiple && (
          <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-[#8b959e] border border-[#8b959e]/30">
            {currentIndex + 1} / {products.length}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-black leading-tight">
          {currentProduct.title}
        </h4>

        {currentProduct.brand && (
          <p className="text-sm text-[#8b959e]">{currentProduct.brand}</p>
        )}

        <div className="space-y-1 text-base">
          {config.recommendationCardFields.map(renderField)}
        </div>

        <div className="flex gap-2 mt-3">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(currentProduct);
              }}
              className="w-10 h-10 bg-white border border-[#8b959e]/40 rounded-lg flex items-center justify-center hover:border-[#ff1323] hover:shadow-md transition-all duration-200 shadow-sm"
              aria-label="Toggle favorite"
            >
              <svg 
                className={`w-5 h-5 transition-all duration-200 ${isFavorite && isFavorite(currentProduct.id) ? 'text-[#ff1323] fill-[#ff1323]' : 'text-[#8b959e]'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onItemSelect && onItemSelect(currentProduct)}
            className="flex-1 bg-[#8C1515] text-white py-2 rounded-lg text-base font-medium hover:bg-[#750013] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {config.viewDetailsButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
