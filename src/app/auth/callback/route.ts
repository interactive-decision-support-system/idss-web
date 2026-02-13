import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error('Auth callback error:', err);
    }
  }

  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDesc = searchParams.get('error_description');
  const params = new URLSearchParams();
  if (error) params.set('error', error);
  if (errorCode) params.set('error_code', errorCode);
  if (errorDesc) params.set('error_description', errorDesc);
  const query = params.toString();
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error${query ? `?${query}` : ''}`
  );
}
