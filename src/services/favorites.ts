/**
 * Favorites service: syncs favorites between Supabase (logged-in) and localStorage (guest).
 * On login, merges localStorage favorites into Supabase.
 */

import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/types/chat';

const STORAGE_KEY = 'favorites';

export interface FavoritesService {
  load: (userId: string | null) => Promise<Product[]>;
  add: (userId: string | null, product: Product) => Promise<void>;
  remove: (userId: string | null, productId: string) => Promise<void>;
  has: (userId: string | null, productId: string) => Promise<boolean>;
  migrateLocalToSupabase: (userId: string) => Promise<Product[]>;
}

function productToSnapshot(product: Product): Record<string, unknown> {
  const p = product as Record<string, unknown>;
  return {
    id: p.id,
    title: p.title ?? p.name,
    name: p.name,
    price: p.price,
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

async function loadFromSupabase(userId: string): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
    .from('favorites')
    .select('product_snapshot')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading favorites from Supabase:', error);
    return [];
  }

  return (data ?? []).map((row) => snapshotToProduct(row.product_snapshot as Record<string, unknown>));
  } catch {
    return [];
  }
}

function loadFromLocalStorage(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function addToSupabase(userId: string, product: Product): Promise<void> {
  try {
    const supabase = createClient();
    const domain = (product as { productType?: string }).productType ?? 'vehicle';
    await supabase.from('favorites').upsert(
    {
      user_id: userId,
      product_id: product.id,
      product_snapshot: productToSnapshot(product),
      domain,
    },
    { onConflict: 'user_id,product_id' }
  );
  } catch (e) {
    console.error('Error adding favorite to Supabase:', e);
  }
}

async function removeFromSupabase(userId: string, productId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase
        .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
  } catch (e) {
    console.error('Error removing favorite from Supabase:', e);
  }
}

export const favoritesService: FavoritesService = {
  async load(userId: string | null): Promise<Product[]> {
    if (userId) {
      return loadFromSupabase(userId);
    }
    return loadFromLocalStorage();
  },

  async add(userId: string | null, product: Product): Promise<void> {
    if (userId) {
      await addToSupabase(userId, product);
    } else {
      const current = loadFromLocalStorage();
      if (current.some((p) => p.id === product.id)) return;
      saveToLocalStorage([...current, product]);
    }
  },

  async remove(userId: string | null, productId: string): Promise<void> {
    if (userId) {
      await removeFromSupabase(userId, productId);
    } else {
      const current = loadFromLocalStorage();
      saveToLocalStorage(current.filter((p) => p.id !== productId));
    }
  },

  async has(userId: string | null, productId: string): Promise<boolean> {
    if (userId) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();
      return !!data;
      } catch {
        return false;
      }
    }
    return loadFromLocalStorage().some((p) => p.id === productId);
  },

  async migrateLocalToSupabase(userId: string): Promise<Product[]> {
    const local = loadFromLocalStorage();
    if (local.length === 0) return loadFromSupabase(userId);

    try {
      const supabase = createClient();
      for (const product of local) {
        await supabase.from('favorites').upsert(
          {
            user_id: userId,
            product_id: product.id,
            product_snapshot: productToSnapshot(product),
            domain: (product as { productType?: string }).productType ?? 'vehicle',
          },
          { onConflict: 'user_id,product_id' }
        );
      }

      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error migrating favorites to Supabase:', e);
    }
    return loadFromSupabase(userId);
  },
};
