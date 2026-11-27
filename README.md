<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# KH Travel

Travel itinerary planner built with React, Vite, and TypeScript. GPT features run through a server-side Vercel function; the OpenAI API key is never included in the browser bundle.

## Local development

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Add `OPENAI_API_KEY=...` to a local `.env.local` file (optional `OPENAI_MODEL=gpt-6-luna`).
3. Run the app and local AI route:
   `npm run dev`

## Deploy to Vercel

Add `OPENAI_API_KEY` as a server-side project environment variable in Vercel. `OPENAI_MODEL` can optionally override the default `gpt-6-luna` model. Do not use a `VITE_` prefix for these secrets.

## Data and AI

- GPT requests are sent through `/api/ai`; the OpenAI key stays on the server. Requests are capped at 20 per IP in a rolling 15-minute window per running function instance. This in-memory limit is a basic safeguard, not a shared account-wide quota.
- Pasted itinerary text is extracted into stops and appended to the current trip. Explicit dates and times are preserved; missing dates are assigned from today. Check imported details before relying on them.
- Weather forecasts come from Open-Meteo and appear only when the selected trip date falls in its forecast window. The app links to Open-Meteo for attribution. Forecasts are estimates, not live observations.
- Currency conversions use Frankfurter reference rates; the rate date is shown beside the budget tracker. The app falls back to bundled rates if the service is unavailable.
- By default, trip data remains in this browser's local storage. Optional shared cloud sync is documented below and needs a Supabase project.

## Optional shared cloud trips

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Vercel project environment. The publishable key is intended for the browser and relies on the included row-level security policies; never use a service-role key here.
3. Enable email sign-in in Supabase Auth and allow `https://khtravel3.vercel.app/` as a redirect URL.
4. Redeploy the Vercel project. Each person signs in by email link. The trip owner enables sync and sends a one-time invite link, valid for seven days.

Cloud writes use a version check. If both devices change the trip before syncing, the app asks which version to keep instead of silently overwriting one. Realtime updates require the `shared_trips` table to be enabled in the Supabase Realtime publication; the SQL script attempts to add it.
