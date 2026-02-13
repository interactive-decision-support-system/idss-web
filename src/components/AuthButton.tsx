'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

function getInitials(user: User): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name && typeof name === 'string') {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = user.email ?? '';
  const local = email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase() || '?';
}

function AuthButtonInner() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    if (popupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popupOpen]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setPopupOpen(false);
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-lg bg-black/5 animate-pulse" />
    );
  }

  if (user) {
    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'User';
    const handle = user.email ? `@${user.email.split('@')[0]}` : '';

    return (
      <div className="relative" ref={popupRef}>
        <button
          onClick={() => setPopupOpen(!popupOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#8C1515] text-white font-medium text-xs hover:bg-[#750013] transition-colors"
          title="Account"
          aria-label="Account menu"
        >
          {getInitials(user)}
        </button>

        {popupOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-black/10 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8C1515] flex items-center justify-center text-white font-medium text-xs shrink-0">
                  {getInitials(user)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-black truncate">{displayName}</p>
                  {handle && (
                    <p className="text-sm text-black/60 truncate">{handle}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-black/5 transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="px-4 py-2 text-sm font-medium text-black/90 bg-white border border-black/20 hover:border-black/40 rounded-lg transition-all"
        title="Log in or sign up"
        aria-label="Log in or sign up"
      >
        Sign in
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
