// API vehicle structure (matches backend)
export interface APIVehicle {
  vehicle: {
    make: string;
    model: string;
    year: number;
    body_type?: string;
    fuel_type?: string;
    mileage?: number;
    transmission?: string;
    drivetrain?: string;
    engine?: string;
    color?: string;
    vin?: string;
    [key: string]: unknown;
  };
  retailListing: {
    price: number;
    miles?: number;
    photo_url?: string;
    listing_id?: string;
    dealer_name?: string;
    location?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: Product[][]; // 2D array: rows of products
  bucket_labels?: string[]; // Labels for each row
  diversification_dimension?: string; // Dimension used for diversification
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
  recommendations?: APIVehicle[][]; // 2D array from API
  bucket_labels?: string[];
  diversification_dimension?: string;
  filters?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  question_count?: number;
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
