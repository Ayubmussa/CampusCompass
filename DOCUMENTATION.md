# Virtuality - Complete Documentation

Comprehensive documentation for the Virtuality (Campus Compass) application covering frontend architecture, backend systems, database schema, API endpoints, and deployment.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Documentation](#frontend-documentation)
3. [Backend Documentation](#backend-documentation)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Authentication & Authorization](#authentication--authorization)
7. [AI Integration](#ai-integration)
8. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### System Architecture

Virtuality follows a modern full-stack architecture:

```
┌─────────────────────────────────────────────────┐
│              Next.js App Router                   │
│  ┌──────────────┐         ┌──────────────┐    │
│  │   Client      │         │   Server     │    │
│  │  Components   │◄───────►│  Components  │    │
│  └──────────────┘         └──────────────┘    │
│         │                          │            │
│         │                          │            │
│  ┌──────▼──────────┐      ┌───────▼─────────┐ │
│  │  Server Actions │      │  API Routes     │ │
│  └─────────────────┘      └─────────────────┘ │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────▼────────┐
         │   Supabase      │
         │  ┌──────────┐   │
         │  │ Postgres │   │
         │  │   RLS    │   │
         │  └──────────┘   │
         │  ┌──────────┐   │
         │  │  Storage │   │
         │  └──────────┘   │
         │  ┌──────────┐   │
         │  │   Auth   │   │
         │  └──────────┘   │
         └─────────────────┘
                  │
         ┌────────▼────────┐
         │  Google Genkit │
         │  (AI/ML)       │
         └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 15.3.3 with App Router
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React Hooks + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI/ML**: Genkit AI with Google Gemini 2.5 Flash

---

## Frontend Documentation

### Component Architecture

#### Page Components

**`src/app/page.tsx`** - Place Selection (Home)
- Entry point for authenticated users
- Displays available places
- Integrates AI chatbot for place queries
- Theme toggle and user controls

**`src/app/landing/page.tsx`** - Landing Page
- Public-facing landing page
- Only accessible to unauthenticated users
- Redirects authenticated users automatically
- Animated UI with glassmorphism

**`src/app/login/page.tsx`** - Login Page
- Email/password authentication
- Session expired message handling
- Animated background and glassmorphic design

**`src/app/admin/page.tsx`** - Admin Dashboard
- Admin-only access
- Analytics dashboard integration
- Content management navigation
- Theme support

**`src/app/locations/page.tsx`** - Locations Listing
- Browse all locations
- Search and filter functionality
- Category and tag filtering
- Animated UI

**`src/app/tours/page.tsx`** - Saved Tours
- User's saved tours
- Tour management
- AI-generated tour recommendations

### Core Components

#### Viewer Components

**`src/components/campus-tour.tsx`**
- Main tour viewer component
- Integrates 360° viewer and map viewer
- Location info sidebar
- AI chatbot integration
- Navigation controls

**`src/components/three-sixty-viewer.tsx`**
- 360° panoramic viewer using Photo Sphere Viewer
- Hotspot navigation
- Auto-rotate option
- Fullscreen support

**`src/components/map-viewer.tsx`**
- Multi-page map viewer
- Zoom and pan controls
- Keyboard navigation
- Fullscreen mode

#### Admin Components

**`src/components/admin-management-page.tsx`**
- Main admin interface
- Tabbed navigation for different content types
- Place, location, map, and collection management

**`src/components/location-admin-page.tsx`**
- Location CRUD operations
- Bulk operations
- Image upload to Supabase Storage

**`src/components/analytics-dashboard.tsx`**
- Comprehensive analytics visualization
- Time range filtering
- Place filtering
- Charts and graphs (Recharts)

#### UI Components

**`src/components/ui/*`**
- ShadCN UI component library
- Radix UI primitives
- Fully accessible components
- Theme-aware styling

### Custom Hooks

**`src/hooks/use-session-timeout.ts`**
- Manages 30-minute inactivity timeout
- Activity tracking
- Warning modal display
- Auto-logout functionality

**`src/hooks/use-activity-tracking.ts`**
- Tracks user activities
- Sends activity data to backend
- Supports various activity types

**`src/hooks/use-user.tsx`** (in `src/supabase/auth/`)
- User authentication state
- Profile data fetching
- Admin level checking

**`src/hooks/use-collection.tsx`** (in `src/supabase/db/`)
- Real-time data subscriptions
- Supabase collection queries
- Automatic re-rendering on data changes

### State Management

The application uses a combination of:
- **React Hooks**: `useState`, `useEffect`, `useMemo`, `useCallback`
- **Server Actions**: For mutations and server-side operations
- **Supabase Realtime**: For live data updates
- **Context API**: For theme and session management

### Routing

Next.js App Router structure:
```
/                    → Place selection (home)
/landing             → Landing page (public)
/login               → Login page
/admin               → Admin dashboard
/locations           → Locations listing
/tours               → Saved tours
/[place]/[location]  → Campus tour viewer
```

### Middleware

**`src/middleware.ts`**
- Authentication checks
- Route protection
- Session refresh
- Redirects for authenticated/unauthenticated users

---

## Backend Documentation

### Server Actions

**`src/app/actions.ts`** contains all server actions:

#### Tour Actions
- `getTourRecommendationsAction`: Generate AI-powered tour recommendations
- `saveTourAction`: Save a tour for a user
- `deleteTourAction`: Delete a saved tour

#### Location Actions
- `addLocationAction`: Create a new location
- `updateLocationAction`: Update location details
- `deleteLocationAction`: Delete a location
- `generateLocationDescriptionAction`: AI-generated descriptions

#### Review Actions
- `addReviewAction`: Create a review
- `updateReviewAction`: Update a review
- `deleteReviewAction`: Delete a review

#### Analytics Actions
- `trackActivityAction`: Track user activity
- `getLocationPopularityAction`: Get location popularity metrics
- `getReviewAnalyticsAction`: Get review statistics
- `getPlaceAnalyticsAction`: Get place-level analytics
- `getUserActivityStatsAction`: Get user activity statistics

#### AI Actions
- `answerLocationQuestionAction`: Answer location-specific questions
- `optimizeTourRouteAction`: Optimize tour routes

### API Routes

**`src/app/api/`** contains REST API endpoints:

#### Authentication
- `POST /api/auth/signup`: User registration
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout

#### Locations
- `GET /api/locations`: Get all locations
- `POST /api/actions/addLocation`: Create location
- `PUT /api/actions/updateLocation`: Update location
- `DELETE /api/actions/deleteLocation`: Delete location

#### Reviews
- `GET /api/reviews?location_id={id}`: Get reviews for a location
- `POST /api/actions/addReview`: Create review

#### Tours
- `GET /api/tours`: Get user's saved tours
- `POST /api/actions/saveTour`: Save tour
- `POST /api/actions/getTourRecommendations`: Get AI recommendations

### Supabase Integration

#### Client-Side (`src/supabase/client.ts`)
- Browser-based Supabase client
- Cookie-based authentication
- Real-time subscriptions

#### Server-Side (`src/supabase/server.ts`)
- Server-side Supabase client
- Secure server operations
- RLS policy enforcement

#### Hooks (`src/supabase/`)
- `useUser`: User authentication hook
- `useCollection`: Real-time data hook
- Custom hooks for specific data types

---

## Database Schema

### Core Tables

#### `places`
Stores campus/place information.
```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `locations`
Stores location/room information with metadata.
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rich_description TEXT,  -- AI-generated rich description
  panorama_url TEXT,
  thumbnail_url TEXT,
  coordinates JSONB,      -- {lat, lng, yaw, pitch}
  connections JSONB,     -- Array of connected location IDs
  tags TEXT[],
  category TEXT,
  opening_hours JSONB,   -- Opening hours data
  contact_info JSONB,    -- Contact information
  pricing_info JSONB,    -- Pricing details
  capacity INTEGER,
  related_links JSONB,   -- Related URLs
  video_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `location_images`
Stores additional images for locations.
```sql
CREATE TABLE location_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `maps`
Stores map pages for places.
```sql
CREATE TABLE maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `map_positions`
Stores position markers on maps.
```sql
CREATE TABLE map_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `collections`
Stores location collections.
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `users`
Extended user profiles.
```sql
CREATE TABLE users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  admin_level TEXT CHECK (admin_level IN ('user', 'sub_admin', 'super_admin')),
  assigned_place_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

#### `saved_tours`
User-saved tours.
```sql
CREATE TABLE saved_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location_ids UUID[],
  map_ids UUID[],
  view_mode TEXT CHECK (view_mode IN ('locations', 'maps', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reviews`
Location reviews.
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Analytics Tables

#### `user_activities`
Tracks user interactions.
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views and Materialized Views

#### `location_popularity`
Materialized view for location popularity metrics.
```sql
CREATE MATERIALIZED VIEW location_popularity AS
SELECT
  l.id as location_id,
  l.name as location_name,
  COUNT(DISTINCT ua.user_id) as unique_visitors,
  COUNT(ua.id) as total_views,
  COUNT(DISTINCT r.id) as total_reviews,
  AVG(r.rating) as avg_rating,
  COUNT(DISTINCT st.id) as times_in_tours
FROM locations l
LEFT JOIN user_activities ua ON ua.location_id = l.id
LEFT JOIN reviews r ON r.location_id = l.id
LEFT JOIN saved_tours st ON l.id = ANY(st.location_ids)
GROUP BY l.id, l.name;
```

#### `review_analytics`
View for review statistics.
```sql
CREATE VIEW review_analytics AS
SELECT
  location_id,
  COUNT(*) as total_reviews,
  AVG(rating) as avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM reviews
GROUP BY location_id;
```

#### `place_analytics`
View for place-level statistics.
```sql
CREATE VIEW place_analytics AS
SELECT
  p.id as place_id,
  p.name as place_name,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(DISTINCT m.id) as total_maps,
  COUNT(DISTINCT ua.user_id) as unique_visitors,
  COUNT(ua.id) as total_activities,
  COUNT(DISTINCT st.id) as total_tours,
  COUNT(DISTINCT r.id) as total_reviews,
  AVG(r.rating) as avg_rating
FROM places p
LEFT JOIN locations l ON l.place_id = p.id
LEFT JOIN maps m ON m.place_id = p.id
LEFT JOIN user_activities ua ON ua.place_id = p.id
LEFT JOIN reviews r ON r.location_id = l.id
LEFT JOIN saved_tours st ON EXISTS (
  SELECT 1
  FROM unnest(st.location_ids) AS loc_id
  INNER JOIN locations loc ON loc.id = loc_id::uuid
  WHERE loc.place_id = p.id
)
GROUP BY p.id, p.name;
```

### Row Level Security (RLS) Policies

#### Locations
- **Public Read**: Anyone can read locations
- **Admin Write**: Only admins can create/update/delete

#### Reviews
- **Public Read**: Anyone can read reviews
- **Authenticated Insert**: Only authenticated users can create
- **Owner Update/Delete**: Users can only modify their own reviews

#### Saved Tours
- **Owner Access**: Users can only access their own tours

#### User Activities
- **Authenticated Insert**: Users can track their own activities
- **Admin Read**: Admins can read all activities

### Indexes

Key indexes for performance:
- `locations(place_id)`
- `locations(category)`
- `reviews(location_id)`
- `user_activities(user_id, created_at)`
- `user_activities(location_id, created_at)`

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/logout`
Logout current user.

### Location Endpoints

#### GET `/api/locations`
Get all locations.

**Query Parameters:**
- `place_id` (optional): Filter by place
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags (comma-separated)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Location Name",
    "description": "...",
    "panorama_url": "...",
    ...
  }
]
```

### Review Endpoints

#### GET `/api/reviews?location_id={id}`
Get reviews for a location.

#### POST `/api/actions/addReview`
Create a new review.

**Request Body:**
```json
{
  "locationId": "uuid",
  "rating": 5,
  "comment": "Great location!",
  "userId": "uuid",
  "displayName": "John Doe"
}
```

### Tour Endpoints

#### GET `/api/tours`
Get user's saved tours (requires authentication).

#### POST `/api/actions/saveTour`
Save a tour.

**Request Body:**
```json
{
  "name": "My Tour",
  "description": "...",
  "locationIds": ["uuid1", "uuid2"],
  "userId": "uuid"
}
```

#### POST `/api/actions/getTourRecommendations`
Get AI-powered tour recommendations.

**Request Body:**
```json
{
  "interests": "I love libraries and study spaces"
}
```

---

## Authentication & Authorization

### User Roles

1. **Regular User** (`user`)
   - View locations and maps
   - Create and manage tours
   - Write reviews
   - Access saved tours

2. **Sub Admin** (`sub_admin`)
   - All user permissions
   - Manage content for assigned places
   - View analytics for assigned places

3. **Super Admin** (`super_admin`)
   - Full system access
   - Manage all places and content
   - Access all analytics
   - User management

### Authentication Flow

1. User visits landing page (unauthenticated)
2. Redirects to login page
3. After login, redirects to home (place selection)
4. Session managed via Supabase Auth cookies
5. Middleware validates session on each request

### Session Management

- **Timeout**: 30 minutes of inactivity
- **Warning**: Modal appears 5 minutes before timeout
- **Activity Tracking**: Mouse movements, clicks, keyboard input
- **Auto-logout**: Automatic logout on timeout

### Permission Checks

Server-side permission checks:
- `checkAdminPermissions()`: Check if user is admin
- `canManagePlace()`: Check if user can manage a place
- `canManageLocation()`: Check if user can manage a location
- `canManageMap()`: Check if user can manage a map

---

## AI Integration

### Genkit AI Setup

**`src/ai/genkit.ts`**
```typescript
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

### AI Flows

#### 1. Tour Recommendations (`generate-tour-recommendations.ts`)
Generates personalized tour recommendations based on user interests.

**Input:**
- User interests (text)
- Available locations
- Available maps

**Output:**
- Recommended location names
- Recommended map names
- Tour name and description

#### 2. Location Description Generation (`generate-location-description.ts`)
Generates rich descriptions for locations.

**Input:**
- Location name
- Basic description
- Category and tags

**Output:**
- Rich description (markdown)
- Suggested tags
- Suggested category

#### 3. Location Q&A (`answer-location-question.ts`)
Answers location-specific questions.

**Input:**
- Question
- Location context
- Available locations

**Output:**
- Answer
- Related locations
- Follow-up questions

#### 4. Tour Route Optimization (`optimize-tour-route.ts`)
Optimizes tour routes based on constraints.

**Input:**
- Selected locations
- Constraints (time, preferences, etc.)

**Output:**
- Optimized route order
- Estimated time
- Route description

### Error Handling

AI actions include robust error handling:
- API quota/rate limit detection
- User-friendly error messages
- Fallback behavior when AI is unavailable

---

## Deployment Guide

### Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_GENAI_API_KEY=your-google-ai-key
```

Optional:
```env
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### Supabase Setup

1. **Create Project**
   - Create new Supabase project
   - Note URL and anon key

2. **Storage Bucket**
   - Create bucket named `locations`
   - Set to public
   - Enable CORS if needed

3. **Database Migrations**
   - Run SQL migrations to create tables
   - Set up RLS policies
   - Create indexes
   - Create views and materialized views

4. **Authentication**
   - Enable email/password auth
   - Configure email templates (optional)

### Database Maintenance

**Refresh Materialized Views:**
```sql
REFRESH MATERIALIZED VIEW location_popularity;
```

**Update Statistics:**
Run analytics queries periodically or set up cron jobs.

### Monitoring

- Monitor Supabase usage (database, storage, auth)
- Monitor AI API usage (quota limits)
- Set up error tracking (Sentry, etc.)
- Monitor performance metrics

---

## Additional Resources

### Key Files Reference

- **Middleware**: `src/middleware.ts`
- **Server Actions**: `src/app/actions.ts`
- **Type Definitions**: `src/lib/*.ts`
- **AI Flows**: `src/ai/flows/*.ts`
- **Components**: `src/components/*.tsx`

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Genkit AI Documentation](https://firebase.google.com/docs/genkit)
- [ShadCN UI Documentation](https://ui.shadcn.com)
- [Photo Sphere Viewer](https://photo-sphere-viewer.js.org)

