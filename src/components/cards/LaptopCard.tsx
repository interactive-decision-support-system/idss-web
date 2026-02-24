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
}

export default function LaptopCard({
    data,
    onItemSelect,
    onToggleFavorite,
    isFavorite,
    onAddToCart,
}: LaptopCardProps) {
    const [imgError, setImgError] = useState(false);
    const { laptop, name, price, image } = data;
    const imageSrc = !imgError && image?.primary ? image.primary : null;

    const favorited = isFavorite ? isFavorite(data.id) : false;

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(data);
    };

    return (
        <div className="card card-blue border-black/10 hover:border-black/20 transition-all duration-200 h-full flex flex-col relative group">
            {/* Image */}
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative mb-3">
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

                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all duration-200 border border-black/10 shadow-sm"
                        aria-label={favorited ? 'Unfavorite' : 'Favorite'}
                    >
                        <svg
                            className={`w-4 h-4 transition-all duration-200 ${favorited ? 'text-[#ff1323] fill-[#ff1323]' : 'text-black/50'
                                }`}
                            fill={favorited ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{name}</h3>
                <p className="text-[#8C1515] font-bold text-lg mt-1">
                    ${price.toLocaleString()}
                </p>

                {/* Star Rating — always shown */}
                <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const hasRating = typeof (data.rating as number | undefined) === 'number';
                        const filled = hasRating && i < Math.round(data.rating as number);
                        return (
                            <svg
                                key={i}
                                className={`w-3.5 h-3.5 ${filled ? 'text-yellow-400' : 'text-black/15'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.538 1.118l-3.388-2.462a1 1 0 00-1.175 0l-3.388 2.462c-.783.57-1.838-.197-1.538-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
                            </svg>
                        );
                    })}
                    <span className="text-xs text-black/50 ml-0.5">
                        {typeof (data.rating as number | undefined) === 'number'
                            ? `${(data.rating as number).toFixed(1)}/5`
                            : 'No rating yet'}
                    </span>
                </div>

                {/* Source / Scrape Origin — only shown when available */}
                {(data.source as string | undefined) && (
                  <p className="text-xs text-black/50 mt-0.5">
                    From: <span className="font-medium">{data.source as string}</span>
                  </p>
                )}

                {/* Brand — always shown */}
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between gap-2">
                        <span>Brand</span>
                        <span className="font-medium text-gray-900 text-right truncate">{data.brand || 'N/A'}</span>
                    </div>
                </div>

                {laptop && laptop.specs && (
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                        {/* Brand already rendered above */}
                        {laptop.specs.processor && (
                            <div className="flex justify-between gap-2">
                                <span>CPU</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.processor}</span>
                            </div>
                        )}
                        {laptop.specs.ram && (
                            <div className="flex justify-between gap-2">
                                <span>RAM</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.ram}</span>
                            </div>
                        )}
                        {laptop.specs.storage && (
                            <div className="flex justify-between gap-2">
                                <span>Storage</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.storage}</span>
                            </div>
                        )}
                        {laptop.specs.storage_type && (
                            <div className="flex justify-between gap-2">
                                <span>Storage type</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.storage_type}</span>
                            </div>
                        )}
                        {(laptop.specs.screen_size || laptop.specs.display) && (
                            <div className="flex justify-between gap-2">
                                <span>Display</span>
                                <span className="font-medium text-gray-900 text-right truncate">
                                    {laptop.specs.screen_size || laptop.specs.display}
                                </span>
                            </div>
                        )}
                        {laptop.specs.resolution && (
                            <div className="flex justify-between gap-2">
                                <span>Resolution</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.resolution}</span>
                            </div>
                        )}
                        {(laptop.specs.refresh_rate_hz != null && laptop.specs.refresh_rate_hz > 0) && (
                            <div className="flex justify-between gap-2">
                                <span>Refresh</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.refresh_rate_hz} Hz</span>
                            </div>
                        )}
                        {laptop.specs.graphics && (
                            <div className="flex justify-between gap-2">
                                <span>GPU</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.graphics}</span>
                            </div>
                        )}
                        {laptop.specs.battery_life && (
                            <div className="flex justify-between gap-2">
                                <span>Battery</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.battery_life}</span>
                            </div>
                        )}
                        {laptop.specs.os && (
                            <div className="flex justify-between gap-2">
                                <span>OS</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.os}</span>
                            </div>
                        )}
                        {laptop.specs.weight && (
                            <div className="flex justify-between gap-2">
                                <span>Weight</span>
                                <span className="font-medium text-gray-900 text-right truncate">{laptop.specs.weight}</span>
                            </div>
                        )}
                        {/* Any extra attributes not already in specs */}
                        {laptop.attributes && Object.keys(laptop.attributes).length > 0 && (() => {
                            const specKeys = new Set([
                                'processor', 'ram', 'storage', 'storage_type', 'display', 'screen_size',
                                'resolution', 'graphics', 'battery_life', 'os', 'weight', 'refresh_rate_hz',
                            ]);
                            const entries = Object.entries(laptop.attributes).filter(
                                ([k]) => !specKeys.has(k) && laptop.attributes![k] != null && String(laptop.attributes![k]).trim() !== ''
                            );
                            if (entries.length === 0) return null;
                            return (
                                <>
                                    {entries.slice(0, 3).map(([key, value]) => (
                                        <div key={key} className="flex justify-between gap-2">
                                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-medium text-gray-900 text-right truncate">{String(value)}</span>
                                        </div>
                                    ))}
                                    {entries.length > 3 && (
                                        <div className="text-xs text-gray-500">+{entries.length - 3} more</div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {laptop?.tags && laptop.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {laptop.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                    onClick={() => onItemSelect && onItemSelect(data)}
                    className="text-sm font-medium text-[#8C1515] hover:text-[#b11f1f] flex items-center gap-1"
                >
                    View Details
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
                {onAddToCart && (
                    isSoldOut(data) ? (
                        <span className="text-xs text-red-600 font-medium">Sold out</span>
                    ) : (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(data); }}
                            className="w-9 h-9 flex items-center justify-center text-[#8C1515] hover:text-[#750013] transition-colors shrink-0"
                            aria-label="Add to cart"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
