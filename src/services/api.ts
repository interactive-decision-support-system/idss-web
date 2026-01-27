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
}

export const idssApiService = new IDSSApiService();
