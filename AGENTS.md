# Agent guide – IDSS Web

This file gives AI agents and contributors enough context to work effectively in this repo.

## What this project is

- **IDSS Web**: Chat-based UI for the Stanford LDR Lab Interactive Decision Support System.
- **Stack**: Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase (auth + favorites/cart).
- **Flow**: User chats with an assistant; the backend can return stacked recommendation cards (2D grid), quick replies, and optional bucket labels / diversification. Users can favorite items, add to cart, and open a detail sidebar. Location can be sent for personalized results.

## Multi-domain support

The app supports **multiple domains at once** (e.g. vehicles and PC parts). There is **no single “active” domain** to switch in config.

- **Domain detection per product**: Use `getDomainConfigForProduct(product)` from `@/config/domain-config` to get the right `DomainConfig` for a given item. Detection uses, in order:
  - `product.productType === 'vehicle'` → vehicle config
  - `product.productType === 'laptop' | 'book'` → generic config
  - `product.category` or `product.part_type` in the PC part set (gpu, cpu, motherboard, psu, storage, ram, cooling, case, etc.) → PC parts config
  - Presence of `make` / `model` / `mileage` → vehicle config
  - Otherwise → generic config
- **Cards and detail view**: `RecommendationCard` and `ProductDetailView` call `getDomainConfigForProduct(product)` so each card/detail uses the correct fields and labels for that item’s domain.
- **Combined defaults**: Use `getMultiDomainDefaults()` for:
  - Welcome message
  - Placeholder example queries (cycled in the input)
  - Default quick replies (combined and deduped across domains)
- **Adding a domain**: Add a new config (e.g. `DomainConfig`) in `src/config/domain-config.ts`, add its id to `DOMAIN_IDS` and `DOMAIN_CONFIG_MAP`, extend `getDomainConfigForProduct` and the list used inside `getMultiDomainDefaults()` (e.g. the `configs` array). If the backend sends a `category` or `productType` for the new domain, ensure the resolver maps it to the new config.

Do **not** introduce or rely on a single `currentDomainConfig`; the codebase has been refactored away from that.

## API and data flow

- **Chat**: `POST /api/chat` (Next.js route) proxies to the backend `POST /chat`. Request: `message`, optional `session_id`, `user_location`, `k` (mode: 0=Suggester, 1=Nudger, 2=Explorer).
- **Response shape**: See `ChatResponse` in `src/types/chat.ts`: `message`, `session_id`, optional `quick_replies`, `recommendations` (2D array of API items), `bucket_labels`, `diversification_dimension`.
- **Recommendations**: Backend returns a 2D array of items (any domain). They are converted with `convertAPIVehiclesToProducts()` in `src/utils/product-converter.ts`. The converter preserves `productType`, `category`, and `part_type` so `getDomainConfigForProduct` works. Types: `APIVehicle` (legacy vehicle shape) and `Product` / `UnifiedProduct` in `src/types/chat.ts`.
- **Product types**: `RecommendationCard` first dispatches on `product.productType`: `vehicle` → `VehicleCard`, `laptop` → `LaptopCard`, `book` → `BookCard`. Otherwise it uses the config returned by `getDomainConfigForProduct(product)` for the legacy/generic card (fields, subtitle, button text).

## Where to change things

| Goal | Location |
|------|----------|
| Domain-specific wording, card fields, detail fields | `src/config/domain-config.ts` |
| How API items become `Product` / domain detection inputs | `src/utils/product-converter.ts` |
| Domain detection logic | `getDomainConfigForProduct` in `src/config/domain-config.ts` |
| Main chat UI, welcome, sidebar | `src/app/page.tsx` |
| Input placeholder / combined suggestions | `ChatInput` uses `getMultiDomainDefaults().examplePlaceholderQueries` |
| Single card (generic/legacy path) | `src/components/RecommendationCard.tsx` |
| Detail sidebar fields | `src/components/ProductDetailView.tsx` |
| Chat API proxy | `src/app/api/chat/route.ts` |
| Types (Chat, Product, API) | `src/types/chat.ts` |

## Conventions

- **Product**: May be `UnifiedProduct` (with `productType`, `name`, `image.primary`, etc.) or a legacy shape with `title`, `image_url`, and domain-specific keys. Support both in components when reading title/image; use `getDomainConfigForProduct` for config-driven UI.
- **Tests**: Jest + React Testing Library. Supabase is mocked. RecommendationCard test mocks `getDomainConfigForProduct` from `@/config/domain-config`. Run: `npm test`; watch: `npm run test:watch`.
- **Lint**: `npm run lint`. Existing `<img>` usage is intentional in some components; prefer `next/image` for new images when appropriate.
- **Env**: Backend URL via `NEXT_PUBLIC_API_BASE_URL` (proxy) or `NEXT_PUBLIC_API_URL` (direct). Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Quick reference

- **Add a new domain**: New `DomainConfig` → add to `DOMAIN_CONFIG_MAP` and to the list in `getMultiDomainDefaults()` → extend `getDomainConfigForProduct` (and optionally `PC_PART_CATEGORIES` or equivalent for category-based detection).
- **Change card fields for a domain**: Edit that domain’s `recommendationCardFields` (and `recommendationCardSubtitleKey` if used) in `src/config/domain-config.ts`.
- **Change detail fields**: Edit that domain’s `detailPageFields` in the same file.
- **New API field for domain detection**: Ensure `product-converter` passes it through (e.g. `category`, `part_type`, `productType`), then use it in `getDomainConfigForProduct`.
