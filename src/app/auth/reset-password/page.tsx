'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const type = params.get('type');
      if (type === 'recovery') {
        setReady(true);
        return;
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('Invalid or expired reset link. Please request a new one.');
    });
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/'), 2000);
  };

  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-black/70">Loading...</p>
      </div>
    );
  }

  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <h1 className="text-2xl font-semibold text-black">Reset link invalid</h1>
          <p className="text-black/70">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 font-medium text-white bg-[#8C1515] hover:bg-[#750013] rounded-lg transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <h1 className="text-2xl font-semibold text-black">Password updated</h1>
          <p className="text-black/70">
            Your password has been reset. Redirecting you to the home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-6">
        <h1 className="text-2xl font-semibold text-black mb-2">Set new password</h1>
        <p className="text-sm text-black/70 mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-black/80 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 text-sm border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1515]/30 focus:border-[#8C1515]"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-black/80 mb-1">
              Confirm password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C1515]/30 focus:border-[#8C1515] ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-500'
                  : 'border-black/20'
              }`}
              autoComplete="new-password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={
              loading ||
              password !== confirmPassword ||
              !confirmPassword ||
              password.length < 6
            }
            className="w-full px-4 py-3 text-sm font-medium text-white bg-[#8C1515] hover:bg-[#750013] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60 text-center">
          <Link href="/" className="font-medium text-[#8C1515] hover:text-[#750013]">
            Return to home
          </Link>
        </p>
      </div>
    </div>
  );
}
