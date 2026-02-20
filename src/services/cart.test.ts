import { cartService } from '@/services/cart';
import type { Product } from '@/types/chat';

const mockGetCart = jest.fn();
const mockAddToCart = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockUpdateCartItem = jest.fn();
const mockCheckout = jest.fn();

jest.mock('@/services/ucp', () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
  addToCart: (...args: unknown[]) => mockAddToCart(...args),
  removeFromCart: (...args: unknown[]) => mockRemoveFromCart(...args),
  updateCartItem: (...args: unknown[]) => mockUpdateCartItem(...args),
  checkout: (...args: unknown[]) => mockCheckout(...args),
  productToUCPSnapshot: (p: Product) => ({ id: p.id, title: (p as { title?: string }).title ?? (p as { name?: string }).name, price: (p as { price?: number }).price, imageurl: (p as { image_url?: string }).image_url }),
  isUcpAvailable: jest.fn(() => true),
}));

const STORAGE_KEY = 'cart';

describe('cartService', () => {
  const product: Product = {
    id: 'p1',
    title: 'Test Product',
    price: 24999,
    image_url: 'https://example.com/img.jpg',
    source: 'Test Dealer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    const { isUcpAvailable } = require('@/services/ucp');
    isUcpAvailable.mockReturnValue(true);
  });

  describe('load', () => {
    it('loads from localStorage when userId is null', async () => {
      const items = [{ product, quantity: 2 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      const { isUcpAvailable } = require('@/services/ucp');
      isUcpAvailable.mockReturnValue(false);

      const result = await cartService.load(null);

      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('p1');
      expect(result[0].quantity).toBe(2);
      expect(mockGetCart).not.toHaveBeenCalled();
    });

    it('returns empty array when userId is null and localStorage is empty', async () => {
      const { isUcpAvailable } = require('@/services/ucp');
      isUcpAvailable.mockReturnValue(false);

      const result = await cartService.load(null);
      expect(result).toEqual([]);
    });

    it('loads from UCP when userId is set and UCP is available', async () => {
      mockGetCart.mockResolvedValue({
        status: 'success',
        items: [{ product_snapshot: { id: 'p1', title: 'Test', price: 24999, imageurl: 'https://example.com/img.jpg' }, quantity: 1 }],
      });

      const result = await cartService.load('user-123');

      expect(mockGetCart).toHaveBeenCalledWith('user-123');
      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('p1');
      expect(result[0].quantity).toBe(1);
    });

    it('returns empty array when UCP get_cart errors', async () => {
      mockGetCart.mockResolvedValue({ status: 'error', error: 'Failed' });

      const result = await cartService.load('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('saves to localStorage when userId is null', async () => {
      const { isUcpAvailable } = require('@/services/ucp');
      isUcpAvailable.mockReturnValue(false);

      await cartService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].product.id).toBe('p1');
      expect(stored[0].quantity).toBe(1);
      expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('increments quantity in localStorage when product already in cart', async () => {
      const { isUcpAvailable } = require('@/services/ucp');
      isUcpAvailable.mockReturnValue(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 1 }]));
      await cartService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });

    it('calls UCP add_to_cart when userId is set', async () => {
      mockAddToCart.mockResolvedValue({ status: 'success' });

      await cartService.add('user-123', product);

      expect(mockAddToCart).toHaveBeenCalledWith('user-123', 'p1', expect.objectContaining({ id: 'p1', title: 'Test Product', price: 24999 }), 1);
    });
  });

  describe('remove', () => {
    it('removes from localStorage when userId is null', async () => {
      const { isUcpAvailable } = require('@/services/ucp');
      isUcpAvailable.mockReturnValue(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 1 }]));
      await cartService.remove(null, 'p1');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(0);
    });

    it('calls UCP remove_from_cart when userId is set', async () => {
      mockRemoveFromCart.mockResolvedValue({ status: 'success' });

      await cartService.remove('user-123', 'p1');

      expect(mockRemoveFromCart).toHaveBeenCalledWith('user-123', 'p1');
    });
  });

  describe('checkout', () => {
    it('returns error when userId is null', async () => {
      const result = await cartService.checkout(null, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sign in');
      expect(mockCheckout).not.toHaveBeenCalled();
    });

    it('calls UCP checkout and returns orderId on success', async () => {
      mockCheckout.mockResolvedValue({ status: 'success', order_id: 'order-abc' });

      const result = await cartService.checkout('user-123', [{ product, quantity: 1 }]);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-abc');
      expect(mockCheckout).toHaveBeenCalledWith('user-123', expect.any(Object));
    });

    it('returns error and soldOutIds on checkout error', async () => {
      mockCheckout.mockResolvedValue({ status: 'error', error: 'Some items are sold out', details: { sold_out_ids: ['p1'] } });

      const result = await cartService.checkout('user-123', [{ product, quantity: 1 }]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some items are sold out');
      expect(result.soldOutIds).toEqual(['p1']);
    });
  });

  describe('migrateLocalToSupabase', () => {
    it('returns UCP cart when localStorage is empty', async () => {
      mockGetCart.mockResolvedValue({
        status: 'success',
        items: [{ product_snapshot: { id: 'p1' }, quantity: 1 }],
      });

      const result = await cartService.migrateLocalToSupabase('user-123');

      expect(result).toHaveLength(1);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('migrates localStorage to UCP and clears localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 2 }]));
      mockAddToCart.mockResolvedValue({ status: 'success' });
      mockGetCart.mockResolvedValue({
        status: 'success',
        items: [{ product_snapshot: { ...product, imageurl: product.image_url }, quantity: 2 }],
      });

      const result = await cartService.migrateLocalToSupabase('user-123');

      expect(mockAddToCart).toHaveBeenCalledWith('user-123', 'p1', expect.any(Object), 2);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result).toHaveLength(1);
    });
  });
});
