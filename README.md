# ogba

A full-stack, browser-based **Game Boy Advance emulator** with cloud save states. Load any `.gba` ROM and pick up where you left off from any device — no installation required.

![ogba screenshot](./src/assets/hero.png)

---

## Features

- **mGBA compiled to WebAssembly** — a fast, accurate native core (not a JS interpreter) running in a cross-origin-isolated worker, with local battery saves and auto-resume persisted to IndexedDB even before you sign in
- **Drag-and-drop ROM loading** — drop any `.gba` file onto the loader; the ROM title and game code are parsed directly from the binary header (offsets `0xA0`–`0xB0`)
- **Cloud save states** — 3 save slots per game, persisted to Supabase Postgres (metadata) + Supabase Storage (compressed state blobs), synced across devices
- **Google sign-in** — OAuth via Supabase Auth's redirect flow; row-level security scopes every save to its owner
- **Full keyboard controls** — arrows, Z/X (B/A), Enter (Start), Backspace (Select), Q/E (L/R)
- **Retro console shell UI** — the whole app is themed as a purple/black/white handheld, with on-screen D-pad, A/B, Select/Start, and L/R shoulder buttons built with the Pointer Events API (`setPointerCapture` for reliable input even when fingers drift); clickable with a mouse on desktop too, not just touch
- **Installable & offline** — a service worker precaches the app and the mGBA core, so repeat visits load instantly and games run without a connection (cloud saves need one)
- **Pause / resume** — pause overlay directly on the game canvas
- **Volume control** — mute toggle and slider, persisted across sessions
- **Responsive layout** — console shell centred beside a side panel on desktop; full-viewport portrait shell with a slide-up menu drawer (account, cartridge, audio, save states) on mobile

---

## Setup

Backend is [Supabase](https://supabase.com): Postgres (with row-level security) for save metadata, Storage for the compressed save-state blobs, and Auth (Google OAuth, redirect flow) for sign-in. There is no server code — the browser talks to Supabase directly via `@supabase/supabase-js`.

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor — creates the `saves` table + RLS policies and the private `save-states` storage bucket + its policies.
3. In **Authentication → Sign In / Providers**, enable Google and set up a Google OAuth client whose authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.
4. In **Authentication → URL Configuration**, set the Site URL and add redirect URLs for `http://localhost:5173` and your deployed domain(s).
5. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Project Settings → API). Set the same two variables on Vercel for deployment.

---
