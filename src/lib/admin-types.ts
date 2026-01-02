export type AdminLevel = 'super_admin' | 'sub_admin' | null;

export type UserProfile = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt: string;
  lastLogin: string;
  adminLevel?: AdminLevel;
  allocatedPlaceIds?: string[]; // For sub-admins: places they can manage
};

export type PlaceAllocation = {
  id: string;
  user_id: string;
  place_id: string;
  allocated_at: string;
  allocated_by?: string; // Super admin who allocated it
};

