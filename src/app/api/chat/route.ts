import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json(
        { error: 'API not configured. Set NEXT_PUBLIC_API_BASE_URL in .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, session_id, user_location, k, method, n_rows, n_per_row } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const requestBody: Record<string, unknown> = { message };
    if (session_id) requestBody.session_id = session_id;
    if (user_location) requestBody.user_location = user_location;
    if (k !== undefined) requestBody.k = k;
    if (method) requestBody.method = method;
    if (n_rows !== undefined) requestBody.n_rows = n_rows;
    if (n_per_row !== undefined) requestBody.n_per_row = n_per_row;

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend API error: ${response.status}`, detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
