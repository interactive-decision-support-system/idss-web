/**
 * Domain configuration for the recommendation system.
 * This allows the application to be customized for different product types
 * (vehicles, PC parts/electronics, etc.) without code changes.
 */

export interface FieldConfig {
  label: string; // Display label for the field
  key: string; // Product object key
  format?: (value: unknown) => string; // Optional formatter function
  condition?: (product: Record<string, unknown>) => boolean; // Optional condition to show field
  labelClassName?: string; // Optional Tailwind classes for label text
  valueClassName?: string; // Optional Tailwind classes for value text
}

export interface DomainConfig {
  // Product naming
  productName: string; // e.g., "vehicle", "product", "item"
  productNamePlural: string; // e.g., "vehicles", "products", "items"

  // UI text
  welcomeMessage: string;
  inputPlaceholder: string;
  /** Example queries to cycle through in the input placeholder (ChatGPT-style). Falls back to [inputPlaceholder] if omitted. */
  examplePlaceholderQueries?: string[];
  viewDetailsButtonText: string;
  viewListingButtonText?: string; // e.g., "View Listing", "View on Site", etc.
  dealerLabel?: string; // e.g., "Dealer" for vehicles, "Store" for products
  storeLabel?: string;

  // Recommendation card fields
  recommendationCardFields: FieldConfig[];

  // Optional: show a single field under the product title on recommendation cards
  // (e.g., "Dealer" / "Retailer" / "Store" name). This is not shown on the detail page.
  recommendationCardSubtitleKey?: string;
  recommendationCardSubtitleClassName?: string;

  // View details page fields (for future implementation)
  detailPageFields: FieldConfig[];

  // Quick reply suggestions
  defaultQuickReplies: string[];
}

// Helper function to create recommendation card fields
const createRecommendationFields = () => [
  {
    label: 'Price',
    key: 'price',
    format: (value: unknown) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
    labelClassName: 'text-base text-black/60',
    valueClassName: 'text-xl font-bold text-[#8C1515]',
  },
  {
    label: 'Mileage',
    key: 'mileage',
    format: (value: unknown) => typeof value === 'number' ? `${value.toLocaleString()} mi` : String(value),
    condition: (product: Record<string, unknown>) => product.mileage !== undefined && product.mileage !== null,
    labelClassName: 'text-base text-black/60',
    valueClassName: 'text-xl font-semibold text-black',
  },
];

// Default vehicle configuration (CarMax-like)
export const vehicleConfig: DomainConfig = {
  productName: 'vehicle',
  productNamePlural: 'vehicles',

  welcomeMessage: "Hi! What are you looking for today?",
  inputPlaceholder: "What kind of vehicle are you looking for?",
  examplePlaceholderQueries: [
    "What kind of vehicle are you looking for?",
    "I need a reliable sedan for commuting",
    "Show me SUVs under $35k",
    "Looking for a truck with good towing",
    "Fuel-efficient car for long drives",
  ],
  viewDetailsButtonText: "View Details",
  viewListingButtonText: "View Listing",
  dealerLabel: "Dealer",

  recommendationCardFields: createRecommendationFields(),
  recommendationCardSubtitleKey: 'source',
  recommendationCardSubtitleClassName: 'text-base text-black/60',

  detailPageFields: [
    {
      label: 'Make',
      key: 'make',
      condition: (product) => product.make !== undefined,
    },
    {
      label: 'Model',
      key: 'model',
      condition: (product) => product.model !== undefined,
    },
    {
      label: 'Year',
      key: 'year',
    },
    {
      label: 'Price',
      key: 'price',
      format: (value) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
    },
    {
      label: 'Mileage',
      key: 'mileage',
      format: (value) => typeof value === 'number' ? `${value.toLocaleString()} mi` : String(value),
      condition: (product) => product.mileage !== undefined,
    },
    {
      label: 'Trim',
      key: 'trim',
      condition: (product) => product.trim !== undefined,
    },
    {
      label: 'Body Style',
      key: 'body_style',
      condition: (product) => product.body_style !== undefined,
    },
    {
      label: 'Transmission',
      key: 'transmission',
      condition: (product) => product.transmission !== undefined,
    },
    {
      label: 'Fuel Type',
      key: 'fuel_type',
      condition: (product) => product.fuel_type !== undefined,
    },
    {
      label: 'Drivetrain',
      key: 'drivetrain',
      condition: (product) => product.drivetrain !== undefined,
    },
    {
      label: 'Exterior Color',
      key: 'exterior_color',
      condition: (product) => product.exterior_color !== undefined,
    },
    {
      label: 'Interior Color',
      key: 'interior_color',
      condition: (product) => product.interior_color !== undefined,
    },
    {
      label: 'Rating',
      key: 'rating',
      format: (value) => {
        const rating = typeof value === 'number' ? value : parseFloat(String(value));
        return `${rating.toFixed(1)} ★`;
      },
      condition: (product) => product.rating !== undefined,
    },
  ],

  defaultQuickReplies: [
    "Show me SUVs",
    "I'm looking for a sedan",
    "I need a truck"
  ],
};

// Helper function to create PC parts/electronics recommendation fields
const createPCPartsRecommendationFields = () => [
  {
    label: 'Price',
    key: 'price',
    format: (value: unknown) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
  },
  {
    label: 'Brand',
    key: 'brand',
    condition: (product: Record<string, unknown>) => product.brand !== undefined,
  },
  {
    label: 'Category',
    key: 'part_type', // Use part_type as primary, falls back to category in renderField
    condition: (product: Record<string, unknown>) => product.category !== undefined || product.part_type !== undefined,
  },
  {
    label: 'Rating',
    key: 'rating',
    format: (value: unknown) => {
      const rating = typeof value === 'number' ? value : parseFloat(String(value));
      return `${rating.toFixed(1)} ★`;
    },
    condition: (product: Record<string, unknown>) => product.rating !== undefined && product.rating !== null,
  },
  {
    label: 'Retailer',
    key: 'source',
    condition: (product: Record<string, unknown>) => product.source !== undefined && product.source !== null,
  },
];

// PC Parts/Electronics configuration
export const pcPartsConfig: DomainConfig = {
  productName: 'part',
  productNamePlural: 'parts',

  welcomeMessage: "Hi! What are you looking for today?",
  inputPlaceholder: "What kind of PC part are you looking for?",
  examplePlaceholderQueries: [
    "What kind of PC part are you looking for?",
    "I need a GPU for 1440p gaming",
    "Show me CPUs for video editing",
    "Quiet PSU, 650W or more",
    "NVMe SSD, 1TB, under $100",
  ],
  viewDetailsButtonText: "View Details",
  viewListingButtonText: "View Listing",
  storeLabel: "Retailer",

  recommendationCardFields: createPCPartsRecommendationFields(),

  detailPageFields: [
    {
      label: 'Brand',
      key: 'brand',
      condition: (product) => product.brand !== undefined,
    },
    {
      label: 'Category',
      key: 'part_type', // Use part_type as primary, falls back to category in detail page renderer
      condition: (product) => product.category !== undefined || product.part_type !== undefined,
    },
    {
      label: 'Price',
      key: 'price',
      format: (value) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
    },
    {
      label: 'Rating',
      key: 'rating',
      format: (value) => {
        const rating = typeof value === 'number' ? value : parseFloat(String(value));
        return `${rating.toFixed(1)} ★`;
      },
      condition: (product) => product.rating !== undefined,
    },
    // GPU-specific fields
    {
      label: 'VRAM',
      key: 'vram',
      condition: (product) => product.vram !== undefined && (product.category === 'gpu' || product.part_type === 'gpu'),
      format: (value) => `${value} GB`,
    },
    {
      label: 'Memory Type',
      key: 'memory_type',
      condition: (product) => product.memory_type !== undefined && (product.category === 'gpu' || product.part_type === 'gpu'),
    },
    {
      label: 'Performance Tier',
      key: 'performance_tier',
      condition: (product) => product.performance_tier !== undefined && (product.category === 'gpu' || product.part_type === 'gpu'),
    },
    {
      label: 'Target Resolution',
      key: 'target_resolution',
      condition: (product) => product.target_resolution !== undefined && (product.category === 'gpu' || product.part_type === 'gpu'),
    },
    // CPU-specific fields
    {
      label: 'Cores',
      key: 'core_count',
      condition: (product) => product.core_count !== undefined && (product.category === 'cpu' || product.part_type === 'cpu'),
    },
    {
      label: 'Threads',
      key: 'thread_count',
      condition: (product) => product.thread_count !== undefined && (product.category === 'cpu' || product.part_type === 'cpu'),
    },
    {
      label: 'Socket',
      key: 'socket',
      condition: (product) => product.socket !== undefined && (product.category === 'cpu' || product.part_type === 'cpu'),
    },
    {
      label: 'TDP',
      key: 'tdp',
      condition: (product) => product.tdp !== undefined && (product.category === 'cpu' || product.part_type === 'cpu'),
      format: (value) => `${value}W`,
    },
    // Motherboard-specific fields
    {
      label: 'Chipset',
      key: 'chipset',
      condition: (product) => product.chipset !== undefined && (product.category === 'motherboard' || product.part_type === 'motherboard'),
    },
    {
      label: 'Form Factor',
      key: 'form_factor',
      condition: (product) => product.form_factor !== undefined && (product.category === 'motherboard' || product.part_type === 'motherboard'),
    },
    {
      label: 'RAM Standard',
      key: 'ram_standard',
      condition: (product) => product.ram_standard !== undefined && (product.category === 'motherboard' || product.part_type === 'motherboard'),
    },
    // PSU-specific fields
    {
      label: 'Wattage',
      key: 'wattage',
      condition: (product) => product.wattage !== undefined && (product.category === 'psu' || product.part_type === 'psu'),
      format: (value) => `${value}W`,
    },
    {
      label: 'Certification',
      key: 'certification',
      condition: (product) => product.certification !== undefined && (product.category === 'psu' || product.part_type === 'psu'),
    },
    {
      label: 'Modularity',
      key: 'modularity',
      condition: (product) => product.modularity !== undefined && (product.category === 'psu' || product.part_type === 'psu'),
    },
    // Storage-specific fields
    {
      label: 'Capacity',
      key: 'capacity',
      condition: (product) => product.capacity !== undefined && (product.category === 'storage' || product.part_type === 'storage'),
    },
    {
      label: 'Storage Type',
      key: 'storage_type',
      condition: (product) => product.storage_type !== undefined && (product.category === 'storage' || product.part_type === 'storage'),
    },
    {
      label: 'Interface',
      key: 'interface',
      condition: (product) => product.interface !== undefined && (product.category === 'storage' || product.part_type === 'storage'),
    },
    // RAM-specific fields
    {
      label: 'Capacity',
      key: 'capacity',
      condition: (product) => product.capacity !== undefined && (product.category === 'ram' || product.part_type === 'ram'),
    },
    {
      label: 'RAM Type',
      key: 'ram_standard',
      condition: (product) => product.ram_standard !== undefined && (product.category === 'ram' || product.part_type === 'ram'),
    },
    // Cooling-specific fields
    {
      label: 'Cooling Type',
      key: 'cooling_type',
      condition: (product) => product.cooling_type !== undefined && (product.category === 'cooling' || product.part_type === 'cooling'),
    },
    {
      label: 'TDP Support',
      key: 'tdp_support',
      condition: (product) => product.tdp_support !== undefined && (product.category === 'cooling' || product.part_type === 'cooling'),
      format: (value) => `${value}W`,
    },
    {
      label: 'Retailer',
      key: 'source',
      condition: (product) => product.source !== undefined,
    },
  ],

  defaultQuickReplies: [
    "Show me GPUs",
    "I'm looking for a CPU",
    "I need a motherboard"
  ],
};

// Generic/minimal config for products that don't match vehicle or pc_parts
const createGenericRecommendationFields = (): FieldConfig[] => [
  {
    label: 'Price',
    key: 'price',
    format: (value: unknown) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
    labelClassName: 'text-base text-black/60',
    valueClassName: 'text-xl font-bold text-[#8C1515]',
  },
  {
    label: 'Brand',
    key: 'brand',
    condition: (p: Record<string, unknown>) => p.brand != null,
  },
  {
    label: 'Retailer',
    key: 'source',
    condition: (p: Record<string, unknown>) => p.source != null,
  },
];

export const genericConfig: DomainConfig = {
  productName: 'item',
  productNamePlural: 'items',
  welcomeMessage: "Hi! What are you looking for today?",
  inputPlaceholder: "What are you looking for?",
  examplePlaceholderQueries: ["What are you looking for?"],
  viewDetailsButtonText: "View Details",
  viewListingButtonText: "View Listing",
  recommendationCardFields: createGenericRecommendationFields(),
  recommendationCardSubtitleKey: 'source',
  recommendationCardSubtitleClassName: 'text-base text-black/60',
  detailPageFields: [
    { label: 'Brand', key: 'brand', condition: (p) => p.brand != null },
    { label: 'Price', key: 'price', format: (v) => `$${typeof v === 'number' ? v.toLocaleString() : v}` },
    { label: 'Retailer', key: 'source', condition: (p) => p.source != null },
  ],
  defaultQuickReplies: [],
};

// Laptop configuration
export const laptopConfig: DomainConfig = {
  productName: 'laptop',
  productNamePlural: 'laptops',
  welcomeMessage: "Hi! What are you looking for today?",
  inputPlaceholder: "What kind of laptop are you looking for?",
  examplePlaceholderQueries: [
    "Gaming laptop under $1500",
    "MacBook-level build quality, Windows preferred",
    "Thin and light for travel, all-day battery",
    "Best laptop for machine learning / PyTorch",
  ],
  viewDetailsButtonText: "View Details",
  viewListingButtonText: "View Listing",
  storeLabel: "Retailer",
  recommendationCardFields: [
    {
      label: 'Price',
      key: 'price',
      format: (value: unknown) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
      labelClassName: 'text-base text-black/60',
      valueClassName: 'text-xl font-bold text-[#8C1515]',
    },
    {
      label: 'RAM',
      key: 'ram',
      condition: (p: Record<string, unknown>) => p.ram != null,
    },
    {
      label: 'Storage',
      key: 'storage',
      condition: (p: Record<string, unknown>) => p.storage != null,
    },
  ],
  recommendationCardSubtitleKey: 'brand',
  recommendationCardSubtitleClassName: 'text-base text-black/60',
  detailPageFields: [
    {
      label: 'Brand',
      key: 'brand',
      condition: (p) => p.brand != null,
    },
    {
      label: 'Price',
      key: 'price',
      format: (v) => `$${typeof v === 'number' ? v.toLocaleString() : v}`,
    },
    {
      label: 'Processor',
      key: 'processor',
      condition: (p) => p.processor != null,
    },
    {
      label: 'RAM',
      key: 'ram',
      condition: (p) => p.ram != null,
    },
    {
      label: 'Storage',
      key: 'storage',
      condition: (p) => p.storage != null,
    },
    {
      label: 'Storage Type',
      key: 'storage_type',
      condition: (p) => p.storage_type != null,
    },
    {
      label: 'Display',
      key: 'screen_size',
      condition: (p) => p.screen_size != null,
      format: (v) => typeof v === 'number' ? `${v}"` : String(v),
    },
    {
      label: 'Refresh Rate',
      key: 'refresh_rate_hz',
      condition: (p) => p.refresh_rate_hz != null,
      format: (v) => `${v} Hz`,
    },
    {
      label: 'Resolution',
      key: 'resolution',
      condition: (p) => p.resolution != null,
    },
    {
      label: 'GPU',
      key: 'gpu',
      condition: (p) => p.gpu != null,
    },
    {
      label: 'Battery Life',
      key: 'battery_life',
      condition: (p) => p.battery_life != null,
      format: (v) => typeof v === 'number' ? `${v} hrs` : String(v),
    },
    {
      label: 'Operating System',
      key: 'os',
      condition: (p) => p.os != null,
    },
    {
      label: 'Weight',
      key: 'weight',
      condition: (p) => p.weight != null,
      format: (v) => typeof v === 'number' ? `${v} lbs` : String(v),
    },
    {
      label: 'Color',
      key: 'color',
      condition: (p) => p.color != null,
    },
    {
      label: 'Rating',
      key: 'rating',
      format: (v) => {
        const r = typeof v === 'number' ? v : parseFloat(String(v));
        return `${r.toFixed(1)} ★`;
      },
      condition: (p) => p.rating != null,
    },
    {
      label: 'Retailer',
      key: 'source',
      condition: (p) => p.source != null,
    },
  ],
  defaultQuickReplies: [
    "Gaming laptops",
    "Best for ML / AI",
    "Thin and light",
  ],
};


// Multi-domain: map domain id -> config (used to pick config per product)
export const DOMAIN_IDS = ['vehicle', 'pc_parts', 'generic'] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export const DOMAIN_CONFIG_MAP: Record<DomainId, DomainConfig> = {
  vehicle: vehicleConfig,
  pc_parts: pcPartsConfig,
  generic: genericConfig,
};

/** PC part category/part_type values that indicate pc_parts domain */
const PC_PART_CATEGORIES = new Set([
  'gpu', 'cpu', 'motherboard', 'psu', 'storage', 'ram', 'cooling', 'case',
  'ssd', 'hdd', 'nvme', 'part',
]);

/**
 * Detect domain from a product (after conversion) using productType or category/part_type or shape.
 * Used to select which DomainConfig to use for card and detail rendering.
 */
export function getDomainConfigForProduct(
  product: Record<string, unknown> & { productType?: string }
): DomainConfig {
  const productType = product.productType;
  const category = (product.category ?? product.part_type) as string | undefined;
  const cat = category?.toLowerCase?.();

  if (productType === 'vehicle') return vehicleConfig;
  if (productType === 'laptop') return laptopConfig;
  if (productType === 'book') return genericConfig;

  if (cat && PC_PART_CATEGORIES.has(cat)) return pcPartsConfig;

  const hasVehicleShape =
    product.make != null || product.model != null || product.mileage != null;
  if (hasVehicleShape) return vehicleConfig;

  return genericConfig;
}

/**
 * Combined defaults for multi-domain UI: welcome message, placeholders, and quick replies
 * so users can search any domain without switching config.
 */
export function getMultiDomainDefaults(): {
  welcomeMessage: string;
  defaultQuickReplies: string[];
  examplePlaceholderQueries: string[];
} {
  const configs = [vehicleConfig, pcPartsConfig];
  const welcomeMessage = configs[0].welcomeMessage;
  const defaultQuickReplies: string[] = [];
  const seen = new Set<string>();
  for (const c of configs) {
    for (const q of c.defaultQuickReplies ?? []) {
      if (!seen.has(q)) {
        seen.add(q);
        defaultQuickReplies.push(q);
      }
    }
  }
  const examplePlaceholderQueries: string[] = [];
  const seenPlaceholders = new Set<string>();
  for (const c of configs) {
    const list = c.examplePlaceholderQueries ?? [c.inputPlaceholder];
    for (const p of list) {
      if (!seenPlaceholders.has(p)) {
        seenPlaceholders.add(p);
        examplePlaceholderQueries.push(p);
      }
    }
  }
  return { welcomeMessage, defaultQuickReplies, examplePlaceholderQueries };
}
