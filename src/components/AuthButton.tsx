'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

function AuthButtonInner() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setModalOpen(false);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-lg bg-black/5 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-black/70 truncate max-w-[120px]">
          {user.email ?? user.user_metadata?.full_name ?? 'Signed in'}
        </span>
        <button
          onClick={signOut}
          className="px-3 py-1.5 text-sm font-medium text-black/80 hover:text-black border border-black/20 hover:border-black/40 rounded-lg transition-all"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-lg transition-all"
        title="Log in or sign up"
        aria-label="Log in or sign up"
      >
        <svg
          className="w-5 h-5 text-black/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export default function AuthButton() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return <AuthButtonInner />;
}
