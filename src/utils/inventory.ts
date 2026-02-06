import type { Product } from '@/types/chat';

/** Returns true if product is sold out (inventory === 0). Undefined/null inventory = available. */
export function isSoldOut(product: Product): boolean {
  const inv = (product as { inventory?: number }).inventory;
  return inv !== undefined && inv !== null && inv <= 0;
}
