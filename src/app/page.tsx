'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase';
import { Loader2 } from 'lucide-react';
import { CampusTour } from '@/components/campus-tour';
import { PlaceSelection } from '@/components/place-selection';
import { LocationSelection } from '@/components/location-selection';

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

    // If user is not authenticated, redirect to login
    if (!user) {
      router.replace('/login'); // prevent back to login after auth
      return;
    }
  }, [user, isLoading, router, mounted]);

  // Show loading while checking authentication
  if (!mounted || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
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
