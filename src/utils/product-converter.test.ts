import { convertAPIVehicleToProduct } from '@/utils/product-converter';
import type { APIVehicle } from '@/types/chat';

describe('convertAPIVehicleToProduct', () => {
  it('maps common fields and computes title/price_text', () => {
    const apiVehicle: APIVehicle = {
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        trim: 'SE',
        vin: 'VIN123',
        mileage: 12000,
      },
      retailListing: {
        price: 24999,
        miles: 11000,
        primaryImage: 'https://example.com/img.jpg',
        dealer: 'Test Dealer',
        carfaxUrl: 'https://example.com/listing',
        listing_id: 'LISTING123',
        city: 'Palo Alto',
        state: 'CA',
      },
    };

    const product = convertAPIVehicleToProduct(apiVehicle);

    expect(product.id).toBe('LISTING123');
    expect(product.title).toBe('2023 Toyota Camry SE');
    expect(product.brand).toBe('Toyota');
    expect(product.price).toBe(24999);
    expect(product.price_text).toBe('$24,999');
    expect(product.mileage).toBe(11000);
    expect(product.image_url).toBe('https://example.com/img.jpg');
    expect(product.source).toBe('Test Dealer');
    expect(product.location).toBe('Palo Alto, CA');
    expect(product.listing_url).toBe('https://example.com/listing');
  });

  it('falls back to root @id for listing_url when carfaxUrl missing', () => {
    const apiVehicle = {
      '@id': 'https://example.com/root-id',
      vehicle: { make: 'Ford', model: 'F-150', year: 2020 },
      retailListing: { price: 30000 },
    } as unknown as APIVehicle;

    const product = convertAPIVehicleToProduct(apiVehicle);
    expect(product.listing_url).toBe('https://example.com/root-id');
  });
});

