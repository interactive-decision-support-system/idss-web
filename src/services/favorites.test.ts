import { favoritesService } from '@/services/favorites';
import type { Product } from '@/types/chat';

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const STORAGE_KEY = 'favorites';

describe('favoritesService', () => {
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
      const items = [product];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      const result = await favoritesService.load(null);

      expect(result).toEqual(items);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('returns empty array when userId is null and localStorage is empty', async () => {
      const result = await favoritesService.load(null);
      expect(result).toEqual([]);
    });

    it('loads from Supabase when userId is set', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: { id: 'p1', title: 'Test', price: 24999 } }],
        error: null,
      });

      const result = await favoritesService.load('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('favorites');
      expect(mockSupabase.select).toHaveBeenCalledWith('product_snapshot');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('returns empty array when Supabase errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await favoritesService.load('user-123');

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('add', () => {
    it('saves to localStorage when userId is null', async () => {
      await favoritesService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('p1');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('does not duplicate in localStorage when already present', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([product]));
      await favoritesService.add(null, product);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
    });

    it('upserts to Supabase when userId is set', async () => {
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null });

      await favoritesService.add('user-123', product);

      expect(mockSupabase.from).toHaveBeenCalledWith('favorites');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          product_id: 'p1',
          product_snapshot: expect.objectContaining({ id: 'p1', title: 'Test Product' }),
        }),
        { onConflict: 'user_id,product_id' }
      );
    });
  });

  describe('remove', () => {
    it('removes from localStorage when userId is null', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([product]));
      await favoritesService.remove(null, 'p1');

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

      await favoritesService.remove('user-123', 'p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('favorites');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(deleteChain.eq).toHaveBeenCalledWith('product_id', 'p1');
    });
  });

  describe('has', () => {
    it('checks localStorage when userId is null', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([product]));
      expect(await favoritesService.has(null, 'p1')).toBe(true);
      expect(await favoritesService.has(null, 'p2')).toBe(false);
    });

    it('checks Supabase when userId is set', async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: 'x' }, error: null });
      expect(await favoritesService.has('user-123', 'p1')).toBe(true);

      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      expect(await favoritesService.has('user-123', 'p2')).toBe(false);
    });
  });

  describe('migrateLocalToSupabase', () => {
    it('returns Supabase data when localStorage is empty', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: { id: 'p1' } }],
        error: null,
      });

      const result = await favoritesService.migrateLocalToSupabase('user-123');

      expect(result).toHaveLength(1);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('migrates localStorage to Supabase and clears localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([product]));
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null });
      mockSupabase.order.mockResolvedValue({
        data: [{ product_snapshot: product }],
        error: null,
      });

      const result = await favoritesService.migrateLocalToSupabase('user-123');

      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result).toHaveLength(1);
    });
  });
});
