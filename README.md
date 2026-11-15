# Good Finds

A responsive, no-login marketplace built with React, Next.js App Router, TypeScript, Supabase Postgres, and Supabase Storage. Prepared for Vercel hosting.

## Publication status

The application, production build, five validation tests, and browser API-contract suite are complete. A dedicated Supabase project was requested after initial verification; its creation is awaiting selection of the `Personal Projects` organization. Vercel is not connected, so no public deployment URL exists yet. The initial verification resources described below remain isolated in Wall until the dedicated project is provisioned. Do not publish with the temporary project configuration.

## Features

- Create a listing with a photo, title, description, price, seller email, and category. Optional name and neighborhood plus a condition selector complete the listing.
- Direct image uploads to Supabase Storage (JPG, PNG, WebP; 8 MB maximum). Failed listing requests retain the uploaded image for retry.
- Browse all listings; filter by category, condition, and price; search keywords; sort by price or date; switch grid/list views.
- Each listing has a shareable detail page with its photo, full description, seller name, and a message form.
- Buyer messages are saved privately in Supabase. Email delivery is **not** enabled.
- Save favorite items in this browser without an account.
- Responsive layouts, keyboard focus states, reduced-motion support, error handling, and empty states.

## Run locally

Use Node.js 20.9 or newer.

```powershell
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
# Set both Supabase values in .env.local when using a new project.
npm run dev
```

Visit `http://localhost:3000`. This workspace already has an ignored `.env.local` connected to the active Supabase project. Do not overwrite it unless changing projects.

## Supabase setup

The workspace is configured for project `uuaydckpqxrtowyderuq` (Wall). The marketplace uses independent `marketplace_listings` and `marketplace_messages` tables and the `marketplace-images` bucket. Existing `posts` data is unchanged.

For a new Supabase project, run [`supabase/schema.sql`](supabase/schema.sql) once in its SQL editor, then set the project URL and **publishable** key in `.env.local`. Optional [`supabase/seed.sql`](supabase/seed.sql) adds eight clearly marked sample listings. Sample items are not for sale. Running the seed repeatedly adds duplicate samples.

The schema enables row-level security. Public visitors can read explicitly permitted listing columns and insert new listings and buyer messages. Seller emails are excluded from public column grants. Messages cannot be read by `anon` or `authenticated` roles. Visitors cannot edit or delete listings or overwrite uploaded photos. No service-role or secret key is used by this app.

Messages can be reviewed by the project owner in Supabase's Table Editor (`marketplace_messages`). `listing_id` connects each enquiry to its listing. This intentionally has no seller login or inbox.

The no-login publishing model permits anonymous submissions. A larger public launch should add moderation and persistent rate limiting. Price currency is USD. Sample photos and the hero use Unsplash; visitor uploads use Supabase Storage.

## Deploy to Vercel

1. Import this Next.js project into Vercel, or run `npx vercel` from this directory.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel for Production and Preview. Use the configured values from `.env.local`.
3. Deploy with `npx vercel --prod`, or trigger a production deployment from the Vercel dashboard. Redeploy after setting the public environment values because Next.js embeds them in the browser bundle.
4. Check the production domain in an anonymous browser session. Create a listing with a real photo, confirm it appears under its category, open its detail page, and submit a buyer message. Confirm the new rows and storage object in Supabase.

`vercel.json` selects the Next.js framework. Photos upload straight to Supabase instead of passing through Vercel's request-body limit.

## Validation

```powershell
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The browser tests require Playwright's Chromium (`npx playwright install chromium` if missing). They start isolated local Next.js and Supabase API substitute servers, then test category filtering, search, sorting, filters, views, saved items, image validation/upload, publishing, retry behavior, detail pages, buyer messaging, invalid requests, and mobile overflow. Screenshots and test logs go to ignored `artifacts/`. They do not alter the real database and do not claim live deployment verification.

Real Supabase checks confirmed anonymous message insertion, RLS, restricted seller email/message reads, and no security-advisor findings. The development environment blocks outbound requests from local processes, so direct local-to-Supabase HTTP and live image loading could not be verified there. No Vercel deployment URL has been issued; Vercel account access is required to finish publication.
