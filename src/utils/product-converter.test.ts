import { convertAPIVehicleToProduct, convertAPIVehiclesToProducts } from '@/utils/product-converter';
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

  it('preserves UnifiedProduct fields when productType is set', () => {
    const apiVehicle = {
      productType: 'laptop',
      id: 'lap-123',
      name: 'MacBook Pro',
      brand: 'Apple',
      price: 1499,
      category: 'laptop',
      image: { primary: 'https://example.com/macbook.jpg' },
      vehicle: {},
      retailListing: {},
    } as unknown as APIVehicle;

    const product = convertAPIVehicleToProduct(apiVehicle);

    expect(product.id).toBe('lap-123');
    expect(product.title).toBe('MacBook Pro');
    expect(product.productType).toBe('laptop');
    expect(product.brand).toBe('Apple');
    expect(product.price).toBe(1499);
    expect(product.category).toBe('laptop');
    expect(product.image_url).toBe('https://example.com/macbook.jpg');
  });
});

describe('convertAPIVehiclesToProducts', () => {
  it('converts 2D array of API vehicles to 2D array of Products', () => {
    const row1: APIVehicle[] = [
      {
        vehicle: { make: 'Toyota', model: 'Camry', year: 2023 },
        retailListing: { price: 24999, miles: 10000, primaryImage: 'https://a.jpg', dealer: 'Dealer A', listing_id: 'L1' },
      },
    ];
    const row2: APIVehicle[] = [
      {
        vehicle: { make: 'Honda', model: 'Accord', year: 2022 },
        retailListing: { price: 22999, miles: 15000, primaryImage: 'https://b.jpg', dealer: 'Dealer B', listing_id: 'L2' },
      },
    ];
    const apiVehicles = [row1, row2];

    const products = convertAPIVehiclesToProducts(apiVehicles);

    expect(products).toHaveLength(2);
    expect(products[0]).toHaveLength(1);
    expect(products[1]).toHaveLength(1);
    expect(products[0][0].id).toBe('L1');
    expect(products[0][0].title).toBe('2023 Toyota Camry');
    expect(products[1][0].id).toBe('L2');
    expect(products[1][0].title).toBe('2022 Honda Accord');
  });
});

