import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * POST /api/chat-text
 *
 * Proxy for the backend /chat-text endpoint used by the OpenClaw skill and
 * other messaging-app adapters.  Returns a pre-formatted plain-text string
 * instead of the full JSON product graph.
 *
 * This Vercel proxy is the recommended endpoint for the OpenClaw skill:
 *   - Routes through Vercel (single public entry point)
 *   - Handles CORS for cross-origin skill requests
 *   - Falls back gracefully if the Railway backend is unreachable
 *
 * Request:  { message: string, session_id?: string }
 * Response: { text: string, session_id: string, response_type: string }
 */
export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'API not configured. Set NEXT_PUBLIC_API_BASE_URL.' },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, session_id } = body;
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const requestBody: Record<string, unknown> = { message };
  if (session_id) requestBody.session_id = session_id;

  try {
    const response = await fetch(`${API_BASE_URL}/chat-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, detail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend unavailable', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 }
    );
  }
}
