import { ChatRequest, ChatResponse, UserLocation } from '@/types/chat';

// Use Next.js API routes as proxy (they handle backend routing)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class IDSSApiService {
  async sendMessage(
    message: string,
    sessionId?: string,
    userLocation?: UserLocation,
    k?: number
  ): Promise<ChatResponse> {
    try {
      const url = API_BASE_URL ? `${API_BASE_URL}/chat` : '/api/chat';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          user_location: userLocation,
          ...(k !== undefined ? { k } : {}),
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message to IDSS agent:', error);
      throw error;
    }
  }

  async shareChat(
    messages: object[],
    title: string,
    sessionId: string
  ): Promise<string> {
    const url = API_BASE_URL ? `${API_BASE_URL}/share` : '/api/share';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, title, session_id: sessionId }),
    });
    if (!response.ok) throw new Error(`Share failed: ${response.status}`);
    const data = await response.json();
    return data.share_id as string;
  }

  async getSharedChat(shareId: string): Promise<{ title: string; messages: object[]; created_at: string }> {
    const url = API_BASE_URL ? `${API_BASE_URL}/share/${shareId}` : `/api/share/${shareId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Not found: ${response.status}`);
    return response.json();
  }

  async productQA(
    question: string,
    productContext: object & { id?: string },
    history: { role: string; content: string }[]
  ): Promise<string> {
    const url = API_BASE_URL ? `${API_BASE_URL}/product-qa` : '/api/product-qa';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        product_context: productContext,
        product_id: productContext.id ?? null,
        history,
      }),
    });
    if (!response.ok) throw new Error(`Product QA failed: ${response.status}`);
    const data = await response.json();
    return data.answer as string;
  }
}

export const idssApiService = new IDSSApiService();
