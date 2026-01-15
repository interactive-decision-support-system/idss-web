import { ChatResponse, APIVehicle } from '@/types/chat';
import { dummyAPIVehicles } from './dummy-products';
import { currentDomainConfig } from '@/config/domain-config';

// Simple session storage (in production, use proper session management)
const sessions: Map<string, { messageCount: number }> = new Map();

// Helper function to create diversified recommendations (2D array with bucket labels)
function createDiversifiedRecommendations(
  vehicles: APIVehicle[],
  dimension: 'price' | 'body_type' | 'fuel_type' = 'price'
): { recommendations: APIVehicle[][]; bucket_labels: string[]; diversification_dimension: string } {
  if (vehicles.length === 0) {
    return { recommendations: [], bucket_labels: [], diversification_dimension: dimension };
  }

  // Sort vehicles by the diversification dimension
  const sorted = [...vehicles].sort((a, b) => {
    if (dimension === 'price') {
      const priceA = Number(a.retailListing?.price || a.vehicle?.price || 0);
      const priceB = Number(b.retailListing?.price || b.vehicle?.price || 0);
      return priceA - priceB;
    }
    // For other dimensions, just group by value
    const valA = (a.vehicle?.[dimension] as string) || '';
    const valB = (b.vehicle?.[dimension] as string) || '';
    return valA.localeCompare(valB);
  });

  // Split into up to 3 buckets
  const numBuckets = Math.min(3, sorted.length);
  const bucketSize = Math.ceil(sorted.length / numBuckets);
  const buckets: APIVehicle[][] = [];
  const labels: string[] = [];

  for (let i = 0; i < numBuckets; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, sorted.length);
    const bucket = sorted.slice(start, end);
    
    if (bucket.length > 0) {
      buckets.push(bucket);
      
      // Generate label based on dimension
      if (dimension === 'price') {
        const prices = bucket.map(v => Number(v.retailListing?.price || v.vehicle?.price || 0));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (i === 0) {
          labels.push(`Under $${Math.ceil(maxPrice / 1000)}K`);
        } else if (i === numBuckets - 1) {
          labels.push(`$${Math.floor(minPrice / 1000)}K and up`);
        } else {
          labels.push(`$${Math.floor(minPrice / 1000)}K - $${Math.ceil(maxPrice / 1000)}K`);
        }
      } else {
        const value = bucket[0].vehicle?.[dimension] as string || 'Various';
        labels.push(value.charAt(0).toUpperCase() + value.slice(1));
      }
    }
  }

  return {
    recommendations: buckets,
    bucket_labels: labels,
    diversification_dimension: dimension,
  };
}

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
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.make?.toLowerCase() === 'toyota' || 
      v.vehicle.model?.toLowerCase() === 'camry'
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some Toyota Camry options for you.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('honda') || lowerMessage.includes('cr-v') || lowerMessage.includes('crv')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.make?.toLowerCase() === 'honda' || 
      v.vehicle.model?.toLowerCase().includes('cr-v')
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some Honda CR-V options I found.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('suv') || lowerMessage.includes('sport utility')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.body_type?.toLowerCase() === 'suv'
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some SUV options for you.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('truck') || lowerMessage.includes('pickup')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.body_type?.toLowerCase().includes('truck')
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some pickup truck options.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('tesla') || lowerMessage.includes('electric') || lowerMessage.includes('ev')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.make?.toLowerCase() === 'tesla' || 
      v.vehicle.fuel_type?.toLowerCase() === 'electric'
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here's a Tesla Model 3, a great electric vehicle option.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('sedan')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.body_type?.toLowerCase() === 'sedan'
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some sedan options for you.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('bmw') || lowerMessage.includes('luxury')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.make?.toLowerCase() === 'bmw'
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here's a luxury BMW option for you.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('ford') || lowerMessage.includes('f-150') || lowerMessage.includes('f150')) {
    const filtered = dummyAPIVehicles.filter(v => 
      v.vehicle.make?.toLowerCase() === 'ford' || 
      v.vehicle.model?.toLowerCase().includes('f-150')
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here's a Ford F-150, a popular pickup truck.",
      session_id: session,
      ...diversified,
    };
  }

  if (lowerMessage.includes('under') && (lowerMessage.includes('30000') || lowerMessage.includes('30'))) {
    const filtered = dummyAPIVehicles.filter(v => 
      Number(v.retailListing?.price || v.vehicle?.price || 0) < 30000
    );
    const diversified = createDiversifiedRecommendations(filtered, 'price');
    return {
      response_type: 'recommendations',
      message: "Here are some vehicles under $30,000.",
      session_id: session,
      ...diversified,
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
