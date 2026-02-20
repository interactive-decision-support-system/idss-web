import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '@/components/AuthModal';

const mockSignInWithOAuth = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockResetPasswordForEmail = jest.fn();

const mockSupabase = {
  auth: {
    signInWithOAuth: mockSignInWithOAuth,
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('AuthModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('renders nothing when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders sign-in form when open', () => {
    render(<AuthModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/log in or sign up/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in with email/i })).toBeInTheDocument();
  });

  it('calls signInWithOAuth with google when Continue with Google is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ redirectTo: expect.stringContaining('/auth/callback') }),
      })
    );
  });

  it('shows validation error when signing in with empty email', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/email address/i), '   ');
    await user.click(screen.getByRole('button', { name: /log in with email/i }));
    expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('shows validation error when signing in with empty password', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /log in with email/i }));
    expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('calls signInWithPassword and onClose on successful email sign-in', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in with email/i }));
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error on invalid login credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    });
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /log in with email/i }));
    await screen.findByText(/invalid email or password/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('switches to sign up and validates password length and confirm', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), '12345');
    await user.type(screen.getByLabelText(/confirm password/i), '12345');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match on sign up', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp on successful sign up and shows success message', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    });
    await screen.findByText(/account created! you can sign in now/i);
  });

  it('switches to forgot password and shows reset form', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it('validates email on forgot password', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('calls resetPasswordForEmail and shows success on forgot password', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    await user.type(screen.getByLabelText(/email address/i), 'reset@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'reset@example.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/reset-password'),
      })
    );
    await screen.findByText(/check your email for a link to reset your password/i);
  });

  it('shows error when resetPasswordForEmail fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: 'Rate limit exceeded' },
    });
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    await user.type(screen.getByLabelText(/email address/i), 'reset@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await screen.findByText(/rate limit exceeded/i);
  });

  it('back to sign in from forgot password returns to sign-in form', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    await user.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(screen.getByRole('button', { name: /log in with email/i })).toBeInTheDocument();
  });
});
