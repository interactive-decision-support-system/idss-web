import { NextRequest, NextResponse } from 'next/server';
import { dummyChatHandler } from '@/data/dummy-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, session_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // For now, use dummy handler until backend is ready
    const response = await dummyChatHandler(message, session_id);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
