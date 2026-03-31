# Frontend Fix Deploy Handoff

This branch contains frontend-safe cleanup for the public `idss-web.vercel.app` deployment.

## What changed in code

- Switched hard-coded public site references from `idss.vercel.app` to `idss-web.vercel.app`.
- Updated metadata, sitemap, and footer links to use the live frontend domain.
- Changed the OpenClaw skill route and connect page to stop advertising dead legacy backend hosts by default.
- Made the generated skill fail safely for eBay search when `NEXT_PUBLIC_API_BASE_URL` is not configured, instead of calling a stale backend URL.

## What still requires platform access

These steps cannot be completed from GitHub alone.

### Railway

1. Restore or redeploy the backend service.
2. Confirm the live backend URL.
3. Verify these endpoints respond successfully:
   - `GET /health`
   - `POST /chat`
   - any extra endpoints the frontend depends on, such as `/search/ebay`

### Vercel

1. Set the frontend environment variables for the `idss-web` project:
   - `NEXT_PUBLIC_API_BASE_URL=<live Railway backend URL>`
   - `NEXT_PUBLIC_MCP_BASE_URL=<live Railway backend URL>`
   - `NEXT_PUBLIC_SITE_URL=https://idss-web.vercel.app`
2. Redeploy the latest frontend build after the env vars are updated.

## Validation after deploy

1. Load `https://idss-web.vercel.app/`.
2. Send a message through the chat UI and confirm `/api/chat` succeeds.
3. Verify `/api/chat-text` succeeds.
4. Verify `/api/skill` serves the generated skill using the `idss-web.vercel.app` domain.
5. Verify eBay search only after `NEXT_PUBLIC_API_BASE_URL` is set to the restored backend.

## Known local limitation

This workspace does not currently have `node_modules` installed for `idss-web`, so local `npm run build` and Jest verification were not runnable here without first installing dependencies.
