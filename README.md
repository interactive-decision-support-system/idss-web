# IDSS Web

Chat-based UI for the Stanford LDR Lab **Interactive Decision Support System (IDSS)**. Built with **Next.js (App Router)**, **React**, and **TypeScript**, with in-chat (stacked) recommendation cards and a sidebar for favorites and item details.

## Features

- **Chat-first workflow**: user/assistant messages with auto-scroll.
- **Mode selector (k)**: choose how many followup questions IDSS asks before giving recommendations (default **Explorer / k=2**). Three modes: **0 questions** (Suggester), **1 question** (Nudger), **2 questions** (Explorer). Mode buttons are frozen until recommendations are returned for the current turn.
- **Cycling placeholder**: the input placeholder cycles through domain-specific example queries (e.g. “What kind of vehicle are you looking for?”, “Show me SUVs under $35k”) with a slide-up animation. Configured via `examplePlaceholderQueries` in domain config.
- **Location-aware sessions (optional)**: a top alert asks for location permission; when enabled, the app sends `user_location` to the backend to tailor recommendations.
- **Stacked recommendations**: assistant messages can include a **2D grid** of recommended items (rows = “buckets”), with:
  - optional `bucket_labels` per row
  - optional `diversification_dimension` header
- each row renders up to **3 items side-by-side**, each with its own like button
- **Quick replies**: optional suggested reply buttons returned by the backend.
- **User auth**: sign in with Google or Facebook via Supabase Auth; sign out in the header.
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
NEXT_PUBLIC_API_BASE_URL="http://localhost:8001"

# Optional: call to a different API URL for only car recommendations
# NEXT_PUBLIC_API_URL="http://localhost:8000"

# Supabase Auth - from your project's Connect dialog or API Settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Auth (Google & Facebook sign-in)

1. Copy `.env.example` values for Supabase into `.env.local`, or get them from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api).
2. In Supabase Dashboard → **Authentication → URL Configuration**, add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (local dev)
   - `http://localhost:3000/auth/reset-password` (password reset, local)
   - `https://your-domain.com/auth/callback` (production)
   - `https://your-domain.com/auth/reset-password` (password reset, production)
3. **Google**: [Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers) — enable and add Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add `http://localhost:3000` to Authorized JavaScript origins and your Supabase callback URL to Authorized redirect URIs.
4. **Facebook**: [Authentication → Providers → Facebook](https://supabase.com/dashboard/project/_/auth/providers) — enable and add App ID + Secret from [Facebook Developers](https://developers.facebook.com). Add your Supabase callback URL to Valid OAuth Redirect URIs.

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
- `user_location` (object, optional; if the user grants browser geolocation permission)
  - `latitude` (number)
  - `longitude` (number)
  - `accuracy_m` (number, optional)
  - `captured_at` (ISO string, optional)
- `k` (number, optional; **mode** = number of questions asked before recommendations). UI mapping:
  - `0` → **Suggester**
  - `1` → **Nudger**
  - `2` → **Explorer** (default)

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
- wording (welcome message, input placeholder, button text)
- **Example placeholder queries** (`examplePlaceholderQueries`): optional list of strings cycled in the input placeholder (ChatGPT-style). If omitted, the single `inputPlaceholder` is used.
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
│   ├── auth/callback/route.ts    # OAuth callback (Google/Facebook)
│   ├── globals.css                # Global styles (Tailwind v4 + Stanford colors)
│   ├── layout.tsx                 # Root layout (+ Vercel Analytics)
│   └── page.tsx                   # Main chat UI + sidebar (favorites/details)
├── components/
│   ├── AuthButton.tsx              # Sign in (Google/Facebook) / sign out
│   ├── ChatInput.tsx               # Message input + followup-question mode buttons
│   ├── RecommendationCard.tsx     # Single card view for an item
│   ├── StackedRecommendationCards.tsx # Rows/buckets rendered as a 3-up grid
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
