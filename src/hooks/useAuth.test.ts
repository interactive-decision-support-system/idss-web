import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
const mockGetUser = jest.fn();

const mockSupabase = {
  auth: {
    onAuthStateChange: mockOnAuthStateChange,
    getUser: mockGetUser,
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('starts with loading true then sets user and loading false after getUser', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('returns user when getUser resolves with a user', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('subscribes to onAuthStateChange and unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
