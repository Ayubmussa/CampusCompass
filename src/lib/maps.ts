export type Map = {
  id: string;
  place_id: string; // Foreign key to places table
  name: string; // e.g., "Basement Floor", "Ground Floor", "First Floor"
  description?: string;
  image_url: string; // URL to the map image
  page_number?: number; // Order/sequence of the map (1, 2, 3, etc.)
  created_at?: string;
  updated_at?: string;
};

