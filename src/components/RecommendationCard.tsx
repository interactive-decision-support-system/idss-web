'use client';

import { Product } from '@/types/chat';
import { currentDomainConfig } from '@/config/domain-config';

interface RecommendationCardProps {
  products: Product[];
  currentIndex?: number;
  onItemSelect?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (productId: string) => boolean;
}

export default function RecommendationCard({ 
  products, 
  currentIndex: controlledIndex,
  onItemSelect, 
  onToggleFavorite, 
  isFavorite 
}: RecommendationCardProps) {
  const config = currentDomainConfig;

  if (!products || products.length === 0) {
    return null;
  }

  const currentProduct = products[controlledIndex ?? 0];

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
      <div key={fieldConfig.key} className="flex justify-between py-0.5">
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
    <div className="bg-white border border-[#8b959e]/30 rounded-xl p-4 hover:border-[#8b959e]/40 transition-all duration-200">
      <div className="flex gap-4 items-stretch">
        {/* Product Image Container */}
        <div className="w-56 h-56 flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
            {(() => {
              // Check both image_url (converted) and primaryImage (from spread)
              const imageSrc = (currentProduct.image_url as string) || (currentProduct.primaryImage as string);
              return imageSrc ? (
                <img
                  src={imageSrc}
                  alt={currentProduct.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-text')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-text text-[#8b959e] text-xs absolute inset-0 flex items-center justify-center text-center px-2';
                      fallback.textContent = 'No Image';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="text-[#8b959e] text-xs text-center px-2">
                  No Image
                </div>
              );
            })()}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col space-y-1 min-w-0">
          <div>
            <h4 className="text-lg font-bold text-black leading-tight">
              {currentProduct.title}
            </h4>

            {currentProduct.brand && (
              <p className="text-base text-[#8b959e]">{currentProduct.brand}</p>
            )}
          </div>

          <div className="space-y-0.5 text-base flex-1">
            {config.recommendationCardFields.map(renderField)}
          </div>

          <button
            onClick={() => onItemSelect && onItemSelect(currentProduct)}
            className="text-left text-base text-[#8C1515] hover:text-[#750013] font-medium mt-1"
          >
            {config.viewDetailsButtonText} →
          </button>
        </div>
      </div>
    </div>
  );
}