# Virtuality

An immersive virtual tour application with 360° panoramas, interactive maps, AI-powered recommendations, and comprehensive analytics. Built with Next.js, React, TypeScript, and Supabase.

## 🎯 Overview

Virtuality provides a comprehensive virtual experience that allows users to:
- Explore locations through immersive 360° panoramic views
- Navigate using interactive map viewers
- Get AI-powered tour recommendations based on interests
- Read and write reviews for locations
- Access detailed analytics (for admins)
- Manage content through a powerful admin interface

## ✨ Key Features

### User Features
- **360° Panoramic Viewer**: Immersive panoramic experience
- **Interactive Map Viewer**: Multi-page map navigation with zoom, pan, and fullscreen
- **AI-Powered Tours**: Intelligent tour recommendations based on user interests
- **Reviews & Ratings**: User-generated content for locations
- **Location Discovery**: Search and filter locations by category, tags, and metadata
- **Session Management**: 30-minute inactivity timeout with warning modal
- **Dark Mode**: Full theme support with system preference detection

### Admin Features
- **Content Management**: CRUD operations for places, locations, maps, and collections
- **Media Management**: Upload and manage panoramas, thumbnails, and location images
- **Analytics Dashboard**: Comprehensive insights including:
  - Location popularity metrics
  - User activity tracking
  - Review analytics
  - Place-level statistics
- **AI Content Generation**: Auto-generate location descriptions using AI
- **Rich Metadata**: Opening hours, contact info, pricing, capacity, and more

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 (App Router)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Animations**: Motion (Framer Motion) 12.23.26
- **Forms**: React Hook Form 7.54.2 + Zod 3.24.2
- **Charts**: Recharts 2.15.1
- **360° Viewer**: Photo Sphere Viewer 5.14.0
- **Theme**: next-themes 0.4.6

### Backend
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI/ML**: Genkit AI with Google Gemini 2.5 Flash
- **API**: Next.js API Routes + Server Actions

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── actions.ts         # Server actions
│   ├── admin/             # Admin dashboard
│   ├── api/               # API route handlers
│   ├── landing/           # Landing page
│   ├── login/             # Login page
│   ├── locations/         # Locations listing
│   ├── tours/             # Saved tours
│   └── page.tsx           # Place selection (home)
├── components/            # React components
│   ├── ui/                # ShadCN UI components
│   ├── campus-tour.tsx    # Main tour viewer
│   ├── analytics-dashboard.tsx
│   ├── ai-tour-chatbot.tsx
│   └── ...
├── lib/                   # Utilities and types
│   ├── locations.ts       # Location types & helpers
│   ├── analytics.ts       # Analytics types
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── use-session-timeout.ts
│   ├── use-activity-tracking.ts
│   └── ...
├── supabase/             # Supabase integration
│   ├── client.ts         # Client-side Supabase
│   ├── server.ts         # Server-side Supabase
│   ├── auth/             # Auth hooks
│   └── db/               # Database hooks
├── ai/                   # AI flows
│   ├── flows/            # Genkit AI flows
│   └── genkit.ts         # AI configuration
└── middleware.ts         # Next.js middleware
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CampusCompass
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Create a public storage bucket named `locations`
   - Run the database migrations (see [Documentation](./DOCUMENTATION.md#database-setup))

4. **Configure environment variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GOOGLE_GENAI_API_KEY=your-google-ai-key
   NEXT_PUBLIC_ENABLE_REALTIME=true  # Optional
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:9002`

## 📚 Documentation

For comprehensive documentation covering:
- Frontend architecture and components
- Backend database schema and API
- Authentication and authorization
- AI flows and integrations
- Deployment guide

See [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔐 Authentication & Authorization

### User Roles
- **Regular User**: Can view locations, create tours, write reviews
- **Sub Admin**: Can manage content for assigned places
- **Super Admin**: Full system access

### Session Management
- 30-minute inactivity timeout
- Automatic logout with warning modal
- Session refresh on activity

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern glassmorphic UI elements
- **Animated Backgrounds**: Dynamic gradient backgrounds with floating particles
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation
- **Theme Support**: Light, dark, and system preference modes

## 📊 Analytics

The analytics system tracks:
- User activities (views, clicks, searches)
- Location popularity metrics
- Review statistics
- Place-level aggregations
- Time-based trends

## 🤖 AI Features

- **Tour Recommendations**: Generate personalized tours based on interests
- **Location Descriptions**: Auto-generate rich descriptions for locations
- **Q&A System**: Answer location-specific questions
- **Route Optimization**: Optimize tour routes based on constraints

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI dev server

### Code Style
- TypeScript strict mode
- ESLint for linting
- Prettier (if configured) for formatting

## 👥 Contributor

[Ayub Ahmed Mussa]

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Genkit AI Documentation](https://firebase.google.com/docs/genkit)
