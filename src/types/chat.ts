export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: Product[];
  quick_replies?: string[];
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  response_type: 'question' | 'recommendations';
  message: string;
  session_id: string;
  quick_replies?: string[];
  recommendations?: Product[];
}

export interface Product {
  id: string;
  title: string; // Display title (e.g., "2023 Toyota Camry" or "Black Long Sleeve Top")
  price: number;
  price_text?: string;
  image_url?: string;
  description?: string;
  brand?: string; // For products: brand name. For vehicles: make
  source?: string; // Retailer/dealer name
  rating?: number;
  rating_count?: number;
  // Domain-agnostic: any product can have these fields
  [key: string]: unknown; // Allow additional product-specific fields (make, model, year, mileage, etc.)
}
