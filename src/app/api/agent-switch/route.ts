import { NextRequest, NextResponse } from 'next/server';

/**
 * Set the shopping-agent backend the chat proxy talks to.
 *
 *   GET /api/agent-switch?to=llm      → cookie set, 200
 *   GET /api/agent-switch?to=legacy   → cookie set, 200
 *   GET /api/agent-switch?to=clear    → cookie removed, 200
 *
 * Sibling of `/api/chat/route.ts`, which reads the `sa_agent_path` cookie on
 * every POST to decide whether to hit `/chat` (legacy) or `/chat/llm` (the
 * experimental LLM-first prototype on exp/llm-shopping-agent).
 */

const LEGACY_PATH = '/chat';
const LLM_PATH = '/chat/llm';
const AGENT_COOKIE = 'sa_agent_path';

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to');

  if (to === 'llm' || to === 'legacy') {
    const path = to === 'llm' ? LLM_PATH : LEGACY_PATH;
    const res = NextResponse.json({ agent: to, path });
    res.cookies.set(AGENT_COOKIE, path, {
      path: '/',
      sameSite: 'lax',
      // Session cookie — clears when the browser closes, keeping this firmly
      // a dev affordance rather than a durable preference.
      maxAge: undefined,
    });
    return res;
  }

  if (to === 'clear') {
    const res = NextResponse.json({ agent: 'cleared' });
    res.cookies.delete(AGENT_COOKIE);
    return res;
  }

  return NextResponse.json(
    { error: "pass ?to=llm | legacy | clear" },
    { status: 400 }
  );
}
