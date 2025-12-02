# Campus Compass 360 - Requirements Breakdown

## 1. Introduction

This document outlines the functional and non-functional requirements for the "Campus Compass 360" application. The primary goal of this application is to provide an interactive, 360-degree virtual tour of a university campus, enhanced with AI-powered features, a map viewing mode, user-generated content, and an admin content management system. The platform uses Supabase for authentication, database, realtime (optional), and storage.

---

## 2. Functional Requirements

### 2.1. Core Tour Experience
- **FR-2.1.1:** The application must display a 360-degree panoramic image for various campus locations.
- **FR-2.1.2:** Users must be able to pan and zoom within the 360-degree viewer.
- **FR-2.1.3:** The viewer shall feature an auto-rotate capability, with adjustable speed settings.
- **FR-2.1.4:** The application shall display interactive "hotspots" within the panoramic view. Clicking a hotspot will navigate the user to the linked campus location.

### 2.1.a Map Viewing Mode
- **FR-2.1.a.1:** The application must provide a map viewing mode using static campus map images.
- **FR-2.1.a.2:** Users must be able to navigate between multiple map images (next/previous and via dots).
- **FR-2.1.a.3:** Users must be able to zoom and pan the map. Keyboard shortcuts: +/- for zoom, arrow keys for next/prev image.
- **FR-2.1.a.4:** Fullscreen mode must be supported for maps.
- **FR-2.1.a.5:** A mode switcher must toggle between 360 Viewer and Map Viewer.

### 2.2. Location Information & Interaction
- **FR-2.2.1:** Users must be able to view detailed information for each location, including its name and a description.
- **FR-2.2.2:** Information for a selected location shall be displayed in a non-obtrusive overlay or sheet.
- **FR-2.2.3:** The application must provide a text-to-speech (TTS) option to read location descriptions aloud. This feature should be toggleable.

### 2.3. AI-Powered Guided Tours
- **FR-2.3.1:** The application must feature an AI tool that generates personalized tour recommendations.
- **FR-2.3.2:** Users shall provide their interests as a text input (e.g., "architecture," "prospective computer science student").
- **FR-2.3.3:** The AI shall return a curated list of locations, a custom tour name, and a description based on the user's interests and the available locations.
- **FR-2.3.4:** Once a tour is generated, the user can follow it step-by-step through the main interface.

### 2.4. User Authentication & Profiles
- **FR-2.4.1:** The system shall support three types of users: Administrators, Standard Users, and Anonymous Users.
- **FR-2.4.2:** Users must be able to sign up or sign in using an email and password.
- **FR-2.4.3:** The system should allow exploration without an account; when signed in, additional features (reviews, saving tours) are enabled.
- **FR-2.4.4:** Upon login, the system shall redirect users based on their role:
    - Admins are redirected to the `/admin` page.
    - Standard and Anonymous users are redirected to the main tour page (`/`).
- **FR-2.4.5:** Authenticated (non-anonymous) users must be able to save AI-generated tours to their profile.
- **FR-2.4.6:** Authenticated users shall be able to view and restart their saved tours from the sidebar.

### 2.5. Reviews and Ratings System
- **FR-2.5.1:** Authenticated (non-anonymous) users must be able to submit a star rating (1-5) and a text comment for any campus location.
- **FR-2.5.2:** All users (including anonymous) must be able to view the reviews and average ratings for each location.
- **FR-2.5.3:** The review list should display the reviewer's name, their comment, the rating they gave, and the time of submission.

### 2.6. Administrative Content Management
- **FR-2.6.1:** The application must have a dedicated, secure admin page at the `/admin` route.
- **FR-2.6.2:** Only users with an `is_admin: true` flag in their Supabase `users` table profile can access the admin page. Unauthorized users attempting to access it must be redirected.
- **FR-2.6.3:** Administrators must be able to perform CRUD (Create, Read, Update, Delete) operations on campus locations.
- **FR-2.6.4:** Location management shall be handled through a form within a dialog/modal interface.

### 2.7. API Endpoints (for testing)
- **FR-2.7.1:** The system shall expose HTTP endpoints for Postman testing (App Router route handlers):
  - `POST /api/actions/getTourRecommendations`
  - `POST /api/actions/saveTour`
  - `POST /api/actions/addReview`
  - `POST /api/actions/addLocation`
  - `PUT /api/actions/updateLocation`
  - `DELETE /api/actions/deleteLocation`
  - `GET /api/locations`
  - `GET /api/reviews?location_id={id}`
  - `GET /api/tours` (requires auth)
  - `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`

---

## 3. Non-Functional Requirements

### 3.1. User Interface & Experience (UI/UX)
- **NFR-3.1.1:** The application must be fully responsive and functional on both desktop and mobile devices.
- **NFR-3.1.2:** The UI shall adhere to the defined style guide:
    - **Primary Color:** Soft blue (#64B5F6)
    - **Background Color:** Light gray (#F0F4F8)
    - **Accent Color:** Yellow-gold (#FFD54F)
    - **Fonts:** 'Poppins' for headlines, 'PT Sans' for body text.
- **NFR-3.1.3:** The interface should be clean, intuitive, and easy to navigate.
- **NFR-3.1.4:** The main interface will consist of a collapsible sidebar for navigation and controls, and a main content area for the 360° viewer.

### 3.2. Performance
- **NFR-3.2.1:** Initial page load times should be minimized by leveraging server-side rendering and code splitting.
- **NFR-3.2.2:** The 360° viewer must provide smooth panning and navigation.
- **NFR-3.2.3:** Database queries should be efficient, and real-time data fetching (where used) should not degrade UI performance.

### 3.3. Security
- **NFR-3.3.1:** Supabase Row Level Security (RLS) policies must enforce access control:
    - `locations`: Readable by all; inserts/updates/deletes only by admins.
    - `users`: A user can read/update only their own row; `is_admin` set by operators.
    - `saved_tours`: A user can CRUD only their own records.
    - `reviews`: Readable by all; inserts only by authenticated users.
- **NFR-3.3.2:** The `/admin` route and server actions must verify authentication via `supabase.auth.getUser()` and admin status via `users.is_admin`.

### 3.4. Technology Stack
- **NFR-3.4.1:** **Frontend:** Next.js (App Router), React, TypeScript.
- **NFR-3.4.2:** **Styling:** Tailwind CSS, ShadCN UI components.
- **NFR-3.4.3:** **Backend & Database:** Supabase (Auth, Postgres, Realtime [optional]).
- **NFR-3.4.4:** **Storage:** Supabase Storage for large media assets (e.g., 360° images, thumbnails).
- **NFR-3.4.5:** **Generative AI:** Genkit with a Google AI model.
