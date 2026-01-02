'use server';

import { createServerSupabaseClient } from '@/supabase/server';
import type { AdminLevel } from './admin-types';

export type AdminCheckResult = {
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  allocatedPlaceIds: string[];
  error?: string;
};

/**
 * Check admin permissions for a user
 * Returns authorization status and allocated places for sub-admins
 */
export async function checkAdminPermissions(userId: string): Promise<AdminCheckResult> {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('admin_level')
      .eq('uid', userId)
      .single();

    if (profileError || !userProfile) {
      return {
        isAuthorized: false,
        isSuperAdmin: false,
        isSubAdmin: false,
        allocatedPlaceIds: [],
        error: 'User profile not found',
      };
    }

    const adminLevel = userProfile.admin_level as AdminLevel;
    const isSuper = adminLevel === 'super_admin';
    const isSub = adminLevel === 'sub_admin';
    const isAuthorized = isSuper || isSub;

    // Load allocated places for sub-admins
    let allocatedPlaceIds: string[] = [];
    if (isSub) {
      const { data: allocations } = await supabase
        .from('place_allocations')
        .select('place_id')
        .eq('user_id', userId);
      allocatedPlaceIds = allocations?.map((a: any) => a.place_id) || [];
    }

    return {
      isAuthorized,
      isSuperAdmin: isSuper,
      isSubAdmin: isSub,
      allocatedPlaceIds,
    };
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return {
      isAuthorized: false,
      isSuperAdmin: false,
      isSubAdmin: false,
      allocatedPlaceIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user can manage a specific place
 */
export async function canManagePlace(userId: string, placeId: string): Promise<boolean> {
  const permissions = await checkAdminPermissions(userId);
  
  if (permissions.isSuperAdmin) {
    return true; // Super admin can manage all places
  }
  
  if (permissions.isSubAdmin) {
    return permissions.allocatedPlaceIds.includes(placeId);
  }
  
  return false;
}

/**
 * Get place ID for a location and check if user can manage it
 */
export async function canManageLocation(userId: string, locationId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: location, error } = await supabase
      .from('locations')
      .select('place_id')
      .eq('id', locationId)
      .single();
    
    if (error || !location?.place_id) {
      return false;
    }
    
    return await canManagePlace(userId, location.place_id);
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
}

/**
 * Get place ID for a map and check if user can manage it
 */
export async function canManageMap(userId: string, mapId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: map, error } = await supabase
      .from('maps')
      .select('place_id')
      .eq('id', mapId)
      .single();
    
    if (error || !map?.place_id) {
      return false;
    }
    
    return await canManagePlace(userId, map.place_id);
  } catch (error) {
    console.error('Error checking map permission:', error);
    return false;
  }
}

