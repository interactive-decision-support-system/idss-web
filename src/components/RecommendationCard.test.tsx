import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FieldConfig } from '@/config/domain-config';
import RecommendationCard from '@/components/RecommendationCard';
import type { Product } from '@/types/chat';

jest.mock('@/config/domain-config', () => {
  const recommendationCardFields: FieldConfig[] = [
    {
      label: 'Price',
      key: 'price',
      format: (value: unknown) => `$${Number(value).toLocaleString()}`,
    },
    {
      label: 'Mileage',
      key: 'mileage',
      format: (value: unknown) => `${Number(value).toLocaleString()} mi`,
    },
  ];

  return {
    currentDomainConfig: {
      productName: 'item',
      productNamePlural: 'items',
      welcomeMessage: 'Welcome',
      inputPlaceholder: 'Type a message',
      viewDetailsButtonText: 'View Details',
      recommendationCardFields,
      recommendationCardSubtitleKey: 'source',
      recommendationCardSubtitleClassName: 'text-base text-black/60',
      detailPageFields: [],
      defaultQuickReplies: [],
    },
  };
});

describe('RecommendationCard', () => {
  it('renders product and calls onItemSelect on click', async () => {
    const user = userEvent.setup();
    const onItemSelect = jest.fn();

    const product: Product = {
      id: 'p1',
      title: 'Example Product',
      price: 24999,
      mileage: 11000,
      source: 'Test Dealer',
      image_url: 'https://example.com/img.jpg',
    };

    render(
      <RecommendationCard
        product={product}
        onItemSelect={onItemSelect}
      />,
    );

    expect(screen.getByText('Example Product')).toBeInTheDocument();
    expect(screen.getByText('Test Dealer')).toBeInTheDocument();
    expect(screen.getByText('$24,999')).toBeInTheDocument();
    expect(screen.getByText('11,000 mi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view details/i }));
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });

  it('renders nothing when product is missing', () => {
    const { container } = render(<RecommendationCard product={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = jest.fn();
    const product: Product = {
      id: 'p1',
      title: 'Example Product',
      price: 24999,
      source: 'Test Dealer',
      image_url: 'https://example.com/img.jpg',
    };

    render(
      <RecommendationCard
        product={product}
        onItemSelect={jest.fn()}
        onToggleFavorite={onToggleFavorite}
        isFavorite={() => false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /favorite/i }));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });

  it('shows Unfavorite when product is favorited', () => {
    const product: Product = {
      id: 'p1',
      title: 'Example Product',
      price: 24999,
      source: 'Test Dealer',
      image_url: 'https://example.com/img.jpg',
    };

    render(
      <RecommendationCard
        product={product}
        onItemSelect={jest.fn()}
        onToggleFavorite={jest.fn()}
        isFavorite={() => true}
      />,
    );

    expect(screen.getByRole('button', { name: /unfavorite/i })).toBeInTheDocument();
  });
});

