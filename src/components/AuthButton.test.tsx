import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthButton from '@/components/AuthButton';

const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
const mockGetUser = jest.fn();
const mockSignOut = jest.fn();

const mockSupabase = {
  auth: {
    onAuthStateChange: mockOnAuthStateChange,
    getUser: mockGetUser,
    signOut: mockSignOut,
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('AuthButton', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders null when Supabase env vars are missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    const { container } = render(<AuthButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Sign in button when user is null', async () => {
    render(<AuthButton />);
    const signInButton = await screen.findByRole('button', { name: /log in or sign up/i });
    expect(signInButton).toHaveTextContent('Sign in');
  });

  it('opens AuthModal when Sign in is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthButton />);
    const signInButton = await screen.findByRole('button', { name: /log in or sign up/i });
    await user.click(signInButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/log in or sign up/i)).toBeInTheDocument();
  });

  it('shows avatar and display name when user is logged in', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'jane@example.com',
      user_metadata: { full_name: 'Jane Doe' },
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    render(<AuthButton />);
    await screen.findByRole('button', { name: /account menu/i });
    expect(screen.getByTitle(/account/i)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('calls signOut when Log out is clicked', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'jane@example.com',
      user_metadata: { full_name: 'Jane Doe' },
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const user = userEvent.setup();
    render(<AuthButton />);
    await screen.findByRole('button', { name: /account menu/i });
    await user.click(screen.getByRole('button', { name: /account menu/i }));
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
