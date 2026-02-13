import { cartService } from '@/services/cart';
import type { Product } from '@/types/chat';

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
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
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('load', () => {
    it('loads from localStorage when userId is null', async () => {
      const items = [{ product, quantity: 2 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      const result = await cartService.load(null);

      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('p1');
      expect(result[0].quantity).toBe(2);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('returns empty array when userId is null and localStorage is empty', async () => {
      const result = await cartService.load(null);
      expect(result).toEqual([]);
    });

    it('loads from Supabase when userId is set', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: { id: 'p1', title: 'Test', price: 24999 }, quantity: 1 }],
        error: null,
      });

      const result = await cartService.load('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('cart');
      expect(mockSupabase.select).toHaveBeenCalledWith('product_snapshot, quantity');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('p1');
      expect(result[0].quantity).toBe(1);
    });

    it('returns empty array when Supabase errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await cartService.load('user-123');

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('add', () => {
    it('saves to localStorage when userId is null', async () => {
      await cartService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].product.id).toBe('p1');
      expect(stored[0].quantity).toBe(1);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('increments quantity in localStorage when product already in cart', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 1 }]));
      await cartService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });

    it('upserts to Supabase when userId is set', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null });

      await cartService.add('user-123', product);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          product_id: 'p1',
          product_snapshot: expect.objectContaining({ id: 'p1', title: 'Test Product' }),
          quantity: 1,
        }),
        { onConflict: 'user_id,product_id' }
      );
    });
  });

  describe('remove', () => {
    it('removes from localStorage when userId is null', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 1 }]));
      await cartService.remove(null, 'p1');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(0);
    });

    it('deletes from Supabase when userId is set', async () => {
      const deleteChain = {
        eq: jest.fn().mockImplementation((key: string) => {
          if (key === 'product_id') return Promise.resolve({ error: null });
          return deleteChain;
        }),
      };
      mockSupabase.delete.mockReturnValue(deleteChain);

      await cartService.remove('user-123', 'p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('cart');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(deleteChain.eq).toHaveBeenCalledWith('product_id', 'p1');
    });
  });

  describe('migrateLocalToSupabase', () => {
    it('returns Supabase data when localStorage is empty', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: { id: 'p1' }, quantity: 1 }],
        error: null,
      });

      const result = await cartService.migrateLocalToSupabase('user-123');

      expect(result).toHaveLength(1);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('migrates localStorage to Supabase and clears localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 2 }]));
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null });
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: product, quantity: 2 }],
        error: null,
      });

      const result = await cartService.migrateLocalToSupabase('user-123');

      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result).toHaveLength(1);
    });
  });
});
