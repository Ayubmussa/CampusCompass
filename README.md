# Campus Compass 360

Interactive campus tour with 360° panoramas and a map viewing mode. Uses Next.js (App Router), React, TypeScript, Tailwind + ShadCN, and Supabase (Auth, Postgres, Storage).

## Overview
Campus Compass 360 provides an immersive virtual campus experience:
- 360° panoramic viewer with hotspots for navigation between locations.
- Map viewing mode powered by static map images (zoom, pan, fullscreen).
- AI-powered tour recommendations based on user interests.
- Reviews and ratings for locations.
- Admin interface to manage locations and media.

The app uses Supabase for authentication, database (Postgres + RLS), and storage. Next.js App Router is used for a modern server/client component architecture with route handlers for API testing.

## Tech Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS, ShadCN UI
- Supabase (Auth, Postgres with RLS, Storage, optional Realtime)
- Photo Sphere Viewer: `@photo-sphere-viewer/core`

## Directory Structure
- `src/app/*`: Next.js routes (pages and API route handlers)
- `src/components/*`: UI and feature components (viewer, sidebar, forms)
- `src/supabase/*`: Supabase client/provider, server client, hooks
- `src/ai/*`: AI flow for tour recommendations
- `src/docs/*`: Requirements and backend schema/docs

## Features
- 360° Viewer:
  - Pan/zoom, optional auto-rotate, hotspots linking locations
- Map Viewer:
  - Multi-image navigation, zoom/pan, fullscreen, keyboard controls (+/- and arrows)
- Tours:
  - AI-generated tours saved per user
- Reviews:
  - Authenticated users can rate and comment; everyone can read
- Admin:
  - CRUD locations, upload panoramas and thumbnails to Supabase Storage

## Data Model (Supabase)
Tables:
- `users(uid, email, display_name, photo_url, is_admin, created_at, last_login)`
- `locations(id, name, description, panorama_url, thumbnail_url, coordinates jsonb, connections jsonb, created_at, updated_at)`
- `saved_tours(id, user_id, name, description, location_ids text[], created_at)`
- `reviews(id, location_id, user_id, display_name, rating, comment, created_at)`

RLS Policies (high level):
- `locations`: public read; only admins can write
- `users`: users can read/update their own row
- `saved_tours`: user can CRUD own tours
- `reviews`: public read; only authenticated users can insert and manage own rows

See `src/docs/backend.json` for detailed schema and policies.

## Environment Setup
1. Install deps
   - `npm install`
2. Supabase
   - Create a Supabase project and a public storage bucket named `locations`
   - Create tables/policies per `src/docs/backend.json` (or ask to generate SQL)
3. Environment variables
   - Create `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL=your-url`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
     - Optional: `NEXT_PUBLIC_ENABLE_REALTIME=false` to disable realtime subscriptions
4. Images config
   - `next.config.ts` already allows Supabase storage domains via `images.remotePatterns`

## Running Locally
- Dev server: `npm run dev`
- Default URL: `http://localhost:9002`

## API for Postman
Import `postman_collection.json`. Available endpoints:
- Auth
  - `POST /api/auth/signup` { email, password }
  - `POST /api/auth/login` { email, password }
  - `POST /api/auth/logout`
- Actions
  - `POST /api/actions/getTourRecommendations` { interests }
  - `POST /api/actions/saveTour` { name, description, locationIds, userId }
  - `POST /api/actions/addReview` { locationId, rating, comment, userId, displayName }
  - `POST /api/actions/addLocation` { name, description, panoramaUrl, thumbnailUrl, coordinates, connections }
  - `PUT /api/actions/updateLocation` { id, ...partial fields }
  - `DELETE /api/actions/deleteLocation` { locationId }
- Queries
  - `GET /api/locations`
  - `GET /api/reviews?location_id={id}`
  - `GET /api/tours` (requires auth)

## Development Notes
- Client vs Server:
  - Viewer components are client-only
  - Server actions use Supabase server client (`src/supabase/server.ts`)
- Auth:
  - On the client, use the provided `useUser` hook (`src/supabase/auth/use-user.tsx`)
  - On the server, authenticate with `supabase.auth.getUser()` (do not trust cookie-only values)
- Realtime:
  - Subscriptions are optional and fail-safe; disable via `NEXT_PUBLIC_ENABLE_REALTIME=false` if noisy or unnecessary

## Troubleshooting
- 360° CSS import error:
  - Ensure `@photo-sphere-viewer/core/index.css` is imported at the top of `src/app/globals.css`
- Images not loading:
  - Check `next.config.ts` `images.remotePatterns` includes your Supabase storage domain
  - Verify the file exists in the `locations` bucket and public access is enabled
- Admin actions failing:
  - Ensure your user row in `users` has `is_admin=true` and RLS policies are applied
- Auth not sticking after login:
  - The middleware syncs cookies; a page reload occurs after a successful login

## Project Docs
- Requirements: `src/docs/REQUIREMENTS.md`
- Backend schema/policies: `src/docs/backend.json`

