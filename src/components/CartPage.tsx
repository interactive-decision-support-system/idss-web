'use client';

import { useState } from 'react';
import type { CartItem } from '@/services/cart';
import type { Product } from '@/types/chat';
import { isSoldOut } from '@/utils/inventory';

export type CheckoutResultProp =
  | { success: true; orderId: string }
  | { success: false; error: string; soldOutIds?: string[] }
  | null;

export type ShippingMethod = 'standard' | 'express' | 'overnight';

interface ShippingOption {
  id: ShippingMethod;
  label: string;
  description: string;
  cost: number; // cents
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: 'standard',  label: 'Standard',  description: '5–7 days', cost: 0 },
  { id: 'express',   label: 'Express',   description: '2–3 days', cost: 599 },
  { id: 'overnight', label: 'Overnight', description: '1 day',    cost: 1499 },
];

const TAX_RATE = 0.0875; // CA 8.75%

interface CartPageProps {
  cartItems: CartItem[];
  onRemove: (productId: string) => void;
  onSetQuantity?: (productId: string, quantity: number) => void;
  onCheckout: (shippingMethod: ShippingMethod) => void;
  checkoutLoading?: boolean;
  checkoutResult?: CheckoutResultProp;
  onDismissCheckoutResult?: () => void;
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
  onSetQuantity,
  onCheckout,
  checkoutLoading = false,
  checkoutResult = null,
  onDismissCheckoutResult,
  onItemSelect,
  onClose,
}: CartPageProps) {
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');

  const hasSoldOutItem = cartItems.some((item) => isSoldOut(item.product));
  const canCheckout = cartItems.length > 0 && !hasSoldOutItem && !checkoutLoading;

  // Cost breakdown (client-side preview; backend recalculates authoritatively)
  const subtotalCents = cartItems.reduce((sum, { product, quantity }) => {
    const price = (product as { price?: number }).price ?? 0;
    return sum + Math.round(price * 100) * quantity;
  }, 0);
  const shippingCents = SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)?.cost ?? 0;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

      {/* Checkout result banner */}
      {checkoutResult && (
        <div
          className={`mx-4 mt-2 rounded-lg border p-3 text-sm ${
            checkoutResult.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {checkoutResult.success ? (
            <p className="font-medium">Order placed! Order ID: {checkoutResult.orderId || '—'}</p>
          ) : (
            <div>
              <p className="font-medium">{checkoutResult.error}</p>
              {checkoutResult.soldOutIds && checkoutResult.soldOutIds.length > 0 && (
                <p className="mt-1 text-xs opacity-90">
                  Sold out: {checkoutResult.soldOutIds.join(', ')}. Remove or reduce quantity to continue.
                </p>
              )}
            </div>
          )}
          {onDismissCheckoutResult && (
            <button
              type="button"
              onClick={onDismissCheckoutResult}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

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
                      <div className="flex items-center gap-2 mt-1">
                        {onSetQuantity && !soldOut ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (quantity <= 1) onRemove(product.id);
                                else onSetQuantity(product.id, quantity - 1);
                              }}
                              className="w-6 h-6 rounded border border-black/20 flex items-center justify-center hover:bg-black/5 text-black/70 hover:text-black"
                              aria-label="Decrease quantity"
                            >
                              <span className="text-sm leading-none">−</span>
                            </button>
                            <span className="text-xs text-black/70 min-w-[1.25rem] text-center">{quantity}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetQuantity(product.id, quantity + 1);
                              }}
                              className="w-6 h-6 rounded border border-black/20 flex items-center justify-center hover:bg-black/5 text-black/70 hover:text-black"
                              aria-label="Increase quantity"
                            >
                              <span className="text-sm leading-none">+</span>
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-black/50">Qty: {quantity}</p>
                        )}
                      </div>
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

      {/* Shipping + Cost Breakdown + Checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-black/10 flex-shrink-0 space-y-3">
          {/* Shipping selector */}
          <div>
            <p className="text-xs font-semibold text-black/60 uppercase tracking-wide mb-1.5">Choose delivery</p>
            <div className="flex gap-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setShippingMethod(opt.id)}
                  className={`flex-1 rounded-lg border py-2 px-1.5 text-center transition-all text-xs ${
                    shippingMethod === opt.id
                      ? 'border-[#8C1515] bg-[#8C1515]/5 text-[#8C1515] font-semibold'
                      : 'border-black/15 text-black/60 hover:border-black/30'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-75">{opt.description}</div>
                  <div className={`font-bold mt-0.5 ${opt.cost === 0 ? 'text-green-600' : ''}`}>
                    {opt.cost === 0 ? 'FREE' : fmt(opt.cost)}
                  </div>
                </button>
              ))}
            </div>
            {shippingMethod === 'standard' && (
              <p className="text-[11px] text-green-700 mt-1.5 flex items-center gap-1">
                <span>✓</span> FREE standard shipping on all orders
              </p>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex gap-3 text-[10px] text-black/50 py-1 border-y border-black/5">
            <span className="flex items-center gap-1"><span>🛡️</span> 1-Year Warranty</span>
            <span className="flex items-center gap-1"><span>↩️</span> 30-Day Returns</span>
            <span className="flex items-center gap-1"><span>🔒</span> Secure Checkout</span>
          </div>

          {/* Cost breakdown */}
          <div className="space-y-1 text-sm text-black/70">
            <div className="flex justify-between">
              <span>Subtotal</span><span>{fmt(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCents === 0 ? <span className="text-green-600 font-semibold">FREE</span> : fmt(shippingCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8.75%)</span><span>{fmt(taxCents)}</span>
            </div>
            <div className="flex justify-between font-semibold text-black pt-1 border-t border-black/10">
              <span>Total</span><span>{fmt(totalCents)}</span>
            </div>
          </div>

          <button
            onClick={() => onCheckout(shippingMethod)}
            disabled={!canCheckout}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              canCheckout
                ? 'bg-[#8C1515] hover:bg-[#750013] text-white'
                : 'bg-black/20 text-black/50 cursor-not-allowed'
            }`}
          >
            {checkoutLoading ? 'Processing…' : hasSoldOutItem ? 'Remove sold-out items to checkout' : `Place Order · ${fmt(totalCents)}`}
          </button>
          <p className="text-[10px] text-black/40 text-center">
            By placing your order, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      )}
    </div>
  );
}
