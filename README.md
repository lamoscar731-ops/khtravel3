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

