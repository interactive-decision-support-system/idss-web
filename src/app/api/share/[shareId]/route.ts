import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  if (!API_BASE_URL) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 });
  }
  try {
    const response = await fetch(`${API_BASE_URL}/share/${shareId}`);
    if (response.status === 404) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load share', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
