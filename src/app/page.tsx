'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ChatInput from '@/components/ChatInput';
import StackedRecommendationCards from '@/components/StackedRecommendationCards';
import ComparisonSideBySide from '@/components/ComparisonSideBySide';
import ProductDetailView from '@/components/ProductDetailView';
import FavoritesPage from '@/components/FavoritesPage';
import CartPage, { type CheckoutOptions } from '@/components/CartPage';
import AuthButton from '@/components/AuthButton';
import RecommendationActionBar from '@/components/RecommendationActionBar';
import ConversationSidebar from '@/components/ConversationSidebar';
import ProductChatPanel from '@/components/ProductChatPanel';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { ChatMessage, Product, UserLocation } from '@/types/chat';
import type { SavedSession, ChatFolder } from '@/types/chat';
import { idssApiService } from '@/services/api';
import { favoritesService } from '@/services/favorites';
import { cartService, type CartItem } from '@/services/cart';
import { useAuth } from '@/hooks/useAuth';
import { getMultiDomainDefaults } from '@/config/domain-config';
import { convertAPIVehiclesToProducts, convertAPIVehicleToProduct } from '@/utils/product-converter';

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

  // ── Detect "Tell me more" / feature-list style content ─────────────────────
  // Pattern: multi-line text with "- item" markdown lists and/or "Great for:" sections
  const hasMarkdownList = /^[\s\S]*?^[ \t]*-[ \t]+\S/m.test(content);
  if (hasMarkdownList || content.includes('\n')) {
    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let key = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      // "- item" or "* item" markdown bullet
      if (/^[-*]\s+/.test(line)) {
        // Collect consecutive bullet lines into a list
        const bullets: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          bullets.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        nodes.push(
          <ul key={key++} className="space-y-1.5 list-none mt-1">
            {bullets.map((b, bi) => (
              <li key={bi} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-[#8C1515] font-bold shrink-0 mt-0.5">•</span>
                <span className="flex-1">{parseBold(b)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // "Great for:" or "Best for:" section label
      if (/^(great for|best for|ideal for|perfect for):/i.test(line)) {
        const [label, ...rest] = line.split(':');
        const items = rest.join(':').split(/[,;]/).map(s => s.trim()).filter(Boolean);
        nodes.push(
          <div key={key++} className="mt-2">
            <p className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-1">{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, ii) => (
                <span key={ii} className="px-2 py-0.5 text-xs rounded-full bg-[#8C1515]/8 text-[#8C1515] font-medium border border-[#8C1515]/20">
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // "**Product Name:**" or "### Header" section header
      if (/^\*\*.+\*\*:?$/.test(line) || /^#{1,3}\s+/.test(line)) {
        const headerText = line.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
        nodes.push(
          <p key={key++} className="font-semibold text-black text-sm mt-3 first:mt-0 pb-0.5 border-b border-black/10">
            {parseBold(headerText)}
          </p>
        );
        i++;
        continue;
      }

      // "• bullet" style (existing)
      if (line.startsWith('•')) {
        const bullets: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('•')) {
          bullets.push(lines[i].trim().replace(/^•\s*/, ''));
          i++;
        }
        nodes.push(
          <ul key={key++} className="space-y-2 list-none mt-1">
            {bullets.map((b, bi) => (
              <li key={bi} className="flex gap-2 leading-relaxed">
                <span className="text-[#8C1515] font-bold shrink-0 mt-0.5">•</span>
                <span className="flex-1">{renderBulletLines(b)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // "Pros:" / "Cons:" lines — bold label + bullet
      if (/^(pros|cons):/i.test(line)) {
        const colonIdx = line.indexOf(':');
        const label = line.slice(0, colonIdx);
        const text = line.slice(colonIdx + 1).trim();
        nodes.push(
          <div key={key++} className="flex gap-2 text-sm leading-relaxed mt-0.5">
            <span className="text-[#8C1515] font-bold shrink-0 mt-0.5">•</span>
            <span className="flex-1">
              <strong className="font-semibold">{label}:</strong>{text ? ` ${text}` : ''}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // "Best pick:" standalone line
      if (/^best pick:/i.test(line)) {
        nodes.push(
          <p key={key++} className="font-semibold mt-1 leading-relaxed text-[#8C1515]">
            {parseBold(line)}
          </p>
        );
        i++;
        continue;
      }

      // Regular paragraph
      nodes.push(<p key={key++} className="leading-relaxed text-sm">{parseBold(line)}</p>);
      i++;
    }

    return <div className="space-y-1">{nodes}</div>;
  }

  // Bullet-point format: text contains '•' characters (no newlines)
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

  // Plain text with **bold**
  if (content.includes('**')) {
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
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const THINKING_PHASES = [
    "Analyzing your request...",
    "Searching products...",
    "Generating recommendations...",
    "Almost there...",
  ];
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
  const [showHistory, setShowHistory] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [savedFolders, setSavedFolders] = useState<ChatFolder[]>([]);
  const [productChatTarget, setProductChatTarget] = useState<Product | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const multiDomainDefaults = getMultiDomainDefaults();

  // Check if this is the initial state (only welcome message)
  const isInitialState = chatMessages.length === 1 && chatMessages[0]?.role === 'assistant';
  const showLocationBanner =
    !locationDismissed && !userLocation && locationPermission !== 'unavailable';

  // Load conversation history and folders from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('idss_history');
      if (raw) setSavedSessions(JSON.parse(raw));
    } catch { /* ignore corrupt data */ }
    try {
      const rawFolders = localStorage.getItem('idss_folders');
      if (rawFolders) setSavedFolders(JSON.parse(rawFolders));
    } catch { /* ignore corrupt data */ }
  }, []);

  // Save current session snapshot to localStorage
  const saveSessionSnapshot = () => {
    if (!sessionId || chatMessages.length <= 1) return; // nothing to save
    const userMsg = chatMessages.find(m => m.role === 'user');
    if (!userMsg) return;
    const title = (userMsg.content || '').slice(0, 42).trim() + ((userMsg.content || '').length > 42 ? '…' : '');
    // Determine domain from last recommendations or bucket labels
    const lastRec = [...chatMessages].reverse().find(m => m.recommendations);
    const domain = lastRec?.bucket_labels?.[0]?.toLowerCase().includes('vehicle') ? 'vehicles'
      : lastRec?.recommendations?.[0]?.[0] && ('vehicle' in (lastRec.recommendations[0][0] as object)) ? 'vehicles'
      : null;
    const newSession: SavedSession = {
      sessionId,
      title,
      domain,
      timestamp: new Date().toISOString(),
      messages: chatMessages,
    };
    setSavedSessions(prev => {
      const filtered = prev.filter(s => s.sessionId !== sessionId);
      const updated = [newSession, ...filtered].slice(0, 20); // keep max 20
      try { localStorage.setItem('idss_history', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  // New Search: save current session, then reset all state
  const handleNewSearch = () => {
    saveSessionSnapshot();
    setChatMessages([]);
    setSessionId(null);
    setSelectedProduct(null);
    setShowCart(false);
    setShowFavorites(false);
    setShowHistory(false);
  };

  // Load a saved session into the chat view
  const handleLoadSession = (session: SavedSession) => {
    setChatMessages(session.messages);
    setSessionId(session.sessionId);
    setShowHistory(false);
    setSelectedProduct(null);
    setShowCart(false);
    setShowFavorites(false);
  };

  // Clear all saved history
  const handleClearHistory = () => {
    setSavedSessions([]);
    try { localStorage.removeItem('idss_history'); } catch { /* ignore */ }
  };

  // Folder helpers
  const persistFolders = (folders: ChatFolder[]) => {
    try { localStorage.setItem('idss_folders', JSON.stringify(folders)); } catch { /* ignore */ }
  };
  const persistSessions = (sessions: SavedSession[]) => {
    try { localStorage.setItem('idss_history', JSON.stringify(sessions)); } catch { /* ignore */ }
  };

  const handleCreateFolder = (name: string) => {
    const folder: ChatFolder = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    setSavedFolders(prev => { const next = [...prev, folder]; persistFolders(next); return next; });
  };

  const handleDeleteFolder = (folderId: string) => {
    // Remove folder and unassign its sessions
    setSavedFolders(prev => { const next = prev.filter(f => f.id !== folderId); persistFolders(next); return next; });
    setSavedSessions(prev => {
      const next = prev.map(s => s.folderId === folderId ? { ...s, folderId: undefined } : s);
      persistSessions(next);
      return next;
    });
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setSavedFolders(prev => { const next = prev.map(f => f.id === folderId ? { ...f, name: newName } : f); persistFolders(next); return next; });
  };

  const handleMoveToFolder = (sessionId: string, folderId: string | null) => {
    setSavedSessions(prev => {
      const next = prev.map(s => s.sessionId === sessionId ? { ...s, folderId: folderId ?? undefined } : s);
      persistSessions(next);
      return next;
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions(prev => {
      const next = prev.filter(s => s.sessionId !== sessionId);
      persistSessions(next);
      return next;
    });
  };

  // Share current chat — posts to backend, copies link to clipboard
  const handleShareChat = async () => {
    const userMessages = chatMessages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return;
    const title = userMessages[0]?.content?.slice(0, 60) || 'IDSS Chat';
    try {
      const shareId = await idssApiService.shareChat(
        chatMessages.map(m => ({ role: m.role, content: m.content })),
        title,
        sessionId || ''
      );
      const shareUrl = `${window.location.origin}/s/${shareId}`;
      // Try modern clipboard API first, fall back to execCommand
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setShareCopied(true);
      setShareError(false);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setShareError(true);
      setTimeout(() => setShareError(false), 3000);
    }
  };

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
    setShowCart(true);
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

  const handleCheckout = async ({ shippingMethod }: CheckoutOptions) => {
    setCheckoutResult(null);
    setCheckoutLoading(true);
    try {
      const result = await cartService.checkout(userId, cartItems, undefined, shippingMethod);
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

  // Cycle thinking phase messages while loading
  useEffect(() => {
    if (!isLoading) {
      setThinkingPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingPhase(prev => Math.min(prev + 1, THINKING_PHASES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

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

    // Create AbortController for cancellation support
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        domain: response.domain ?? undefined,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      // Sync cart when backend confirms an add-to-cart action
      if (response.cart_action?.action === 'add_to_cart' && response.cart_action.product) {
        // cart_action.product may be raw Supabase dict or UnifiedProduct — normalise
        const p = response.cart_action.product as unknown as Record<string, unknown>;
        const img = p.image as Record<string, unknown> | undefined;
        const cartProduct = {
          id: String(p.id ?? p.product_id ?? ''),
          title: String(p.name ?? p.title ?? 'Product'),
          price: Number(p.price ?? 0),
          image_url: String(img?.primary ?? p.imageurl ?? p.image_url ?? ''),
          brand: String(p.brand ?? ''),
        } as Product;
        addToCart(cartProduct);
      }

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
      // Don't show error if user cancelled the request
      if (controller.signal.aborted) return;
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
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-screen bg-[var(--color-bg)] flex overflow-hidden relative ${showLocationBanner ? 'pt-12' : ''}`}>
      {/* Location permission alert — compact chip below header, clear of top-right icons */}
      {showLocationBanner && (
        <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-black/10 bg-white/95 backdrop-blur shadow-sm px-4 py-1.5 whitespace-nowrap">
            <svg className="w-3.5 h-3.5 text-black/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-black/70">
              {locationPermission === 'denied'
                ? 'Location blocked in browser settings.'
                : locationPermission === 'error'
                ? "Couldn't access location."
                : 'Enable location for nearby recommendations.'}
            </span>
            {locationPermission !== 'denied' && (
              <button
                type="button"
                onClick={requestUserLocation}
                className="text-xs font-semibold text-[#8C1515] hover:text-[#750013] transition-colors"
              >
                Enable
              </button>
            )}
            <button
              type="button"
              onClick={() => setLocationDismissed(true)}
              className="text-black/30 hover:text-black/60 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area — offset by sidebar width on desktop */}
      <div className={`flex-1 flex flex-col overflow-hidden min-h-0 transition-all duration-300 md:pl-60 ${showFavorites || showCart || selectedProduct || productChatTarget ? 'pr-96' : ''}`}>
        {/* Mobile history toggle — top left, only on small screens */}
        <div className="absolute top-3 left-3 z-10 md:hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-black/15 shadow-sm hover:bg-black/5 transition-all duration-200"
            aria-label="Toggle chat history"
          >
            <svg className="w-4 h-4 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs font-medium text-black/60">History</span>
          </button>
        </div>

        {/* Auth + New Search + Cart + Favorites - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-4 z-[1000]">
          {/* New Search button — only on mobile (desktop uses sidebar New Chat) */}
          {!isInitialState && chatMessages.length > 1 && (
            <button
              onClick={handleNewSearch}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#8C1515] text-[#8C1515] rounded-full hover:bg-[#8C1515] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          )}
          {/* Connect via messaging app — always visible */}
          <Link
            href="/connect"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm border border-black/15 text-black/50 rounded-full hover:bg-black/5 hover:text-black/70 transition-colors"
            title="Use IDSS via WhatsApp, iMessage, Telegram"
          >
            <span className="text-base leading-none">🦞</span>
            <span>Connect</span>
          </Link>

          {/* Share button — visible once the user has had a conversation */}
          {!isInitialState && chatMessages.length > 1 && (
            <button
              onClick={handleShareChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-black/20 text-black/70 rounded-full hover:bg-black/5 transition-colors"
              title="Copy shareable link to this chat"
            >
              {shareCopied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 font-medium">Copied!</span>
                </>
              ) : shareError ? (
                <span className="text-red-500 font-medium">Failed — try again</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          )}
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
                className={`w-5 h-5 transition-all duration-200 ${favorites.length > 0 ? 'text-[#8C1515] fill-[#8C1515]' : 'text-black'}`}
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
              {chatMessages.map((message, msgIdx) => (
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

                      // Extract criteria from the user message that triggered this comparison
                      // Message format: "Compare X vs Y by Weight, GPU [ctx:id1,id2]"
                      const selectedCriteria: string[] = (() => {
                        if (!isCompare) return [];
                        const prevUserMsg = chatMessages.slice(0, msgIdx).reverse().find(m => m.role === 'user');
                        if (!prevUserMsg) return [];
                        const byMatch = prevUserMsg.content.match(/\bby\s+(.*?)(?:\s*\[ctx:|$)/i);
                        if (!byMatch) return [];
                        return byMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
                      })();

                      return (
                        <div className="space-y-4">
                          {/* For comparison responses, only show the non-bestPickText content portion */}
                          {!isCompare && (
                            <div className="text-base leading-relaxed text-black">
                              {formatRecommendationText(message.content)}
                            </div>
                          )}

                          {/* Compare: side-by-side spec table (handles bullet summary + bestPickText internally) */}
                          {isCompare && allProducts.length > 0 && (
                            <ComparisonSideBySide
                              products={allProducts}
                              bestPickText={bestPickText}
                              selectedCriteria={selectedCriteria}
                            />
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
                              onAskAI={(p) => {
                                setProductChatTarget(p);
                                setSelectedProduct(null);
                                setShowCart(false);
                                setShowFavorites(false);
                              }}
                              onSendMessage={handleChatMessage}
                            />
                          )}

                          {/* Action bar — shown for both compare and regular recommendations */}
                          {message.recommendations && message.recommendations.length > 0 && (
                            <RecommendationActionBar
                              products={allProducts}
                              onSendMessage={handleChatMessage}
                              quickReplies={message.quick_replies}
                              domain={message.domain}
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

              {/* Loading skeleton — shows progress + cancel (Nielsen H1 & H3) */}
              {isLoading && (
                <LoadingSkeleton
                  phase={thinkingPhase}
                  phases={THINKING_PHASES}
                  onCancel={handleCancelRequest}
                />
              )}
            </div>
          )}
        </div>

        {/* Chat Input - Only show when not in initial state */}
        {!isInitialState && (
          <div className="px-8 py-4 flex-shrink-0">
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

      {/* Per-product Ask AI panel */}
      {productChatTarget && (
        <div className="absolute top-16 right-4 bottom-4 w-80 bg-white rounded-xl border border-black/10 shadow-2xl flex flex-col z-25">
          <ProductChatPanel
            product={productChatTarget}
            onClose={() => setProductChatTarget(null)}
            sessionId={sessionId ?? undefined}
          />
        </div>
      )}

      {/* Conversation History Sidebar */}
      <ConversationSidebar
        open={showHistory}
        sessions={savedSessions}
        folders={savedFolders}
        onLoad={handleLoadSession}
        onClear={handleClearHistory}
        onClose={() => setShowHistory(false)}
        onNewChat={handleNewSearch}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        onMoveToFolder={handleMoveToFolder}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}
