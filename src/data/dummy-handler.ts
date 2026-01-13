import { ChatResponse } from '@/types/chat';
import { dummyProducts } from './dummy-products';
import { currentDomainConfig } from '@/config/domain-config';

// Simple session storage (in production, use proper session management)
const sessions: Map<string, { messageCount: number }> = new Map();

export async function dummyChatHandler(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  // Get or create session
  const session = sessionId || `session-${Date.now()}`;
  if (!sessions.has(session)) {
    sessions.set(session, { messageCount: 0 });
  }
  const sessionData = sessions.get(session)!;
  sessionData.messageCount++;

  const lowerMessage = message.toLowerCase().trim();

  // Simple keyword matching for demo - car-related queries
  if (lowerMessage.includes('toyota') || lowerMessage.includes('camry')) {
    return {
      response_type: 'recommendations',
      message: "Here are some Toyota Camry options for you.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.make as string)?.toLowerCase() === 'toyota' || 
        (p.model as string)?.toLowerCase() === 'camry'
      ),
    };
  }

  if (lowerMessage.includes('honda') || lowerMessage.includes('cr-v') || lowerMessage.includes('crv')) {
    return {
      response_type: 'recommendations',
      message: "Here are some Honda CR-V options I found.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.make as string)?.toLowerCase() === 'honda' || 
        (p.model as string)?.toLowerCase().includes('cr-v')
      ),
    };
  }

  if (lowerMessage.includes('suv') || lowerMessage.includes('sport utility')) {
    // Return multiple SUVs to demonstrate arrow navigation
    return {
      response_type: 'recommendations',
      message: "Here are some SUV options for you.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.body_style as string)?.toLowerCase() === 'suv'
      ),
    };
  }

  if (lowerMessage.includes('truck') || lowerMessage.includes('pickup')) {
    // Return multiple trucks to demonstrate arrow navigation
    return {
      response_type: 'recommendations',
      message: "Here are some pickup truck options.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.body_style as string)?.toLowerCase().includes('truck')
      ),
    };
  }

  if (lowerMessage.includes('tesla') || lowerMessage.includes('electric') || lowerMessage.includes('ev')) {
    return {
      response_type: 'recommendations',
      message: "Here's a Tesla Model 3, a great electric vehicle option.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.make as string)?.toLowerCase() === 'tesla' || 
        (p.fuel_type as string)?.toLowerCase() === 'electric'
      ),
    };
  }

  if (lowerMessage.includes('sedan')) {
    // Return multiple sedans to demonstrate arrow navigation
    return {
      response_type: 'recommendations',
      message: "Here are some sedan options for you.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.body_style as string)?.toLowerCase() === 'sedan'
      ),
    };
  }

  if (lowerMessage.includes('bmw') || lowerMessage.includes('luxury')) {
    return {
      response_type: 'recommendations',
      message: "Here's a luxury BMW option for you.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.make as string)?.toLowerCase() === 'bmw'
      ),
    };
  }

  if (lowerMessage.includes('ford') || lowerMessage.includes('f-150') || lowerMessage.includes('f150')) {
    return {
      response_type: 'recommendations',
      message: "Here's a Ford F-150, a popular pickup truck.",
      session_id: session,
      recommendations: dummyProducts.filter(p => 
        (p.make as string)?.toLowerCase() === 'ford' || 
        (p.model as string)?.toLowerCase().includes('f-150')
      ),
    };
  }

  if (lowerMessage.includes('under') && lowerMessage.includes('30000') || lowerMessage.includes('under 30')) {
    // Return multiple affordable options to demonstrate arrow navigation
    return {
      response_type: 'recommendations',
      message: "Here are some vehicles under $30,000.",
      session_id: session,
      recommendations: dummyProducts.filter(p => p.price < 30000),
    };
  }

  // Default response - ask what they're looking for
  const config = currentDomainConfig;
  return {
    response_type: 'question',
    message: `I'd be happy to help you find the perfect ${config.productName}! What are you looking for?`,
    session_id: session,
    quick_replies: config.defaultQuickReplies,
  };
}
