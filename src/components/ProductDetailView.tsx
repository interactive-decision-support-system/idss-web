'use client';

import React from 'react';
import { Product } from '@/types/chat';
import Image from 'next/image';
import { getDomainConfigForProduct } from '@/config/domain-config';
import { isSoldOut } from '@/utils/inventory';

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
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

function getDisplayTitle(product: Product): string {
  return (product as { name?: string }).name ?? (product as { title?: string }).title ?? 'Product';
}

function getPrimaryImage(product: Product): string | undefined {
  const p = product as { image?: { primary?: string }; image_url?: string; primaryImage?: string };
  return p.image?.primary || p.image_url || p.primaryImage || undefined;
}

function getPriceDisplay(product: Product): string {
  const p = product as { price_text?: string; price?: number };
  return p.price_text ?? (p.price != null ? `$${p.price.toLocaleString()}` : 'Price N/A');
}

export default function ProductDetailView({ product, onClose, onAddToCart }: ProductDetailViewProps) {
  const [imgError, setImgError] = React.useState(false);
  const config = getDomainConfigForProduct(product as Record<string, unknown> & { productType?: string });

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
      <div className="flex items-center justify-between">
        <span className="text-xs text-black/70 font-medium">{fieldConfig.label}</span>
        <span className="text-xs text-black font-semibold">{displayValue}</span>
      </div>
    );
  };

  // Main render
  return (
    <div className="h-full bg-white flex flex-col overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-black truncate">{getDisplayTitle(product)}</h2>
          {(product as { brand?: string }).brand && (
            <p className="text-xs text-black/50 mt-0.5">{(product as { brand?: string }).brand}</p>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <div className="aspect-[3/2] bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg flex items-center justify-center overflow-hidden relative">
          {(() => {
            const imgSrc = !imgError && getPrimaryImage(product);
            return imgSrc ? (
              <Image
                src={imgSrc}
                alt={getDisplayTitle(product)}
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 600px) 100vw, 33vw"
                priority={false}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-black/40 text-xs text-center px-2">No Image Available</div>
            );
          })()}
        </div>

        {/* Price */}
        {((product as { price_text?: string }).price_text || (product as { price?: number }).price != null) && (
          <div className="text-2xl font-bold text-[#8C1515]">
            {getPriceDisplay(product)}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {(() => {
            const listingUrl = normalizeExternalUrl(product.listing_url as string | undefined);
            return listingUrl && config.viewListingButtonText ? (
              <a
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full button flex items-center justify-center space-x-2 text-sm"
              >
                <span>{config.viewListingButtonText}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : null;
          })()}
          {onAddToCart && (
            isSoldOut(product) ? (
              <div className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-black/10 text-black/50 text-center">
                Sold out
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                className="w-full button flex items-center justify-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to cart
              </button>
            )
          )}
        </div>

        {/* Trust badges — Amazon style: Shipping / Warranty / Returns */}
        {(() => {
          const warranty = (product as { warranty?: string }).warranty;
          const returnPolicy = (product as { return_policy?: string }).return_policy;
          // Extract warranty duration e.g. "1-year" or "2 Year"
          const warrantyLabel = warranty
            ? (warranty.match(/(\d+[-\s]?(?:year|yr|month|day)s?)/i)?.[1] ?? warranty.slice(0, 20))
            : null;
          // Extract return window e.g. "30-day"
          const returnLabel = returnPolicy
            ? (returnPolicy.match(/(\d+[-\s]?day)/i)?.[1] ?? (/free/i.test(returnPolicy) ? 'Free' : null))
            : null;

          const badges = [
            { icon: '🚚', label: 'Free Standard Shipping', sub: '5–7 business days', always: true },
            ...(warrantyLabel ? [{ icon: '🛡️', label: `${warrantyLabel} Warranty`, sub: 'Manufacturer covered' }] : []),
            ...(returnLabel ? [{ icon: '↩️', label: `${returnLabel} Returns`, sub: 'Hassle-free' }] : []),
          ] as { icon: string; label: string; sub: string; always?: boolean }[];

          return (
            <div className="rounded-lg border border-black/8 divide-y divide-black/8">
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-lg shrink-0">{b.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-black">{b.label}</p>
                    <p className="text-[11px] text-black/50">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-2">
          {config.detailPageFields.map((fieldConfig) => (
            <React.Fragment key={fieldConfig.key}>
              {renderField(fieldConfig)}
            </React.Fragment>
          ))}
        </div>

        {/* Full attributes / metadata (e.g. laptop attributes from API) */}
        {(() => {
          const attrs = (product as { attributes?: Record<string, unknown> }).attributes
            ?? (product as { metadata?: Record<string, unknown> }).metadata;
          if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return null;
          // Exclude non-spec fields that have dedicated sections elsewhere
          const EXCLUDE_KEYS = new Set([
            'description', 'gallery', 'title', 'name', 'price', 'price_cents',
            'image', 'image_url', 'listing_url', 'reviews',
          ]);
          const entries = Object.entries(attrs).filter(
            ([k, v]) => !EXCLUDE_KEYS.has(k) && v !== undefined && v !== null && String(v).trim() !== ''
          );
          if (entries.length === 0) return null;

          const labelFor = (key: string): string => {
            const map: Record<string, string> = {
              ram_gb: 'RAM (GB)',
              storage_gb: 'Storage (GB)',
              screen_size_inches: 'Screen size (in)',
              refresh_rate_hz: 'Refresh rate (Hz)',
              battery_life_hours: 'Battery life (hrs)',
              weight_lbs: 'Weight (lbs)',
              processor: 'Processor',
              gpu: 'GPU',
              os: 'Operating system',
              resolution: 'Resolution',
              storage_type: 'Storage type',
            };
            return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          };

          return (
            <div className="bg-black/3 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-black mb-2">All specifications</h3>
              <div className="space-y-1.5">
                {entries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-black/70 font-medium">{labelFor(key)}</span>
                    <span className="text-xs text-black font-semibold text-right max-w-[60%]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Gallery — parse JSON string or array, render actual images */}
        {(() => {
          const attrs = (product as { attributes?: Record<string, unknown> }).attributes ?? {};
          const rawGallery = (attrs as Record<string, unknown>).gallery
            ?? (product as { gallery?: unknown }).gallery;
          if (!rawGallery) return null;

          let urls: string[] = [];
          if (typeof rawGallery === 'string') {
            try { urls = JSON.parse(rawGallery); } catch { urls = [rawGallery]; }
          } else if (Array.isArray(rawGallery)) {
            urls = rawGallery.map(String);
          }
          urls = urls.filter(u => /^https?:\/\//i.test(u));
          if (urls.length === 0) return null;

          return (
            <div>
              <h3 className="text-xs font-semibold text-black mb-2">Gallery</h3>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {urls.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-black/5 border border-black/8">
                    <Image
                      src={url}
                      alt={`Product image ${i + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Description — as bullet points, not a wall of text */}
        {(() => {
          const desc = (product as { description?: string }).description;
          if (!desc) return null;
          // Split on ". " or "- " to extract individual facts; take first 5
          const raw = desc.trim();
          const sentences = raw
            .split(/(?<=\.)\s+|(?:^|\.\s+)-\s+/g)
            .map(s => s.replace(/^[-•]\s*/, '').trim())
            .filter(s => s.length > 20);
          const bullets = sentences.slice(0, 5);
          return (
            <div className="bg-black/3 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-black mb-1.5">Description</h3>
              {bullets.length > 1 ? (
                <ul className="space-y-1">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-black/70 leading-relaxed">
                      <span className="text-black/30 mt-0.5 flex-shrink-0">·</span>
                      <span>{b.endsWith('.') ? b : `${b}.`}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-black/70 text-xs leading-relaxed">{raw.slice(0, 300)}{raw.length > 300 ? '…' : ''}</p>
              )}
            </div>
          );
        })()}

        {/* Ratings & Reviews */}
        {(() => {
          const productRating = product.rating as number | undefined;
          const productRatingCount = product.rating_count as number | undefined;
          const productReviews = product.reviews as string | { title?: string; body?: string; rating?: number; author?: string }[] | undefined;
          if (!productRating && !productRatingCount && !productReviews) return null;

          let reviewList: { title?: string; body?: string; rating?: number; author?: string }[] = [];
          let reviewsPlainText: string | undefined;
          if (productReviews) {
            if (typeof productReviews === 'string') {
              try {
                const parsed = JSON.parse(productReviews);
                if (Array.isArray(parsed)) reviewList = parsed;
              } catch {
                reviewsPlainText = productReviews;
              }
            } else if (Array.isArray(productReviews)) {
              reviewList = productReviews;
            }
          }

          return (
            <div className="bg-black/3 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-black mb-2">Ratings & Reviews</h3>
              {productRating != null && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(productRating) ? 'text-yellow-400' : 'text-black/15'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.538 1.118l-3.388-2.462a1 1 0 00-1.175 0l-3.388 2.462c-.783.57-1.838-.197-1.538-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-black">{productRating.toFixed(1)}</span>
                  {productRatingCount != null && (
                    <span className="text-xs text-black/50">({productRatingCount.toLocaleString()} ratings)</span>
                  )}
                </div>
              )}
              {reviewsPlainText && (
                <p className="text-black/70 text-xs leading-relaxed whitespace-pre-line mt-2">{reviewsPlainText}</p>
              )}
              {reviewList.length > 0 && (
                <div className="border-t border-black/10 pt-2 mt-2 space-y-2">
                  {reviewList.slice(0, 3).map((review, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {review.rating != null && <span className="text-yellow-400">{'★'.repeat(Math.min(5, Math.round(review.rating)))}{'☆'.repeat(Math.max(0, 5 - Math.round(review.rating)))}</span>}
                        {review.author && <span className="text-black/40">{review.author}</span>}
                      </div>
                      {review.title && <p className="font-medium text-black mb-0.5">{review.title}</p>}
                      {review.body && <p className="text-black/60 leading-relaxed">{review.body}</p>}
                    </div>
                  ))}
                  {reviewList.length > 3 && <p className="text-black/40 text-xs">+{reviewList.length - 3} more reviews</p>}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
