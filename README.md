# IDSS Web - Recommendation System

A modern, chat-based recommendation system built with Next.js, React, and TypeScript. This application features a clean, simple interface with recommendations appearing directly in the chat conversation.

## Features

- **Chat-based Interface**: Simple, conversational UI with auto-scrolling messages
- **In-Chat Recommendations**: Product recommendations appear directly in chat messages
- **Multi-Item Navigation**: When multiple items are recommended, navigate through them using arrow buttons
- **Stanford Color Scheme**: Uses Stanford University colors (Cardinal Red #8C1515 and Gray #8b959e)
- **Dummy Data**: Includes hardcoded demo car data (similar to CarMax) for testing
- **Domain-Agnostic**: Code structure works for any product type (vehicles, fashion, electronics, etc.)
- **Domain Configuration**: Easy-to-configure system for customizing product names, UI text, and displayed fields

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route handler (uses dummy data)
│   ├── globals.css               # Global styles with Stanford colors
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat interface
├── components/
│   ├── ChatInput.tsx             # Chat input component
│   └── RecommendationCard.tsx   # In-chat recommendation card with arrows
├── config/
│   └── domain-config.ts          # Domain configuration (vehicles, fashion, etc.)
├── data/
│   ├── dummy-handler.ts          # Dummy chat handler logic
│   └── dummy-products.ts         # Hardcoded product data
├── services/
│   └── api.ts                    # API service (ready for backend integration)
└── types/
    └── chat.ts                   # TypeScript type definitions
```

## Domain Configuration

The application uses a **domain configuration system** that makes it easy to customize for different product types (vehicles, fashion, electronics, etc.) without changing code.

### Switching Domains

To switch between domains, edit `src/config/domain-config.ts` and change the exported config:

```typescript
// For vehicles (default)
export const currentDomainConfig: DomainConfig = vehicleConfig;

// For PC parts/electronics
export const currentDomainConfig: DomainConfig = pcPartsConfig;
```

### Configuration Options

Each domain configuration includes:

- **Product naming**: `productName`, `productNamePlural` (e.g., "vehicle", "item")
- **UI text**: Welcome messages, input placeholders, button text
- **Field configuration**: Which fields to display in recommendation cards and detail pages
- **Quick replies**: Default quick reply suggestions

### Creating a Custom Domain

You can create a new domain configuration by copying an existing one and customizing it:

```typescript
export const myCustomConfig: DomainConfig = {
  productName: 'product',
  productNamePlural: 'products',
  welcomeMessage: "Welcome! I'm here to help you find the perfect product.",
  inputPlaceholder: "What are you looking for?",
  viewDetailsButtonText: "View Details",
  recommendationCardFields: [
    {
      label: 'Price',
      key: 'price',
      format: (value) => `$${typeof value === 'number' ? value.toLocaleString() : value}`,
    },
    // Add more fields...
  ],
  detailPageFields: [
    // Define fields for detail page...
  ],
  defaultQuickReplies: [
    "Option 1",
    "Option 2",
    "Option 3"
  ],
};
```

The field configuration supports:
- **Labels**: Display names for fields
- **Keys**: Product object keys to read values from
- **Formatting**: Custom formatter functions
- **Conditions**: Optional functions to conditionally show fields

## API Integration

The application is structured to work with the backend API defined in `desktop/stanford/ldr/idss_new/idss/api`. Currently, it uses dummy data for demonstration purposes.

To connect to the real backend:

1. Set the `NEXT_PUBLIC_API_URL` environment variable to your backend URL
2. Update the API route handler in `src/app/api/chat/route.ts` to call the real backend instead of `dummyChatHandler`

## Demo Queries

The dummy handler responds to the following queries (case-insensitive):

- "toyota" or "camry" - Returns Toyota Camry recommendations
- "honda" or "cr-v" or "crv" - Returns Honda CR-V recommendations
- "suv" or "sport utility" - Returns multiple SUV options (demonstrates arrow navigation)
- "truck" or "pickup" - Returns multiple pickup truck options (demonstrates arrow navigation)
- "tesla" or "electric" or "ev" - Returns Tesla/electric vehicle recommendations
- "sedan" - Returns multiple sedan options (demonstrates arrow navigation)
- "bmw" or "luxury" - Returns BMW luxury vehicle recommendations
- "ford" or "f-150" or "f150" - Returns Ford F-150 recommendations
- "under 30000" or "under 30" - Returns vehicles under $30,000 (demonstrates arrow navigation)

## Design Notes

- **Colors**: Stanford Cardinal Red (#8C1515, #750013) and Gray (#8b959e)
- **Layout**: Simple header, scrollable chat area, fixed input at bottom
- **Recommendations**: Appear inline in chat messages with navigation arrows when multiple items are shown
- **Domain-Agnostic**: Product interface supports any product type - currently configured for vehicles but can work with fashion, electronics, etc.
- **No Filters/Favorites**: Intentionally simplified - these features are not yet implemented

## Future Enhancements

- Connect to real backend API
- Add filters functionality
- Add favorites/favorites page
- Enhanced product detail views
- User authentication
- Session persistence
