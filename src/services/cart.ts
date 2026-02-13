/**
 * Cart service: syncs cart between Supabase (logged-in) and localStorage (guest).
 * On login, merges localStorage cart into Supabase.
 */

import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/types/chat';

const STORAGE_KEY = 'cart';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartService {
  load: (userId: string | null) => Promise<CartItem[]>;
  add: (userId: string | null, product: Product, quantity?: number) => Promise<void>;
  remove: (userId: string | null, productId: string) => Promise<void>;
  setQuantity: (userId: string | null, productId: string, quantity: number) => Promise<void>;
  migrateLocalToSupabase: (userId: string) => Promise<CartItem[]>;
}

function productToSnapshot(product: Product): Record<string, unknown> {
  const p = product as Record<string, unknown>;
  return {
    id: p.id,
    title: p.title ?? p.name,
    name: p.name,
    price: p.price,
    inventory: p.inventory,
    image_url: p.image_url,
    image: p.image,
    brand: p.brand,
    source: p.source,
    ...p,
  };
}

function snapshotToProduct(snapshot: Record<string, unknown>): Product {
  return snapshot as Product;
}

async function loadFromSupabase(userId: string): Promise<CartItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cart')
      .select('product_snapshot, quantity')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading cart from Supabase:', error);
      return [];
    }

    return (data ?? []).map((row) => ({
      product: snapshotToProduct(row.product_snapshot as Record<string, unknown>),
      quantity: row.quantity ?? 1,
    }));
  } catch {
    return [];
  }
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

async function addToSupabase(userId: string, product: Product, quantity = 1): Promise<void> {
  try {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .maybeSingle();

    const newQty = (existing?.quantity ?? 0) + quantity;

    await supabase.from('cart').upsert(
      {
        user_id: userId,
        product_id: product.id,
        product_snapshot: productToSnapshot(product),
        quantity: newQty,
      },
      { onConflict: 'user_id,product_id' }
    );
  } catch (e) {
    console.error('Error adding to cart in Supabase:', e);
  }
}

async function removeFromSupabase(userId: string, productId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId);
  } catch (e) {
    console.error('Error removing from cart in Supabase:', e);
  }
}

async function setQuantityInSupabase(userId: string, productId: string, quantity: number): Promise<void> {
  try {
    const supabase = createClient();
    if (quantity <= 0) {
      await supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId);
      return;
    }
    await supabase.from('cart').update({ quantity }).eq('user_id', userId).eq('product_id', productId);
  } catch (e) {
    console.error('Error updating cart quantity in Supabase:', e);
  }
}

export const cartService: CartService = {
  async load(userId: string | null): Promise<CartItem[]> {
    if (userId) return loadFromSupabase(userId);
    return loadFromLocalStorage();
  },

  async add(userId: string | null, product: Product, quantity = 1): Promise<void> {
    if (userId) {
      await addToSupabase(userId, product, quantity);
    } else {
      const current = loadFromLocalStorage();
      const idx = current.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        current[idx].quantity += quantity;
      } else {
        current.push({ product, quantity });
      }
      saveToLocalStorage(current);
    }
  },

  async remove(userId: string | null, productId: string): Promise<void> {
    if (userId) {
      await removeFromSupabase(userId, productId);
    } else {
      saveToLocalStorage(loadFromLocalStorage().filter((i) => i.product.id !== productId));
    }
  },

  async setQuantity(userId: string | null, productId: string, quantity: number): Promise<void> {
    if (userId) {
      await setQuantityInSupabase(userId, productId, quantity);
    } else {
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
    }
  },

  async migrateLocalToSupabase(userId: string): Promise<CartItem[]> {
    const local = loadFromLocalStorage();
    if (local.length === 0) return loadFromSupabase(userId);

    try {
      for (const { product, quantity } of local) {
        await addToSupabase(userId, product, quantity);
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error migrating cart to Supabase:', e);
    }
    return loadFromSupabase(userId);
  },
};
