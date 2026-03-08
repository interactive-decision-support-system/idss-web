import { useState } from 'react';
import Image from 'next/image';
import { UnifiedProduct } from '@/types/chat';
import { isSoldOut } from '@/utils/inventory';

interface LaptopCardProps {
    data: UnifiedProduct;
    onItemSelect?: (product: UnifiedProduct) => void;
    onToggleFavorite?: (product: UnifiedProduct) => void;
    isFavorite?: (productId: string) => boolean;
    onAddToCart?: (product: UnifiedProduct) => void;
    onAskAI?: (product: UnifiedProduct) => void;
}

/** Shorten a CPU string to keep it scannable on a small card. */
function shortCpu(raw: string): string {
    // "Intel Core i7-12700H" → "i7-12700H"  |  "Apple M3 Pro" → "M3 Pro"
    const stripped = raw.replace(/^(intel\s+core\s*|amd\s*|apple\s*)/i, '').trim();
    return stripped.length > 22 ? stripped.slice(0, 20) + '…' : stripped;
}

export default function LaptopCard({
    data,
    onItemSelect,
    onToggleFavorite,
    isFavorite,
    onAddToCart,
    onAskAI,
}: LaptopCardProps) {
    const [imgError, setImgError] = useState(false);
    const [imgIdx, setImgIdx] = useState(0);
    const { laptop, name, price, image } = data;
    const allImages = [image?.primary, ...(image?.gallery ?? [])].filter(Boolean) as string[];
    const imageSrc = !imgError && allImages.length > 0 ? allImages[imgIdx] : null;
    const favorited = isFavorite ? isFavorite(data.id) : false;

    // Derive up to 3 compact spec pills from specs
    const specs = laptop?.specs;
    const pills: string[] = [];
    if (specs?.processor) pills.push(shortCpu(specs.processor));
    if (specs?.ram) pills.push(specs.ram);
    if (specs?.storage) pills.push(specs.storage);

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(data);
    };

    return (
        <div
            className="card card-blue border-black/10 hover:border-black/20 hover:ring-2 hover:ring-blue-400/40 transition-all duration-200 h-full flex flex-col relative group cursor-pointer"
            onClick={() => onItemSelect?.(data)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemSelect?.(data); } }}
        >
            {/* Image */}
            <div className="mb-3">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                    </div>
                )}

                {/* Carousel prev/next arrows */}
                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => Math.max(0, i - 1)); setImgError(false); }}
                            disabled={imgIdx === 0}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 disabled:opacity-0 transition-opacity"
                            aria-label="Previous image"
                        >‹</button>
                        <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => Math.min(allImages.length - 1, i + 1)); setImgError(false); }}
                            disabled={imgIdx === allImages.length - 1}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 disabled:opacity-0 transition-opacity"
                            aria-label="Next image"
                        >›</button>
                    </>
                )}

                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all duration-200 border border-black/10 shadow-sm"
                        aria-label={favorited ? 'Unfavorite' : 'Favorite'}
                    >
                        <svg
                            className={`w-4 h-4 transition-all duration-200 ${favorited ? 'text-[#ff1323] fill-[#ff1323]' : 'text-black/50'}`}
                            fill={favorited ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}
              </div>

              {/* Dot indicators */}
              {allImages.length > 1 && (
                <div className="flex justify-center gap-1 pt-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIdx(i); setImgError(false); }}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-[#8C1515]' : 'bg-black/20'}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">{name}</h3>

                <div className="flex items-baseline justify-between">
                    <p className="text-[#8C1515] font-bold text-base">${price.toLocaleString()}</p>
                    {typeof (data.rating as number | undefined) === 'number' && (
                        <span className="text-xs text-black/50">
                            ⭐ {(data.rating as number).toFixed(1)}
                            {typeof data.reviews_count === 'number' && data.reviews_count > 0 && (
                                <> · {data.reviews_count.toLocaleString()}</>
                            )}
                        </span>
                    )}
                </div>

                {/* Spec pills */}
                {pills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {pills.map((pill, i) => (
                            <span key={i} className="text-[10px] bg-black/5 text-black/60 px-1.5 py-0.5 rounded border border-black/8">
                                {pill}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <span
                    className="text-sm font-medium text-[#8C1515] flex items-center gap-1"
                >
                    View Details
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </span>
                <div className="flex items-center gap-1">
                    {/* Ask AI button */}
                    {onAskAI && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAskAI(data); }}
                            className="w-8 h-8 flex items-center justify-center text-black/40 hover:text-[#8C1515] transition-colors shrink-0"
                            aria-label="Ask AI about this product"
                            title="Ask AI"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    )}
                    {onAddToCart && (
                        isSoldOut(data) ? (
                            <span className="text-xs text-red-600 font-medium">Sold out</span>
                        ) : (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(data); }}
                                className="w-8 h-8 flex items-center justify-center text-[#8C1515] hover:text-[#750013] transition-colors shrink-0"
                                aria-label="Add to cart"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
