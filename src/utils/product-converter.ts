/**
 * Domain-agnostic utility to convert API vehicle/product format to frontend Product format.
 * This keeps the conversion logic separate and reusable for different product types.
 */

import { APIVehicle } from '@/types/chat';
import { Product } from '@/types/chat';

/**
 * Convert API vehicle format to frontend Product format.
 * Domain-agnostic: works with any product type that follows the API structure.
 */
export function convertAPIVehicleToProduct(apiVehicle: APIVehicle): Product {
  const vehicle = apiVehicle.vehicle || {};
  const retailListing = apiVehicle.retailListing || {};
  
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
  
  // Build Product object (domain-agnostic structure)
  const product: Product = {
    id: retailListing.listing_id as string 
      || vehicle.vin as string 
      || vehicle.id as string 
      || `${make}-${model}-${year}-${Date.now()}`,
    title,
    image_url: imageUrl,
    brand: make, // For vehicles, brand = make
    source,
    // Include all vehicle and retailListing fields for domain-specific access
    ...vehicle,
    ...retailListing,
    // Explicitly map common fields (after spreads to avoid overwriting)
    make,
    model,
    year,
    price, // Set after spreads to ensure our computed value is used
    price_text: price ? `$${price.toLocaleString()}` : undefined,
    mileage,
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
