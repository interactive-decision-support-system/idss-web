/**
 * UCP (Universal Commerce Protocol) client for cart and checkout.
 * All cart/checkout writes for logged-in users go through the MCP server.
 * See FRONTEND_CART_CHECKOUT_API.md for the full API contract.
 */

import type { Product } from '@/types/chat';

const MCP_BASE_URL =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_MCP_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    : '';

/** Product snapshot sent to UCP (backend uses "imageurl") */
export interface UCPProductSnapshot {
  id: string;
  title: string;
  price: number;
  imageurl?: string;
  category?: string;
  [key: string]: unknown;
}

/** Map frontend Product to UCP product_snapshot */
export function productToUCPSnapshot(product: Product): UCPProductSnapshot {
  const p = product as Record<string, unknown>;
  const title = (p.title ?? p.name ?? 'Product') as string;
  const imageUrl =
    (p.image as { primary?: string } | undefined)?.primary ??
    (p.image_url as string | undefined) ??
    '';
  return {
    id: (p.id as string) ?? '',
    title,
    price: Number(p.price ?? 0),
    imageurl: imageUrl,
    category: (p.category ?? p.part_type ?? '') as string,
  };
}

export interface GetCartItem {
  id: string;
  product_id: string;
  product_snapshot: Record<string, unknown>;
  quantity: number;
  created_at?: string;
}

export interface GetCartResponse {
  status: 'success' | 'error';
  cart_id?: string;
  items?: GetCartItem[];
  item_count?: number;
  error?: string;
}

export interface CheckoutSuccessResponse {
  status: 'success';
  order_id: string;
}

export interface CheckoutErrorResponse {
  status: 'error';
  error: string;
  details?: { sold_out_ids?: string[] };
}

export type CheckoutResponse = CheckoutSuccessResponse | CheckoutErrorResponse;

function getBaseUrl(): string {
  return MCP_BASE_URL;
}

function isUcpAvailable(): boolean {
  return Boolean(getBaseUrl());
}

/**
 * GET /products?ids=id1,id2&product_type=books
 * Returns fresh product data including inventory for cart display/validation.
 */
export async function getProducts(
  ids: string[],
  productType?: 'books'
): Promise<{ products: Array<{ id: string; title: string; price: number; inventory?: number; imageurl?: string; category?: string }>; total_count: number }> {
  const base = getBaseUrl();
  if (!base) {
    return { products: [], total_count: 0 };
  }
  const params = new URLSearchParams({ ids: ids.join(',') });
  if (productType) params.set('product_type', productType);
  const res = await fetch(`${base}/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Products fetch failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    products: data.products ?? [],
    total_count: data.total_count ?? 0,
  };
}

/**
 * POST /ucp/get_cart – get user's cart from MCP (Supabase).
 */
export async function getCart(userId: string): Promise<GetCartResponse> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'MCP base URL not configured' };
  }
  const res = await fetch(`${base}/ucp/get_cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_cart',
      parameters: { user_id: userId },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  }
  return data as GetCartResponse;
}

/**
 * POST /ucp/add_to_cart – add item to cart via MCP.
 */
export async function addToCart(
  userId: string,
  productId: string,
  productSnapshot: UCPProductSnapshot,
  quantity = 1
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'MCP base URL not configured' };
  }
  const res = await fetch(`${base}/ucp/add_to_cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_to_cart',
      parameters: {
        user_id: userId,
        product_id: productId,
        quantity,
        product_snapshot: productSnapshot,
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  }
  if (data.status === 'error') {
    return { status: 'error', error: data.error ?? 'Add to cart failed' };
  }
  return { status: 'success' };
}

/**
 * POST /ucp/checkout – checkout current cart or explicit items.
 * Option A: omit items → MCP uses Supabase cart for user_id.
 * Option B: pass items → checkout those items (and optionally product_type for books).
 */
export async function checkout(
  userId: string,
  options?: {
    items?: Array<{ product_id: string; quantity: number }>;
    product_type?: 'books';
  }
): Promise<CheckoutResponse> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'MCP base URL not configured' };
  }
  const parameters: Record<string, unknown> = { user_id: userId };
  if (options?.items?.length) parameters.items = options.items;
  if (options?.product_type) parameters.product_type = options.product_type;

  const res = await fetch(`${base}/ucp/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'checkout',
      parameters,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  }
  return data as CheckoutResponse;
}

/**
 * Optional: remove item from cart via MCP.
 * Not in FRONTEND_CART_CHECKOUT_API.md; backend may need to implement this UCP action.
 */
export async function removeFromCart(
  userId: string,
  productId: string
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) return { status: 'error', error: 'MCP base URL not configured' };
  const res = await fetch(`${base}/ucp/remove_from_cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'remove_from_cart',
      parameters: { user_id: userId, product_id: productId },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  if (data.status === 'error') return { status: 'error', error: data.error ?? 'Remove failed' };
  return { status: 'success' };
}

/**
 * Optional: update cart item quantity via MCP.
 * Not in FRONTEND_CART_CHECKOUT_API.md; backend may need to implement this UCP action.
 */
export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) return { status: 'error', error: 'MCP base URL not configured' };
  const res = await fetch(`${base}/ucp/update_cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_cart',
      parameters: { user_id: userId, product_id: productId, quantity },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  if (data.status === 'error') return { status: 'error', error: data.error ?? 'Update failed' };
  return { status: 'success' };
}

export { isUcpAvailable };
