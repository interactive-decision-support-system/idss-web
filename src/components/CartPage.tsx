'use client';

import type { CartItem } from '@/services/cart';
import type { Product } from '@/types/chat';
import { isSoldOut } from '@/utils/inventory';

interface CartPageProps {
  cartItems: CartItem[];
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onItemSelect: (product: Product) => void;
  onClose: () => void;
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
  return p.price_text ?? (p.price != null ? `$${p.price.toLocaleString()}` : 'N/A');
}

export default function CartPage({
  cartItems,
  onRemove,
  onCheckout,
  onItemSelect,
  onClose,
}: CartPageProps) {
  const hasSoldOutItem = cartItems.some((item) => isSoldOut(item.product));
  const canCheckout = cartItems.length > 0 && !hasSoldOutItem;

  const primaryImage = (product: Product) => getPrimaryImage(product);
  const hasValidImage = (product: Product) => {
    const img = primaryImage(product);
    return img && typeof img === 'string' && img.trim().length > 0 && !img.toLowerCase().includes('.svg');
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-black">Cart</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-black/60 text-sm">Your cart is empty</p>
            <p className="text-black/40 text-xs mt-1">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(({ product, quantity }) => {
              const soldOut = isSoldOut(product);
              return (
                <div
                  key={product.id}
                  className={`rounded-lg p-3 border transition-all duration-200 ${
                    soldOut ? 'border-red-200 bg-red-50/50' : 'border-black/10 hover:border-black/20 bg-white'
                  }`}
                >
                  <div
                    className={`flex gap-3 ${soldOut ? 'opacity-75' : 'cursor-pointer'}`}
                    onClick={() => !soldOut && onItemSelect(product)}
                  >
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg overflow-hidden">
                      {hasValidImage(product) ? (
                        <img
                          src={primaryImage(product)!}
                          alt={getDisplayTitle(product)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">No Image</div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-black leading-tight line-clamp-2">
                        {getDisplayTitle(product)}
                      </h4>
                      <p className="text-sm font-bold text-[#8C1515] mt-0.5">{getPriceDisplay(product)}</p>
                      <p className="text-xs text-black/50">Qty: {quantity}</p>
                      {soldOut && (
                        <p className="text-xs font-medium text-red-600 mt-1">Sold out</p>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(product.id);
                      }}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 text-black/50 hover:text-red-600 transition-colors"
                      aria-label="Remove from cart"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-black/10 flex-shrink-0">
          <button
            onClick={onCheckout}
            disabled={!canCheckout}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              canCheckout
                ? 'bg-[#8C1515] hover:bg-[#750013] text-white'
                : 'bg-black/20 text-black/50 cursor-not-allowed'
            }`}
          >
            {hasSoldOutItem ? 'Remove sold-out items to checkout' : 'Checkout'}
          </button>
        </div>
      )}
    </div>
  );
}
