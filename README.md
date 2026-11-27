# Fix It Fast — The Hostel Quarter

Hostel maintenance complaint & ticketing web app built with **React + TypeScript + Vite + Tailwind CSS + Framer Motion + Recharts + Three.js (`3dviz-pro-max`)**, featuring a monochrome **Obsidian / Frost** 3D Liquid Glass UI, an interactive **Hostel Quarter** 3D campus, and the **TicketOrb** complaint journey.

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

This repository is pre-configured for zero-config Vercel deployment via `vercel.json`:

1. Go to [vercel.com/new](https://vercel.com/new) and import **`Gautam369-web/fix-it-fast-hostel`**.
2. Keep the auto-detected settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy**. The app runs immediately in `local-demo` mode (persisting state in `localStorage`) and exposes `GET /api/health` to verify serverless readiness.

## Connecting a Database Later (Supabase / Neon / Vercel Postgres)

1. Provision a PostgreSQL database (Supabase, Neon, or Vercel Postgres) and run [`db/schema.sql`](./db/schema.sql) to create `users`, `tickets`, `timeline_events`, and `notifications`.
2. Add environment variables in **Vercel Project Settings → Environment Variables** (see [`.env.example`](./.env.example)):
   - `DATABASE_URL` (server-side functions in `api/`)
   - `VITE_STORAGE_MODE=api` or `supabase` (with `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`)
3. Wire your queries inside [`src/services/ticketRepository.ts`](./src/services/ticketRepository.ts) and [`api/`](./api/health.ts).
