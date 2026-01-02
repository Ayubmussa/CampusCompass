'use client';

import { useCallback } from 'react';
import { useUser } from '@/supabase';
import { trackActivityAction } from '@/app/actions';
import type { ActivityType } from '@/lib/analytics';

/**
 * Hook for tracking user activities
 * Automatically includes user ID and handles errors silently
 */
export function useActivityTracking() {
  const { user } = useUser();

  const trackActivity = useCallback(async (
    activityType: ActivityType,
    options?: {
      locationId?: string;
      placeId?: string;
      mapId?: string;
      tourId?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!user) return;

    try {
      await trackActivityAction({
        activityType,
        ...options,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Failed to track activity:', error);
    }
  }, [user]);

  return { trackActivity };
}

