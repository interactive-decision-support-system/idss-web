'use client';

import Image from 'next/image';
import { Product } from '@/types/chat';
import { currentDomainConfig } from '@/config/domain-config';

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailView({ product, onClose }: ProductDetailViewProps) {
  const config = currentDomainConfig;

  // Helper function to render field based on config
  const renderField = (fieldConfig: typeof config.detailPageFields[0]) => {
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
      <div key={fieldConfig.key} className="bg-white border border-[#8b959e]/30 rounded p-2">
        <div className="text-[#8b959e] text-sm">{fieldConfig.label}</div>
        <div className="text-black text-base font-medium">{displayValue}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#8b959e]/30 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-black">{product.title}</h2>
            {product.brand && (
              <p className="text-sm text-[#8b959e] mt-1">{product.brand}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8C1515] hover:bg-[#750013] text-white rounded-lg transition-all duration-200 font-semibold shadow-sm flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    unoptimized
                  />
                ) : (
                  <div className="text-[#8b959e] text-sm text-center px-2">
                    No Image Available
                  </div>
                )}
              </div>
              
              {/* Price Card */}
              <div className="bg-white border border-[#8b959e]/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-[#8C1515]">
                  {product.price_text || (product.price ? `$${product.price.toLocaleString()}` : 'Price N/A')}
                </div>
              </div>
              
              {/* View Listing Button */}
              {(() => {
                const listingUrl = product.listing_url as string | undefined;
                return listingUrl && config.viewListingButtonText ? (
                  <a
                    href={listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#8C1515] hover:bg-[#750013] text-white py-3 px-4 rounded-lg text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>{config.viewListingButtonText}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : null;
              })()}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {config.detailPageFields.map(renderField)}
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white border border-[#8b959e]/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-black mb-2">Description</h3>
                  <p className="text-[#8b959e] text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
