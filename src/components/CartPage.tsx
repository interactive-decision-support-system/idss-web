'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { CartItem } from '@/services/cart';
import type { Product } from '@/types/chat';
import { isSoldOut } from '@/utils/inventory';

export type CheckoutResultProp =
  | { success: true; orderId: string }
  | { success: false; error: string; soldOutIds?: string[] }
  | null;

export type ShippingMethod = 'standard' | 'express' | 'overnight';

export interface CheckoutOptions {
  shippingMethod: ShippingMethod;
  stateCode: string;
  couponCode: string;
  discountCents: number;
}

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

// Compact US state list for dropdown (code + display name only)
const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'Washington D.C.' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const MCP_BASE =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_MCP_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    : '';

interface CartPageProps {
  cartItems: CartItem[];
  onRemove: (productId: string) => void;
  onSetQuantity?: (productId: string, quantity: number) => void;
  onCheckout: (opts: CheckoutOptions) => void;
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

interface TaxInfo {
  tax_rate_pct: number;
  state_name: string;
  tax_cents: number;
  shipping_cents: number;
}

interface CouponInfo {
  description: string;
  discount_type: string;
  discount_cents: number;
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
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [couponLoading, setCouponLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute subtotal from cart items
  const subtotalCents = cartItems.reduce((sum, { product, quantity }) => {
    const price = (product as { price?: number }).price ?? 0;
    return sum + Math.round(price * 100) * quantity;
  }, 0);

  const shippingBaseCents = SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)?.cost ?? 0;
  // Use backend-recalculated shipping (may include weight surcharges) or fall back to base
  const shippingCents = taxInfo?.shipping_cents ?? shippingBaseCents;
  // Use backend tax or fall back to CA 8.75%
  const taxCents = taxInfo?.tax_cents ?? Math.round(subtotalCents * 0.0875);
  const taxRatePct = taxInfo?.tax_rate_pct ?? 8.75;
  const stateName = taxInfo?.state_name ?? 'California';

  // Coupon discount (FREESHIP replaces shipping cost; others subtract from subtotal)
  const discountCents = appliedCoupon
    ? appliedCoupon.discount_type === 'free_shipping'
      ? shippingCents
      : appliedCoupon.discount_cents
    : 0;

  const totalCents = Math.max(0, subtotalCents + shippingCents + taxCents - discountCents);

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fetch tax + shipping from backend whenever state, method, or items change
  useEffect(() => {
    if (cartItems.length === 0) { setTaxInfo(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setTaxLoading(true);
      try {
        const items = cartItems.map(({ product, quantity }) => ({
          product_id: (product as { id: string }).id,
          unit_price_cents: Math.round(((product as { price?: number }).price ?? 0) * 100),
          quantity,
        }));
        const res = await fetch(`${MCP_BASE}/api/calculate-shipping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state_code: selectedState, shipping_method: shippingMethod, items }),
        });
        if (res.ok) {
          const data = await res.json();
          setTaxInfo({
            tax_rate_pct: data.tax_rate_pct,
            state_name: data.state_name,
            tax_cents: data.tax_cents,
            shipping_cents: data.shipping_cents,
          });
          // Re-validate coupon with updated amounts
          if (appliedCoupon) {
            setAppliedCoupon(prev => prev ? { ...prev } : null);
          }
        }
      } catch {
        // Network error — keep fallback CA rate
      } finally {
        setTaxLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, shippingMethod, subtotalCents]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await fetch(`${MCP_BASE}/api/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          description: data.description,
          discount_type: data.discount_type,
          discount_cents: data.discount_cents,
        });
        setCouponError('');
      } else {
        setCouponError(data.error ?? 'Invalid coupon code.');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  }

  const hasSoldOutItem = cartItems.some((item) => isSoldOut(item.product));
  const canCheckout = cartItems.length > 0 && !hasSoldOutItem && !checkoutLoading;

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
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gradient-to-br from-[#8C1515]/10 to-white rounded-lg overflow-hidden">
                      {hasValidImage(product) ? (
                        <Image
                          src={primaryImage(product)!}
                          alt={getDisplayTitle(product)}
                          fill
                          sizes="80px"
                          className="object-cover"
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

      {/* Shipping + State + Coupon + Cost Breakdown + Checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-black/10 flex-shrink-0 space-y-3">
          {/* State selector */}
          <div>
            <label htmlFor="state-select" className="text-xs font-semibold text-black/60 uppercase tracking-wide mb-1 block">
              Ship to state
            </label>
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setAppliedCoupon(null); setCouponError(''); }}
              className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-2 text-sm text-black focus:border-[#8C1515] focus:outline-none"
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

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

          {/* Coupon code */}
          <div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    ✓ {couponInput.toUpperCase()} — {appliedCoupon.description}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Saving {fmt(discountCents)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-green-600 underline hover:no-underline ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-black/60 uppercase tracking-wide mb-1">Promo code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter code (e.g. STANFORD10)"
                    className="flex-1 rounded-lg border border-black/15 px-2.5 py-2 text-sm text-black placeholder:text-black/30 focus:border-[#8C1515] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-2 rounded-lg border border-black/20 text-xs font-semibold text-black/70 hover:border-[#8C1515] hover:text-[#8C1515] disabled:opacity-40 transition-colors"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-600 mt-1">{couponError}</p>
                )}
              </div>
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
              <span className="flex items-center gap-1">
                Tax
                {taxLoading
                  ? <span className="text-[10px] text-black/40 animate-pulse">calc…</span>
                  : <span className="text-[10px] text-black/40">({taxRatePct}% {stateName})</span>
                }
              </span>
              <span>{fmt(taxCents)}</span>
            </div>
            {appliedCoupon && discountCents > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({couponInput.toUpperCase()})</span>
                <span>−{fmt(discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-black pt-1 border-t border-black/10">
              <span>Total</span><span>{fmt(totalCents)}</span>
            </div>
          </div>

          <button
            onClick={() => onCheckout({
              shippingMethod,
              stateCode: selectedState,
              couponCode: appliedCoupon ? couponInput.toUpperCase() : '',
              discountCents,
            })}
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
