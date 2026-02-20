/**
 * Cart service: for logged-in users, all reads/writes go through the MCP (UCP).
 * For guests, cart is stored in localStorage.
 * On login, localStorage cart is migrated by calling UCP add_to_cart for each item.
 * See FRONTEND_CART_CHECKOUT_API.md for the API contract.
 */

import type { Product } from '@/types/chat';
import {
  getCart,
  addToCart as ucpAddToCart,
  checkout as ucpCheckout,
  removeFromCart as ucpRemoveFromCart,
  updateCartItem as ucpUpdateCartItem,
  productToUCPSnapshot,
  isUcpAvailable,
  type CheckoutResponse,
} from '@/services/ucp';

const STORAGE_KEY = 'cart';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
  soldOutIds?: string[];
}

export interface CartService {
  load: (userId: string | null) => Promise<CartItem[]>;
  add: (userId: string | null, product: Product, quantity?: number) => Promise<void>;
  remove: (userId: string | null, productId: string) => Promise<void>;
  setQuantity: (userId: string | null, productId: string, quantity: number) => Promise<void>;
  migrateLocalToSupabase: (userId: string) => Promise<CartItem[]>;
  checkout: (userId: string | null, items: CartItem[], productType?: 'books') => Promise<CheckoutResult>;
}

function snapshotToProduct(snapshot: Record<string, unknown>): Product {
  const s = snapshot as Record<string, unknown>;
  // UCP uses imageurl; normalize to image_url / image.primary for UI
  const imageurl = s.imageurl as string | undefined;
  return {
    ...s,
    id: (s.id as string) ?? '',
    title: (s.title ?? s.name ?? 'Product') as string,
    name: (s.name ?? s.title ?? 'Product') as string,
    price: Number(s.price ?? 0),
    image_url: imageurl,
    image: imageurl ? { primary: imageurl, count: 1, gallery: [] } : undefined,
  } as Product;
}

async function loadFromUcp(userId: string): Promise<CartItem[]> {
  if (!isUcpAvailable()) return [];
  const response = await getCart(userId);
  if (response.status !== 'success' || !response.items) return [];
  return response.items.map((item) => ({
    product: snapshotToProduct(item.product_snapshot as Record<string, unknown>),
    quantity: item.quantity ?? 1,
  }));
}

function loadFromLocalStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: { product?: unknown; quantity?: number }) => ({
      product: item.product as Product,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    }));
  } catch {
    return [];
  }
}

function saveToLocalStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.map(({ product, quantity }) => ({ product, quantity })))
  );
}

async function addToUcp(userId: string, product: Product, quantity = 1): Promise<void> {
  const snapshot = productToUCPSnapshot(product);
  const result = await ucpAddToCart(userId, product.id, snapshot, quantity);
  if (result.status === 'error') {
    throw new Error(result.error ?? 'Add to cart failed');
  }
}

async function removeViaUcp(userId: string, productId: string): Promise<void> {
  const result = await ucpRemoveFromCart(userId, productId);
  if (result.status === 'error') {
    throw new Error(result.error ?? 'Remove from cart failed');
  }
}

async function setQuantityViaUcp(userId: string, productId: string, quantity: number): Promise<void> {
  const result = await ucpUpdateCartItem(userId, productId, quantity);
  if (result.status === 'error') {
    throw new Error(result.error ?? 'Update cart failed');
  }
}

export const cartService: CartService = {
  async load(userId: string | null): Promise<CartItem[]> {
    if (userId && isUcpAvailable()) return loadFromUcp(userId);
    return loadFromLocalStorage();
  },

  async add(userId: string | null, product: Product, quantity = 1): Promise<void> {
    if (userId && isUcpAvailable()) {
      await addToUcp(userId, product, quantity);
      return;
    }
    const current = loadFromLocalStorage();
    const idx = current.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) {
      current[idx].quantity += quantity;
    } else {
      current.push({ product, quantity });
    }
    saveToLocalStorage(current);
  },

  async remove(userId: string | null, productId: string): Promise<void> {
    if (userId && isUcpAvailable()) {
      try {
        await removeViaUcp(userId, productId);
      } catch (e) {
        console.warn('UCP remove_from_cart failed (backend may not support it):', e);
        throw e;
      }
      return;
    }
    saveToLocalStorage(loadFromLocalStorage().filter((i) => i.product.id !== productId));
  },

  async setQuantity(userId: string | null, productId: string, quantity: number): Promise<void> {
    if (userId && isUcpAvailable()) {
      try {
        await setQuantityViaUcp(userId, productId, quantity);
      } catch (e) {
        console.warn('UCP update_cart failed (backend may not support it):', e);
        throw e;
      }
      return;
    }
    const current = loadFromLocalStorage();
    const idx = current.findIndex((i) => i.product.id === productId);
    if (idx >= 0) {
      if (quantity <= 0) {
        current.splice(idx, 1);
      } else {
        current[idx].quantity = quantity;
      }
      saveToLocalStorage(current);
    }
  },

  async migrateLocalToSupabase(userId: string): Promise<CartItem[]> {
    const local = loadFromLocalStorage();
    if (local.length === 0) return loadFromUcp(userId);
    if (!isUcpAvailable()) return loadFromLocalStorage();

    try {
      for (const { product, quantity } of local) {
        await addToUcp(userId, product, quantity);
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error migrating cart to MCP:', e);
    }
    return loadFromUcp(userId);
  },

  async checkout(
    userId: string | null,
    _items: CartItem[],
    productType?: 'books'
  ): Promise<CheckoutResult> {
    if (!userId) {
      return { success: false, error: 'Sign in to checkout' };
    }
    if (!isUcpAvailable()) {
      return { success: false, error: 'Checkout is not configured (MCP base URL missing)' };
    }

    // Option A: omit items so MCP loads cart from Supabase for this user_id
    const response: CheckoutResponse = await ucpCheckout(userId, {
      ...(productType && { product_type: productType }),
    });

    if (response.status === 'success') {
      return { success: true, orderId: response.order_id };
    }
    return {
      success: false,
      error: response.error,
      soldOutIds: response.details?.sold_out_ids,
    };
  },
};
