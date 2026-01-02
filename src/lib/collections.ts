export type Collection = {
  id: string;
  place_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
};

export type CollectionLocation = {
  id: string;
  collection_id: string;
  location_id: string;
  display_order: number;
  created_at?: string;
};

export type CollectionWithLocations = Collection & {
  locations?: Array<{
    location_id: string;
    display_order: number;
  }>;
};

