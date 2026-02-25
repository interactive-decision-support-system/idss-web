'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from '@/components/ChatInput';
import StackedRecommendationCards from '@/components/StackedRecommendationCards';
import ComparisonSideBySide from '@/components/ComparisonSideBySide';
import ProductDetailView from '@/components/ProductDetailView';
import FavoritesPage from '@/components/FavoritesPage';
import CartPage from '@/components/CartPage';
import AuthButton from '@/components/AuthButton';
import RecommendationActionBar from '@/components/RecommendationActionBar';
import { ChatMessage, Product, UserLocation } from '@/types/chat';
import { idssApiService } from '@/services/api';
import { favoritesService } from '@/services/favorites';
import { cartService, type CartItem } from '@/services/cart';
import { useAuth } from '@/hooks/useAuth';
import { getMultiDomainDefaults } from '@/config/domain-config';
import { convertAPIVehiclesToProducts } from '@/utils/product-converter';

// --- Parse **bold** markdown into <strong> elements ---
function parseBold(text: string): React.ReactNode {
  if (!text.includes('**')) return text;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold">{part}</strong>
          : (part || null)
      )}
    </>
  );
}

// --- Render a single bullet item that may contain \n-separated sub-lines ---
// Line 0: product name (usually **bold**) — normal weight
// Lines 1+: spec values and insight — smaller, muted
function renderBulletLines(text: string): React.ReactNode {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return <span>{parseBold(text.trim())}</span>;
  return (
    <div className="space-y-0.5">
      <p className="leading-snug">{parseBold(lines[0])}</p>
      {lines.slice(1).map((line, i) => (
        <p key={i} className="text-sm text-black/65 leading-snug">{parseBold(line)}</p>
      ))}
    </div>
  );
}

// --- Render AI response text: bullet list + bold markdown ---
function formatRecommendationText(content: string): React.ReactNode {
  if (!content) return null;

  // Bullet-point format: text contains '•' characters
  if (content.includes('•')) {
    const segments = content.split(/\s*•\s*/);
    const intro = segments[0].trim();
    const rawBullets = segments.slice(1).map(s => s.trim()).filter(Boolean);

    // Extract "Best pick:" suffix from last bullet (LLM often appends it inline)
    let bestPick: string | null = null;
    if (rawBullets.length > 0) {
      const last = rawBullets[rawBullets.length - 1];
      const bpIdx = last.indexOf('Best pick:');
      if (bpIdx !== -1) {
        const before = last.slice(0, bpIdx).trim();
        bestPick = last.slice(bpIdx).trim();
        if (before) rawBullets[rawBullets.length - 1] = before;
        else rawBullets.pop();
      }
    }

    return (
      <div className="space-y-2">
        {intro && <p className="leading-relaxed">{parseBold(intro)}</p>}
        {rawBullets.length > 0 && (
          <ul className="space-y-2.5 list-none">
            {rawBullets.map((item, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="text-[#8C1515] font-bold shrink-0 mt-0.5">•</span>
                <span className="flex-1">{renderBulletLines(item)}</span>
              </li>
            ))}
          </ul>
        )}
        {bestPick && (
          <p className="font-semibold mt-1 leading-relaxed">{parseBold(bestPick)}</p>
        )}
      </div>
    );
  }

  // Prose text (no bullets): parse **bold** and render with proper line breaks
  if (content.includes('**') || content.includes('\n')) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      return (
        <div className="space-y-2">
          {lines.map((line, i) => (
            <p key={i} className="leading-relaxed">{parseBold(line)}</p>
          ))}
        </div>
      );
    }
    return <span className="leading-relaxed">{parseBold(content)}</span>;
  }

  return content;
}

// --- Frontend Latency Logging ---
const logFrontendLatency = async (label: string, data: Record<string, unknown>) => {
  console.log(`[LATENCY] ${label}`, data);
  try {
    await fetch('/api/log-latency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, ...data }),
    });
  } catch {
    // Ignore network/logging errors
  }
};

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<
    { success: true; orderId: string } | { success: false; error: string; soldOutIds?: string[] } | null
  >(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable' | 'error'
  >('unknown');
  const [locationDismissed, setLocationDismissed] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const multiDomainDefaults = getMultiDomainDefaults();

  // Check if this is the initial state (only welcome message)
  const isInitialState = chatMessages.length === 1 && chatMessages[0]?.role === 'assistant';
  const showLocationBanner =
    !locationDismissed && !userLocation && locationPermission !== 'unavailable';

  // Load favorites when userId changes (or on mount for guest)
  // When user logs in with localStorage favorites, migrate them to Supabase first
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (userId) {
        const local = typeof window !== 'undefined' ? localStorage.getItem('favorites') : null;
        if (local && local !== '[]') {
          const merged = await favoritesService.migrateLocalToSupabase(userId);
          if (!cancelled) setFavorites(merged);
          return;
        }
      }
      const loaded = await favoritesService.load(userId);
      if (!cancelled) setFavorites(loaded);
    };
    run();
    return () => { cancelled = true; };
  }, [userId]);

  const toggleFavorite = async (product: Product) => {
    const currentlyFavorited = favorites.some(p => p.id === product.id);
    if (currentlyFavorited) {
      setFavorites(prev => prev.filter(p => p.id !== product.id));
      await favoritesService.remove(userId, product.id);
    } else {
      setFavorites(prev => [...prev, product]);
      await favoritesService.add(userId, product);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(p => p.id === productId);
  };

  // Load cart when userId changes (or on mount for guest)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (userId) {
        const local = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
        if (local && local !== '[]') {
          const merged = await cartService.migrateLocalToSupabase(userId);
          if (!cancelled) setCartItems(merged);
          return;
        }
      }
      const loaded = await cartService.load(userId);
      if (!cancelled) setCartItems(loaded);
    };
    run();
    return () => { cancelled = true; };
  }, [userId]);

  const addToCart = async (product: Product) => {
    if ((product as { inventory?: number }).inventory === 0) return;
    const prev = cartItems;
    setCartItems((p) => {
      const idx = p.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...p];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...p, { product, quantity: 1 }];
    });
    try {
      await cartService.add(userId, product);
    } catch (e) {
      setCartItems(prev);
      console.error('Add to cart failed:', e);
    }
  };

  const removeFromCart = async (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
    try {
      await cartService.remove(userId, productId);
    } catch {
      const fresh = await cartService.load(userId);
      setCartItems(fresh);
    }
  };

  const setQuantityInCart = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === productId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], quantity };
      return next;
    });
    try {
      await cartService.setQuantity(userId, productId, quantity);
    } catch {
      const fresh = await cartService.load(userId);
      setCartItems(fresh);
    }
  };

  const handleCheckout = async () => {
    setCheckoutResult(null);
    setCheckoutLoading(true);
    try {
      const result = await cartService.checkout(userId, cartItems);
      if (result.success) {
        setCheckoutResult({ success: true, orderId: result.orderId ?? '' });
        setCartItems([]);
        const fresh = await cartService.load(userId);
        setCartItems(fresh);
      } else {
        setCheckoutResult({
          success: false,
          error: result.error ?? 'Checkout failed',
          soldOutIds: result.soldOutIds,
        });
        if (result.soldOutIds?.length) {
          const fresh = await cartService.load(userId);
          setCartItems(fresh);
        }
      }
    } catch (e) {
      setCheckoutResult({
        success: false,
        error: e instanceof Error ? e.message : 'Checkout failed',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Initialize with welcome message (multi-domain)
  useEffect(() => {
    if (chatMessages.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'initial',
        role: 'assistant',
        content: multiDomainDefaults.welcomeMessage,
        timestamp: new Date(),
      };
      setChatMessages([initialMessage]);
    }
  }, [chatMessages.length, multiDomainDefaults.welcomeMessage]);

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationPermission('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          captured_at: new Date(pos.timestamp).toISOString(),
        });
        setLocationPermission('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationPermission('denied');
        } else {
          setLocationPermission('error');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  }, []);

  // Ask for / detect location permission at session start
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    // If Permissions API exists, use it to decide whether to auto-fetch.
    // Otherwise, fall back to showing a prompt CTA (browser will ask when we call geolocation).
    const permissions = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (!permissions?.query) {
      setLocationPermission(navigator.geolocation ? 'prompt' : 'unavailable');
      return;
    }

    let cancelled = false;
    permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setLocationPermission(status.state as 'prompt' | 'granted' | 'denied');

        // If already granted, capture location immediately so it's available for the first message.
        if (status.state === 'granted') {
          requestUserLocation();
        }

        status.onchange = () => {
          setLocationPermission(status.state as 'prompt' | 'granted' | 'denied');
          if (status.state === 'granted') requestUserLocation();
        };
      })
      .catch(() => {
        setLocationPermission(navigator.geolocation ? 'prompt' : 'unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [requestUserLocation]);

  // Auto-scroll chat messages to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesContainerRef.current && !isInitialState) {
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTo({
            top: chatMessagesContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, [chatMessages, isLoading, isInitialState]);

  const handleChatMessage = async (message: string) => {
    // Strip hidden [ctx:...] context tag before displaying in chat.
    // The full message (with tag) is still sent to the backend for routing.
    const displayContent = message.replace(/\s*\[ctx:[^\]]*\]/g, '').trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // --- Latency logging ---
    const tRequest = performance.now();
    try {
      const response = await idssApiService.sendMessage(
        message,
        sessionId || undefined,
        userLocation || undefined
      );
      const tResponse = performance.now();
      // Persist session ID so subsequent messages use the same backend session
      if (response.session_id) setSessionId(response.session_id);
      logFrontendLatency('API Response Received', {
        session_id: response.session_id,
        tRequest,
        tResponse,
        backendTimings: response.timings_ms,
      });

      // Convert API recommendations to Product format if present
      let productRecommendations: Product[][] | undefined;
      if (response.recommendations) {
        productRecommendations = convertAPIVehiclesToProducts(response.recommendations);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        recommendations: productRecommendations,
        bucket_labels: response.bucket_labels,
        diversification_dimension: response.diversification_dimension,
        quick_replies: response.quick_replies,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      // --- Log render time after products are rendered ---
      if (productRecommendations) {
        setTimeout(() => {
          const tRendered = performance.now();
          logFrontendLatency('Products Rendered', {
            session_id: response.session_id,
            tRequest,
            tResponse,
            tRendered,
            backendTimings: response.timings_ms,
            totalToRender: tRendered - tRequest,
            apiToRender: tRendered - tResponse,
          });
        }, 0);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I ran into an issue. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-screen bg-[var(--color-bg)] flex overflow-hidden relative ${showLocationBanner ? 'pt-12' : ''}`}>
      {/* Location permission alert (sticky, disappears once enabled) */}
      {showLocationBanner && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-white/95 backdrop-blur shadow-sm px-4 py-2">
              <div className="text-sm text-black/80">
                {locationPermission === 'denied' ? (
                  <>Location permission is blocked in your browser settings.</>
                ) : locationPermission === 'error' ? (
                  <>Couldn’t access your location. You can try again.</>
                ) : (
                  <>Enable location to personalize recommendations near you.</>
                )}
              </div>

              <div className="flex items-center gap-3">
                {locationPermission !== 'denied' && (
                  <button
                    type="button"
                    onClick={requestUserLocation}
                    className="text-sm font-medium text-[#8C1515] hover:text-[#750013] transition-colors"
                  >
                    Enable
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLocationDismissed(true)}
                  className="text-sm font-medium text-black/60 hover:text-black transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden min-h-0 transition-all duration-300 ${showFavorites || showCart || selectedProduct ? 'pr-96' : ''}`}>
        {/* Floating Title - IDSS */}
        <div className="absolute top-4 left-4 z-10">
          <h1 className="text-xl font-semibold text-black">IDSS</h1>
        </div>

        {/* Auth + Cart + Favorites - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-4 z-[1000]">
          <AuthButton />
          {/* Cart Icon Button */}
          <button
            onClick={() => {
              setShowCart(!showCart);
              if (showCart) setSelectedProduct(null);
              setShowFavorites(false);
            }}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-all duration-200 -ml-1 -mr-4"
            title={showCart ? "Hide Cart" : "View Cart"}
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8C1515] text-white text-[10px] font-medium flex items-center justify-center">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          {!selectedProduct && (
            <button
              onClick={() => {
                setShowFavorites(!showFavorites);
                if (showFavorites) setSelectedProduct(null);
                setShowCart(false);
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-all duration-200"
              title={showFavorites ? "Hide Favorites" : "View Favorites"}
            >
              <svg
                className={`w-5 h-5 transition-all duration-200 ${favorites.length > 0 ? 'text-[#ff1323] fill-[#ff1323]' : 'text-black'}`}
                fill={favorites.length > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div
          ref={chatMessagesContainerRef}
          className={`flex-1 overflow-y-auto min-h-0 scrollbar-hide ${isInitialState ? 'flex items-center justify-center' : 'px-8 py-8'} pl-20`}
        >
          {isInitialState ? (
            // Initial centered welcome screen
            <div className="max-w-3xl w-full space-y-8">
              {/* Large Welcome Message */}
              <div className="text-center space-y-4">
                <div className="text-3xl font-extrabold text-black leading-tight">
                  {multiDomainDefaults.welcomeMessage}
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-6">
                  {/* Laptop Category Tiles */}
                  <button
                    onClick={() => handleChatMessage('Show me school laptops')}
                    className="card card-blue flex flex-col items-center w-44 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
                  >
                    <span className="text-3xl mb-2">🎓</span>
                    <span className="font-semibold text-base text-black">School Laptops</span>
                    <span className="text-xs text-black/50 mt-1 text-center">Budget-friendly, lightweight</span>
                  </button>
                  <button
                    onClick={() => handleChatMessage('Show me Mac laptops')}
                    className="card card-peach flex flex-col items-center w-44 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
                  >
                    <span className="text-3xl mb-2">🍎</span>
                    <span className="font-semibold text-base text-black">Mac Laptops</span>
                    <span className="text-xs text-black/50 mt-1 text-center">Apple MacBook lineup</span>
                  </button>
                  <button
                    onClick={() => handleChatMessage('Show me Framework laptops')}
                    className="card card-green flex flex-col items-center w-44 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
                  >
                    <span className="text-3xl mb-2">⚙️</span>
                    <span className="font-semibold text-base text-black">Framework Laptops</span>
                    <span className="text-xs text-black/50 mt-1 text-center">Modular & repairable</span>
                  </button>
                </div>
              </div>

              {/* Centered Input Box */}
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <ChatInput
                    onSendMessage={handleChatMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Regular chat messages
            <div className="max-w-4xl mx-auto flex flex-col space-y-8">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  {message.role === 'user' ? (
                    // User message with bubble
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#8C1515] to-[#750013] text-white shadow-sm">
                        <div className="text-base leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Assistant message - no bubble, full width
                    (() => {
                      const isCompare = message.bucket_labels?.[0] === 'Compared Items';
                      const allProducts = message.recommendations
                        ? message.recommendations.flat().filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
                        : [];
                      // Extract "Best pick:" line from comparison narrative
                      const bestPickText = isCompare ? (() => {
                        const idx = message.content.indexOf('Best pick:');
                        return idx !== -1 ? message.content.slice(idx).split('\n')[0].trim() : null;
                      })() : null;

                      return (
                        <div className="space-y-4">
                          <div className="text-base leading-relaxed text-black">
                            {isCompare
                              ? (bestPickText
                                  ? <p className="font-semibold leading-relaxed">{bestPickText}</p>
                                  : null)
                              : formatRecommendationText(message.content)
                            }
                          </div>

                          {/* Compare: side-by-side spec table */}
                          {isCompare && allProducts.length > 0 && (
                            <ComparisonSideBySide products={allProducts} />
                          )}

                          {/* Regular recommendations: stacked cards */}
                          {!isCompare && message.recommendations && message.recommendations.length > 0 && (
                            <StackedRecommendationCards
                              recommendations={message.recommendations}
                              bucket_labels={message.bucket_labels}
                              diversification_dimension={message.diversification_dimension}
                              onItemSelect={(p) => {
                                setSelectedProduct(p);
                                setShowFavorites(false);
                                setShowCart(false);
                              }}
                              onToggleFavorite={toggleFavorite}
                              isFavorite={isFavorite}
                              onAddToCart={addToCart}
                            />
                          )}

                          {/* Action bar — shown for both compare and regular recommendations */}
                          {message.recommendations && message.recommendations.length > 0 && (
                            <RecommendationActionBar
                              products={allProducts}
                              onSendMessage={handleChatMessage}
                            />
                          )}

                          {/* Quick reply buttons — hidden when RecommendationActionBar is shown */}
                          {message.quick_replies && message.quick_replies.length > 0 && !(message.recommendations && message.recommendations.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                              {message.quick_replies.map((reply, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleChatMessage(reply)}
                                  disabled={isLoading}
                                  className="px-4 py-2 bg-white hover:bg-black/5 border border-black/20 hover:border-black/40 text-black hover:text-black text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                  {reply}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#8b959e] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#8C1515] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#8b959e] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-[#8b959e]">Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input - Only show when not in initial state */}
        {!isInitialState && (
          <div className="px-8 py-4 flex-shrink-0 pl-20">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleChatMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Cart, Favorites, or Product Detail (starts below header buttons) */}
      {(showCart || showFavorites || selectedProduct) && (
        <div className="absolute top-16 right-4 bottom-4 w-80 bg-white rounded-xl border border-black/10 shadow-2xl flex flex-col z-20">
          {showCart && (
            <CartPage
              cartItems={cartItems}
              onRemove={removeFromCart}
              onSetQuantity={setQuantityInCart}
              onCheckout={handleCheckout}
              checkoutLoading={checkoutLoading}
              checkoutResult={checkoutResult}
              onDismissCheckoutResult={() => setCheckoutResult(null)}
              onItemSelect={(product) => {
                setSelectedProduct(product);
                setShowCart(false);
              }}
              onClose={() => {
                setShowCart(false);
                setCheckoutResult(null);
              }}
            />
          )}
          {showFavorites && !showCart && (
            <FavoritesPage
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onItemSelect={(product) => {
                setSelectedProduct(product);
                setShowFavorites(false);
              }}
              onClose={() => setShowFavorites(false)}
            />
          )}
          {selectedProduct && !showCart && !showFavorites && (
            <ProductDetailView
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={addToCart}
            />
          )}
        </div>
      )}
    </div>
  );
}
