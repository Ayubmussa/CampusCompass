'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase';
import { Loader2 } from 'lucide-react';
import { CampusTour } from '@/components/campus-tour';
import { PlaceSelection } from '@/components/place-selection';
import { LocationSelection } from '@/components/location-selection';
import { motion } from 'motion/react';

export default function Home() {
  const { user, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const isLoading = isUserLoading || isProfileLoading;
  const placeId = searchParams.get('place');
  const locationId = searchParams.get('location');
  const view = searchParams.get('view');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading || !mounted) {
      return;
    }

    // If user is not authenticated, redirect to landing page
    if (!user) {
      router.replace('/landing'); // prevent back to landing after auth
      return;
    }
  }, [user, isLoading, router, mounted]);

  // Show loading while checking authentication or if user is not authenticated
  // Don't render any content until we're sure the user is authenticated
  if (!mounted || isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <Loader2 className="h-12 w-12 animate-spin z-10" />
      </div>
    );
  }

  // After loading completes, if no user, show loading (redirect will happen)
  // This prevents PlaceSelection from flashing
  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <Loader2 className="h-12 w-12 animate-spin z-10" />
      </div>
    );
  }

  // If no place is selected, show place selection page
  if (!placeId) {
    return <PlaceSelection />;
  }

  // Validate placeId is a valid UUID format (basic check)
  // UUID format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(placeId)) {
    // Invalid placeId format, redirect to place selection
    return <PlaceSelection />;
  }

  // If place is selected but no location, show location selection page
  // UNLESS view=map is specified, then show map view directly
  if (!locationId && view !== 'map') {
    return <LocationSelection />;
  }

  // If both place and location are selected, or view=map is specified, show the campus tour
  return <CampusTour placeId={placeId} initialLocationId={locationId} initialViewMode={view === 'map' ? 'maps' : 'locations'} />;
}
