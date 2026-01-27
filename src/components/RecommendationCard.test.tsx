import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendationCard from '@/components/RecommendationCard';
import type { Product } from '@/types/chat';

describe('RecommendationCard', () => {
  it('renders product and calls onItemSelect on click', async () => {
    const user = userEvent.setup();
    const onItemSelect = jest.fn();

    const product: Product = {
      id: 'p1',
      title: '2023 Toyota Camry',
      price: 24999,
      mileage: 11000,
      year: 2023,
      source: 'Test Dealer',
      image_url: 'https://example.com/img.jpg',
    };

    render(
      <RecommendationCard
        products={[product]}
        onItemSelect={onItemSelect}
      />,
    );

    expect(screen.getByText('2023 Toyota Camry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view details/i }));
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });

  it('renders nothing when products is empty', () => {
    const { container } = render(<RecommendationCard products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

