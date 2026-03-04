import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/product-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Product QA failed', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
