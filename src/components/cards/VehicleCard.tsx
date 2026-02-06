import { UnifiedProduct } from '@/types/chat';
import { isSoldOut } from '@/utils/inventory';

interface VehicleCardProps {
    data: UnifiedProduct;
    onItemSelect?: (product: UnifiedProduct) => void;
    onToggleFavorite?: (product: UnifiedProduct) => void;
    isFavorite?: (productId: string) => boolean;
    onAddToCart?: (product: UnifiedProduct) => void;
}

export default function VehicleCard({
    data,
    onItemSelect,
    onToggleFavorite,
    isFavorite,
    onAddToCart,
}: VehicleCardProps) {
    const { vehicle, name, price, image } = data;
    const imageSrc = image?.primary || null;

    const favorited = isFavorite ? isFavorite(data.id) : false;

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(data);
    };

    return (
        <div className="bg-white border border-black/10 rounded-xl p-3 hover:border-black/20 transition-all duration-200 h-full flex flex-col relative group">
            {/* Image */}
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative mb-3">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={name}
                        className="w-full h-full object-cover"
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

                {vehicle && (
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Year</span>
                            <span className="font-medium text-gray-900">{vehicle.year}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Make</span>
                            <span className="font-medium text-gray-900">{vehicle.make}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Model</span>
                            <span className="font-medium text-gray-900">{vehicle.model}</span>
                        </div>
                        {vehicle.mileage !== undefined && (
                            <div className="flex justify-between">
                                <span>Mileage</span>
                                <span className="font-medium text-gray-900">{vehicle.mileage.toLocaleString()} mi</span>
                            </div>
                        )}
                        {vehicle.mpg && (
                            <div className="flex justify-between">
                                <span>MPG</span>
                                <span className="font-medium text-gray-900">{vehicle.mpg.city} / {vehicle.mpg.highway}</span>
                            </div>
                        )}
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
