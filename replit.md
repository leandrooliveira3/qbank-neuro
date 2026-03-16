# Neuro Portal | Portal Clínico

A clinical question bank and study portal built with React + Vite, Tailwind CSS, and Supabase.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: React Router v7
- **State**: Zustand
- **Backend/Auth/DB**: Supabase (hosted)
- **AI**: Google Gemini (`@google/genai`)
- **Build tool**: Vite 6
- **Package manager**: pnpm

## Running the app

```bash
pnpm install
pnpm run dev
```

The dev server runs on port **5000** (required for Replit preview).

## Environment variables

- `GEMINI_API_KEY` — Google Gemini API key (used for AI features)

Supabase credentials are hardcoded in `services/supabase.ts` (URL + anon key — this is the public-safe anon key, not a secret).

## Project structure

- `pages/` — Route-level page components
- `components/` — Shared UI components
- `services/` — Supabase client, AI, PDF, storage, sync utilities
- `store/` — Zustand state stores
- `supabase/` — Supabase schema/migrations

## Notes

- Migrated from Vercel to Replit (March 2026)
- Vite configured with `allowedHosts: true` for Replit proxy compatibility
