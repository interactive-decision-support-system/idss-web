'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface CheckoutSession {
  id: string;
  status: string;
  line_items: { id: string; item: { id: string; title: string; price: number }; quantity: number; total: number }[];
  totals: { type: string; amount: number; display_text?: string }[];
  currency: string;
  order?: { id: string; permalink_url: string };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  // Load cart items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Create checkout session when cart items load
  useEffect(() => {
    if (favorites.length > 0 && !session) {
      createCheckoutSession();
    }
  }, [favorites]);

  const createCheckoutSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_BASE_URL || '';
      const url = baseUrl ? `${baseUrl}/ucp/checkout-sessions` : '/api/checkout';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: favorites.map(p => ({
            item: { id: p.id, title: p.title, price: p.price || 0 },
            quantity: 1,
          })),
          currency: 'USD',
        }),
      });
      if (!res.ok) throw new Error(`Failed to create checkout session: ${res.status}`);
      const data = await res.json();
      setSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const sessionShortId = session.id.split('/').pop();
      const baseUrl = API_BASE_URL || '';
      const url = baseUrl
        ? `${baseUrl}/ucp/checkout-sessions/${sessionShortId}/complete`
        : `/api/checkout/${sessionShortId}/complete`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_data: { id: 'demo_payment', type: 'card', status: 'success' },
        }),
      });
      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
      const data = await res.json();
      setSession(data);
      setOrderComplete(true);
      // Clear cart
      localStorage.removeItem('favorites');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const subtotal = favorites.reduce((sum, p) => sum + (p.price || 0), 0);
  const tax = Math.round(subtotal * 0.085 * 100) / 100;
  const total = subtotal + tax;

  if (orderComplete && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-black/5 shadow-xl p-8">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black">Order Confirmed</h1>
          <p className="text-black/60">
            Your order has been placed successfully.
          </p>
          <div className="bg-black/5 rounded-xl p-4 text-left">
            <p className="text-sm text-black/60">Order ID</p>
            <p className="text-sm font-mono font-medium text-black">{session.order?.id || session.id}</p>
            <p className="text-sm text-black/60 mt-2">Total</p>
            <p className="text-lg font-bold text-[#8C1515]">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <button
            onClick={goBack}
            className="inline-block bg-[#8C1515] hover:bg-[#750013] text-white py-3 px-6 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-black">Checkout</h1>
          <button onClick={goBack} className="text-sm text-[#8C1515] hover:text-[#750013] font-medium cursor-pointer">
            Back to Shopping
          </button>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-black/60 text-lg mb-4">Your cart is empty</p>
            <button onClick={goBack} className="text-[#8C1515] hover:text-[#750013] font-medium cursor-pointer">
              Browse products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl shadow-sm divide-y divide-black/5">
              {favorites.map((product) => (
                <div key={product.id} className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-black/5 rounded-xl flex-shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url as string}
                        alt={product.title as string | undefined}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/30 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-black truncate">{product.title as string}</h3>
                    {product.brand && <p className="text-xs text-black/50 mt-0.5">{product.brand as string}</p>}
                    <p className="text-sm font-bold text-[#8C1515] mt-1">
                      ${(product.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-black mb-2">Order Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">Subtotal ({favorites.length} items)</span>
                <span className="text-black">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">Estimated Tax (8.5%)</span>
                <span className="text-black">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-black/10 pt-3 flex justify-between">
                <span className="text-base font-semibold text-black">Total</span>
                <span className="text-lg font-bold text-[#8C1515]">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={completeCheckout}
              disabled={loading}
              className="w-full bg-[#8C1515] hover:bg-[#750013] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? 'Processing...' : `Place Order - $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </button>

            <p className="text-xs text-black/40 text-center">
              By placing this order, you agree to the Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
