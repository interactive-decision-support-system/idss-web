'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please try again.'
            : signInError.message
        );
        return;
      }
      onClose();
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'An account with this email already exists. Try signing in instead.'
            : signUpError.message
        );
        return;
      }
      setSuccessMessage(
        'Account created! Check your email to confirm your account, or sign in if confirmation is not required.'
      );
      setPassword('');
      setConfirmPassword('');
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 id="auth-modal-title" className="text-xl font-semibold text-black">
              Log in or sign up
            </h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 rounded-lg hover:bg-black/5 text-black/60 hover:text-black transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-6 space-y-5">
            <p className="text-sm text-black/70 -mt-2">
              You can save your favorites across devices.
            </p>

            <div className="space-y-3">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-black/90 bg-white border border-black/20 hover:border-black/40 hover:bg-black/[0.02] rounded-lg transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={signInWithFacebook}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/15" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-black/50 uppercase tracking-wide">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-black/80 mb-1">
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1515]/30 focus:border-[#8C1515]"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-black/80 mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  className="w-full px-4 py-3 text-sm border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1515]/30 focus:border-[#8C1515]"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-black/80 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 text-sm border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1515]/30 focus:border-[#8C1515]"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {successMessage && (
                <p className="text-sm text-[#8C1515] font-medium">{successMessage}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-[#8C1515] hover:bg-[#750013] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in with email'
                    : 'Create account'}
              </button>

              <p className="text-sm text-black/60 text-center">
                {mode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-medium text-[#8C1515] hover:text-[#750013]"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-medium text-[#8C1515] hover:text-[#750013]"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
