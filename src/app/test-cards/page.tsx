'use client';

import React from 'react';
import RecommendationCard from '@/components/RecommendationCard';
import { UnifiedProduct } from '@/types/chat';

export default function TestPage() {
    const vehicleProduct: UnifiedProduct = {
        id: 'v1',
        productType: 'vehicle',
        name: '2023 Tesla Model 3',
        brand: 'Tesla',
        price: 35000,
        available: true,
        image: {
            primary: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: 1,
            gallery: []
        },
        vehicle: {
            year: 2023,
            make: 'Tesla',
            model: 'Model 3',
            mileage: 12000,
            mpg: { city: 130, highway: 130 }
        }
    };

    const laptopProduct: UnifiedProduct = {
        id: 'l1',
        productType: 'laptop',
        name: 'MacBook Pro 16"',
        brand: 'Apple',
        price: 2499,
        available: true,
        image: {
            primary: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: 1,
            gallery: []
        },
        laptop: {
            productType: 'laptop',
            specs: {
                processor: 'M2 Max',
                ram: '32GB',
                storage: '1TB SSD',
                display: '16-inch Liquid Retina XDR'
            },
            tags: ['Creative', 'Performance', 'Battery Life']
        }
    };

    const bookProduct: UnifiedProduct = {
        id: 'b1',
        productType: 'book',
        name: 'The Design of Everyday Things',
        brand: 'Basic Books',
        price: 18,
        available: true,
        image: {
            primary: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: 1,
            gallery: []
        },
        book: {
            author: 'Don Norman',
            genre: 'Design',
            format: 'Paperback',
            pages: 368
        }
    };

    const handleSelect = (p: any) => console.log('Selected:', p.name);
    const handleFav = (p: any) => console.log('Toggled Fav:', p.name);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">Unified Product Cards Test</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <h2 className="text-lg font-semibold mb-2">Vehicle</h2>
                    <RecommendationCard
                        product={vehicleProduct}
                        onItemSelect={handleSelect}
                        onToggleFavorite={handleFav}
                    />
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">Laptop</h2>
                    <RecommendationCard
                        product={laptopProduct}
                        onItemSelect={handleSelect}
                        onToggleFavorite={handleFav}
                    />
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">Book</h2>
                    <RecommendationCard
                        product={bookProduct}
                        onItemSelect={handleSelect}
                        onToggleFavorite={handleFav}
                    />
                </div>
            </div>
        </div>
    );
}
