
export type Hotspot = {
  pitch: number;
  yaw: number;
  target: string;
  text: string;
};

export type OpeningHours = {
  [key: string]: {
    open?: string; // Format: "HH:MM"
    close?: string; // Format: "HH:MM"
    closed?: boolean;
  };
};

export type ContactInfo = {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
};

export type LocationImage = {
  id: string;
  location_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Location = {
  id: string;
  name: string;
  description: string;
  richDescription?: string; // HTML/Markdown content
  panoramaUrl: string;
  thumbnailUrl: string;
  placeId?: string; // Reference to the place this location belongs to
  tags?: string[]; // Array of tags for filtering and search
  category?: string; // Category name (e.g., "Academic", "Dining")
  // Metadata
  openingHours?: OpeningHours;
  contactInfo?: ContactInfo;
  pricingInfo?: string;
  capacity?: number;
  relatedLinks?: string[];
  // Media
  videoUrl?: string;
  audioUrl?: string;
  images?: LocationImage[]; // Additional images (gallery)
  coordinates: {
    lat: number;
    lng: number;
  };
  connections: Hotspot[];
};
