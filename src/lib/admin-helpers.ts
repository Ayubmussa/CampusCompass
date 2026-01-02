import type { AdminLevel, UserProfile } from './admin-types';

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(profile: UserProfile | null | undefined): boolean {
  return profile?.adminLevel === 'super_admin';
}

/**
 * Check if user is any type of admin (super or sub)
 */
export function isAdmin(profile: UserProfile | null | undefined): boolean {
  return profile?.adminLevel === 'super_admin' || profile?.adminLevel === 'sub_admin';
}

/**
 * Check if user is a sub admin
 */
export function isSubAdmin(profile: UserProfile | null | undefined): boolean {
  return profile?.adminLevel === 'sub_admin';
}

/**
 * Check if user can manage a specific place
 * Super admins can manage all places
 * Sub admins can only manage their allocated places
 */
export function canManagePlace(profile: UserProfile | null | undefined, placeId: string): boolean {
  if (!profile) return false;
  
  if (isSuperAdmin(profile)) {
    return true; // Super admin can manage all places
  }
  
  if (isSubAdmin(profile)) {
    return profile.allocatedPlaceIds?.includes(placeId) ?? false;
  }
  
  return false;
}

/**
 * Check if user can manage any place
 */
export function canManageAnyPlace(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  
  if (isSuperAdmin(profile)) {
    return true;
  }
  
  if (isSubAdmin(profile)) {
    return (profile.allocatedPlaceIds?.length ?? 0) > 0;
  }
  
  return false;
}

