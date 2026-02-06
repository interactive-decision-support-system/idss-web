'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const [errorCode, setErrorCode] = useState<string | null>(
    searchParams.get('error_code')
  );
  const [errorDesc, setErrorDesc] = useState<string | null>(
    searchParams.get('error_description')
  );

  // Supabase may put error params in the hash instead of query
  useEffect(() => {
    if (errorCode) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    setErrorCode(params.get('error_code'));
    setErrorDesc(params.get('error_description'));
  }, [errorCode]);

  const isExpired = errorCode === 'otp_expired';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md mx-auto px-6 text-center space-y-6">
        <h1 className="text-2xl font-semibold text-black">
          Authentication error
        </h1>
        <p className="text-black/70">
          {isExpired ? (
            <>
              Your sign-in link has expired. Magic links are valid for about an
              hour. Please try again and use the new link we send to your email.
            </>
          ) : errorDesc ? (
            decodeURIComponent(errorDesc.replace(/\+/g, ' '))
          ) : (
            'Something went wrong during sign in. Please try again.'
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 font-medium text-white bg-[#8C1515] hover:bg-[#750013] rounded-lg transition-colors"
          >
            Return home
          </Link>
          {isExpired && (
            <Link
              href="/"
              className="inline-block px-6 py-3 font-medium text-black/80 border border-black/20 hover:border-black/40 rounded-lg transition-colors"
            >
              Request new link
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-black/70">Loading...</p>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
