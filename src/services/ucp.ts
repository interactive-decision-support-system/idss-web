/**
 * Cart and checkout client: calls the backend agent action API.
 * The agent then calls UCP (e.g. Supabase cart) internally. Frontend → Agent → UCP.
 * Base URL: NEXT_PUBLIC_MCP_BASE_URL or NEXT_PUBLIC_API_BASE_URL.
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
 * POST /api/action/fetch-cart – get user's cart via agent (agent → UCP/Supabase).
 */
export async function getCart(userId: string): Promise<GetCartResponse> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'API base URL not configured' };
  }
  const res = await fetch(`${base}/api/action/fetch-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  }
  return data as GetCartResponse;
}

/**
 * POST /api/action/add-to-cart – add item to cart via agent (agent → UCP/Supabase).
 */
export async function addToCart(
  userId: string,
  productId: string,
  productSnapshot: UCPProductSnapshot,
  quantity = 1
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'API base URL not configured' };
  }
  const res = await fetch(`${base}/api/action/add-to-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      product_id: productId,
      quantity,
      product_snapshot: productSnapshot,
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
 * POST /api/action/checkout – checkout via agent (agent → UCP/Supabase).
 * Omit items to checkout current cart for user_id; optional items/product_type.
 */
export async function checkout(
  userId: string,
  options?: {
    items?: Array<{ product_id: string; quantity: number }>;
    product_type?: 'books';
    shipping_method?: string;
  }
): Promise<CheckoutResponse> {
  const base = getBaseUrl();
  if (!base) {
    return { status: 'error', error: 'API base URL not configured' };
  }
  const body: Record<string, unknown> = { user_id: userId };
  if (options?.items?.length) body.items = options.items;
  if (options?.product_type) body.product_type = options.product_type;
  if (options?.shipping_method) body.shipping_method = options.shipping_method;

  const res = await fetch(`${base}/api/action/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  }
  return data as CheckoutResponse;
}

/**
 * POST /api/action/remove-from-cart – remove item via agent (agent → UCP/Supabase).
 */
export async function removeFromCart(
  userId: string,
  productId: string
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) return { status: 'error', error: 'API base URL not configured' };
  const res = await fetch(`${base}/api/action/remove-from-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, product_id: productId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { status: 'error', error: data.error ?? `HTTP ${res.status}` };
  if (data.status === 'error') return { status: 'error', error: data.error ?? 'Remove failed' };
  return { status: 'success' };
}

/**
 * Update cart item quantity. Backend has no agent action for this yet, so we call UCP directly.
 * Agent path: add-to-cart / remove-from-cart only.
 */
export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number
): Promise<{ status: 'success' | 'error'; error?: string }> {
  const base = getBaseUrl();
  if (!base) return { status: 'error', error: 'API base URL not configured' };
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
