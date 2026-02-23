/**
 * Domain-agnostic utility to convert API vehicle/product format to frontend Product format.
 * This keeps the conversion logic separate and reusable for different product types.
 */

import { APIVehicle } from '@/types/chat';
import { Product } from '@/types/chat';

/** API response that may include UnifiedProduct-like fields or category for domain detection */
type APIProductWithUnified = APIVehicle & {
  productType?: string;
  category?: string;
  part_type?: string;
  id?: string;
  name?: string;
  image?: { primary?: string };
  brand?: string;
  price?: number;
};

/**
 * Convert API vehicle format to frontend Product format.
 * Domain-agnostic: works with any product type that follows the API structure.
 */
export function convertAPIVehicleToProduct(apiVehicle: APIVehicle): Product {
  const vehicle = apiVehicle.vehicle || {};
  const retailListing = apiVehicle.retailListing || {};

  // Check if this is a UnifiedProduct (has productType)
  const typedApi = apiVehicle as APIProductWithUnified;
  const productType = typedApi.productType;

  // If we have a UnifiedProduct, we want to preserve its structure while ensuring
  // it also satisfies the Product interface for legacy components.
  // We check for productType to identify this new schema.
  if (productType) {
    const up = typedApi;
    // Helper to get image URL from normalized UnifiedProduct structure
    const upImage = up.image?.primary;

    const imageUrl = typeof upImage === 'string' ? upImage
      : (vehicle.image_url as string) || (retailListing as { photo_url?: string })?.photo_url;

    // For laptops, promote laptop.specs fields to top-level so domain-config field keys resolve
    const laptopSpecs = productType === 'laptop'
      ? {
        ...((up as { laptop?: { specs?: Record<string, unknown> } }).laptop?.specs ?? {}),
        // Promote fields from the raw blob that aren't in LaptopSpecs
        battery_life: (vehicle as Record<string, unknown>).battery_life,
        os: (vehicle as Record<string, unknown>).os,
        weight: (vehicle as Record<string, unknown>).weight,
        color: (vehicle as Record<string, unknown>).color,
        storage_type: (vehicle as Record<string, unknown>).storage_type,
        refresh_rate_hz: (vehicle as Record<string, unknown>).refresh_rate_hz,
        resolution: (vehicle as Record<string, unknown>).resolution,
        // screen_size is stored as 'display' in LaptopSpecs — alias it
        screen_size: (up as { laptop?: { specs?: { display?: unknown } } }).laptop?.specs?.display
          ?? (vehicle as Record<string, unknown>).screen_size,
        gpu: (up as { laptop?: { specs?: { graphics?: unknown } } }).laptop?.specs?.graphics
          ?? (vehicle as Record<string, unknown>).gpu,
      }
      : {};

    return {
      // Include legacy fields if they exist as base
      ...vehicle,
      ...retailListing,
      // Overlay UnifiedProduct fields (preserves productType, category, part_type for multi-domain)
      ...up,
      // Spread laptop specs to top level so laptopConfig detailPageFields can read them directly
      ...laptopSpecs,
      // Ensure ID is robust
      id: up.id || `${vehicle.make || 'unknown'}-${vehicle.model || 'product'}-${vehicle.year || '0'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // Legacy fallback fields for components that haven't migrated
      title: up.name || (vehicle.title as string) || 'Product',
      image_url: imageUrl,
      brand: up.brand || vehicle.make,
      price: Number(up.price ?? (retailListing as { price?: number })?.price ?? vehicle.price ?? 0),
      // Preserve category/part_type for getDomainConfigForProduct when API sends them
      ...(up.category !== undefined && { category: up.category }),
      ...(up.part_type !== undefined && { part_type: up.part_type }),
    } as Product;
  }


  // Extract common fields
  const make = vehicle.make as string;
  const model = vehicle.model as string;
  const year = vehicle.year as number;
  const price = retailListing.price as number || vehicle.price as number || 0;
  const mileage = retailListing.miles as number || vehicle.mileage as number || retailListing.mileage as number;

  // Build title from make, model, year
  const title = year && make && model
    ? `${year} ${make} ${model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
    : (vehicle.title as string) || 'Product';

  // Extract image URL - check primaryImage first (actual API format), then fallback to photo_url
  const imageUrl = retailListing.primaryImage as string
    || retailListing.photo_url as string
    || vehicle.image_url as string
    || vehicle.photo_url as string;

  // Extract location/dealer info - check dealer first (actual API format), then fallback to dealer_name
  const location = retailListing.location as string || vehicle.location as string;
  const city = retailListing.city as string;
  const state = retailListing.state as string;
  const fullLocation = city && state ? `${city}, ${state}` : location;
  const dealerName = retailListing.dealer as string
    || retailListing.dealer_name as string
    || vehicle.dealer_name as string;
  const source = dealerName || fullLocation || 'Unknown Dealer';

  // Extract listing URL - check carfaxUrl first, then @id field from root
  const listingUrl = retailListing.carfaxUrl as string
    || (apiVehicle as { '@id'?: string })['@id'] as string
    || undefined;

  const typedApiForLegacy = apiVehicle as APIProductWithUnified;
  // Build Product object (domain-agnostic structure)
  const product: Product = {
    id: typedApiForLegacy.id as string // content checks top-level id first (UnifiedProduct)
      || retailListing.listing_id as string
      || vehicle.vin as string
      || vehicle.id as string
      || `${make || 'unknown'}-${model || 'product'}-${year || '0'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    image_url: imageUrl,
    brand: make, // For vehicles, brand = make
    source,
    // Include all vehicle and retailListing fields for domain-specific access
    ...vehicle,
    ...retailListing,
    // Preserve category/part_type from API for multi-domain detection when present
    ...(typedApiForLegacy.category !== undefined && { category: typedApiForLegacy.category }),
    ...(typedApiForLegacy.part_type !== undefined && { part_type: typedApiForLegacy.part_type }),
    // Explicitly map common fields (after spreads to avoid overwriting)
    make,
    model,
    year,
    price, // Set after spreads to ensure our computed value is used
    price_text: price ? `$${price.toLocaleString()}` : undefined,
    mileage,
    inventory: (retailListing as { inventory?: number }).inventory ?? (vehicle as { inventory?: number }).inventory,
    body_style: vehicle.body_type as string || vehicle.body_style as string,
    fuel_type: vehicle.fuel_type as string,
    transmission: vehicle.transmission as string,
    drivetrain: vehicle.drivetrain as string,
    engine: vehicle.engine as string,
    exterior_color: vehicle.color as string || vehicle.exterior_color as string,
    vin: vehicle.vin as string,
    location: fullLocation || location,
    listing_url: listingUrl, // URL to view the actual listing
  };

  return product;
}

/**
 * Convert 2D array of API vehicles to 2D array of Products.
 */
export function convertAPIVehiclesToProducts(apiVehicles: APIVehicle[][]): Product[][] {
  return apiVehicles.map(row => row.map(convertAPIVehicleToProduct));
}
