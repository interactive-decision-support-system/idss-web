# IDSS Web

Chat-based UI for the Stanford LDR Lab **Interactive Decision Support System (IDSS)**. Built with **Next.js (App Router)**, **React**, and **TypeScript**, with in-chat (stacked) recommendation cards and a sidebar for favorites and item details.

## Features

- **Chat-first workflow**: user/assistant messages with auto-scroll.
- **Stacked recommendations**: assistant messages can include a **2D grid** of recommended items (rows = “buckets”), with:
  - optional `bucket_labels` per row
  - optional `diversification_dimension` header
  - per-row navigation when a row contains multiple items
- **Quick replies**: optional suggested reply buttons returned by the backend.
- **Favorites**: like/unlike items and view them in a sidebar; persisted in `localStorage`.
- **Detail sidebar**: click “View Details” to open a sidebar view; includes “View Listing” when `listing_url` is present.
- **Domain configuration**: switch between domains (e.g., vehicles vs PC parts) by editing `src/config/domain-config.ts`.
- **Stanford look & feel**: Cardinal Red + Gray palette; minimal, clean UI.

## Prerequisites

- **Node.js**: CI uses Node **22** (recommended). Node **18+** should work.
- **npm** (or equivalent)

## Setup

Install dependencies:

```bash
npm install
```

### Configure backend connectivity

This frontend expects a backend with a `POST /chat` endpoint.

Create `.env.local`:

```bash
# Used by the Next.js proxy route at /api/chat
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"

# Optional: if set, the frontend will call this directly (bypasses /api/chat proxy)
# NEXT_PUBLIC_API_URL="http://localhost:8000"
```

Notes:
- `src/app/api/chat/route.ts` proxies `POST /api/chat` → `${NEXT_PUBLIC_API_BASE_URL}/chat`.
- `src/services/api.ts` calls `${NEXT_PUBLIC_API_URL}/chat` when `NEXT_PUBLIC_API_URL` is set; otherwise it calls `/api/chat`.

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API contract (expected)

The app sends:
- `message` (string)
- `session_id` (string, optional; returned by the backend and re-sent on subsequent turns)

The proxy route (`/api/chat`) will also forward optional fields if the client includes them:
- `k`, `method`, `n_rows`, `n_per_row`

The UI supports responses shaped like `ChatResponse` in `src/types/chat.ts`, including:
- `message` (assistant text)
- `session_id`
- `quick_replies?: string[]`
- `recommendations?: APIVehicle[][]` (2D array)
- `bucket_labels?: string[]`
- `diversification_dimension?: string`

Vehicle recommendations are converted into the UI’s `Product` shape via `src/utils/product-converter.ts`.

## Domain configuration

`src/config/domain-config.ts` controls:
- wording (welcome message, placeholders, button text)
- which fields appear on recommendation cards and in the detail sidebar
- default quick replies

To switch domains, change:

```ts
export const currentDomainConfig: DomainConfig = vehicleConfig;
// or:
// export const currentDomainConfig: DomainConfig = pcPartsConfig;
```

## Project structure

```
src/
├── app/
│   ├── api/chat/route.ts          # Proxies chat requests to backend
│   ├── globals.css                # Global styles (Tailwind v4 + Stanford colors)
│   ├── layout.tsx                 # Root layout (+ Vercel Analytics)
│   └── page.tsx                   # Main chat UI + sidebar (favorites/details)
├── components/
│   ├── ChatInput.tsx              # Message input
│   ├── RecommendationCard.tsx     # Single card view for an item
│   ├── StackedRecommendationCards.tsx # Rows/buckets + per-row navigation
│   ├── FavoritesPage.tsx          # Favorites list sidebar
│   └── ProductDetailView.tsx      # Detail sidebar (+ listing link)
├── config/
│   ├── domain-config.ts           # Domain customization (vehicles/pc parts)
│   └── theme-config.ts            # Theme tokens (currently light theme default)
├── services/api.ts                # Frontend API client (direct or via proxy)
├── types/chat.ts                  # Chat/API/Product types
└── utils/product-converter.ts     # APIVehicle[][] → Product[][]
```

## Testing & linting

Run unit tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Lint:

```bash
npm run lint
```

CI runs `npm ci` + `npm test` on pushes/PRs to `main` (see `.github/workflows/unit-tests.yml`).

## Notes / known gaps

- The app includes a light/dark theme token file (`src/config/theme-config.ts`), but the current UI primarily uses explicit Tailwind classes.
- The “favorites” state is local to the browser (stored in `localStorage`), not synced to a backend.
