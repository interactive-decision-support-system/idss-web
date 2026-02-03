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

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  captured_at?: string; // ISO timestamp
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_location?: UserLocation;
  k?: number;
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

export interface UnifiedProduct {
  // --- Common Fields ---
  id: string;              // VIN for vehicles, Product ID for others
  productType: 'vehicle' | 'laptop' | 'book' | 'generic';
  name: string;            // Title, Model, or Product Name
  brand: string;           // Make, Manufacturer, or Product Brand
  price: number;           // Price in USD (integer)
  available: boolean;

  // Normalized Image Object
  image: {
    primary: string;       // URL or null
    count: number;
    gallery: string[];
  };

  // --- Type-Specific Details (Only one will be populated) ---

  // Present if productType === 'vehicle'
  vehicle?: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    bodyStyle?: string;
    mileage?: number;
    fuel?: string;
    mpg?: { city: number; highway: number };
    // ... other vehicle specs
  };
  // Present if productType === 'laptop'
  laptop?: {
    productType: 'laptop';
    specs: {
      processor?: string;
      ram?: string;
      storage?: string;
      display?: string;
      graphics?: string;
    };
    gpuVendor?: string;
    gpuModel?: string;
    tags: string[];
  };
  // Present if productType === 'book'
  book?: {
    author?: string;
    genre?: string;
    format?: string;
    pages?: number;
    isbn?: string;
  };

  // Allow for existing fields to coexist for now if needed, or strictly index signature
  [key: string]: unknown;
}

export type Product = UnifiedProduct | {
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
  productType?: string; // Optional on legacy
  // Domain-agnostic: any product can have these fields
  [key: string]: unknown; // Allow additional product-specific fields (make, model, year, mileage, etc.)
};
