'use client';

import { Product } from '@/types/chat';
import { currentDomainConfig } from '@/config/domain-config';

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
}

function normalizeExternalUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;

  // Already absolute
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Protocol-relative URL
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  // Domain-like URL missing scheme (e.g., www.example.com/path)
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return `https://${trimmed}`;

  // Otherwise treat as an ID/relative path; don't render the button (prevents localhost 404s).
  return null;
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
      <div key={fieldConfig.key} className="bg-white border border-black/10 rounded p-3">
        <div className="text-black/60 text-xs mb-1">{fieldConfig.label}</div>
        <div className="text-black text-sm font-medium">{displayValue}</div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-black truncate">{product.title}</h2>
          {product.brand && (
            <p className="text-xs text-black/50 mt-1">{product.brand}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors ml-2 flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {/* Image */}
        <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
          {product.image_url ? (
            <img
              src={product.image_url as string}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-black/40 text-sm text-center px-2">No Image Available</div>
          )}
        </div>

        {/* Price */}
        {(product.price_text || product.price) && (
          <div className="bg-white border border-black/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#8C1515]">
              {product.price_text || (product.price ? `$${product.price.toLocaleString()}` : 'Price N/A')}
            </div>
          </div>
        )}

        {/* View Listing Button */}
        {(() => {
          const listingUrl = normalizeExternalUrl(product.listing_url as string | undefined);
          return listingUrl && config.viewListingButtonText ? (
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#8C1515] hover:bg-[#750013] text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>{config.viewListingButtonText}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : null;
        })()}

        {/* Details */}
        <div className="grid grid-cols-1 gap-2">
          {config.detailPageFields.map(renderField)}
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white border border-black/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-black mb-2">Description</h3>
            <p className="text-black/70 text-xs leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
