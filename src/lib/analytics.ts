export type ActivityType = 
  | 'location_view'
  | 'location_visit'
  | 'map_view'
  | 'tour_start'
  | 'tour_complete'
  | 'review_submit'
  | 'search_performed';

export type UserActivity = {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  location_id?: string;
  place_id?: string;
  map_id?: string;
  tour_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
};

export type LocationPopularity = {
  location_id: string;
  location_name: string;
  place_id: string;
  unique_visitors: number;
  total_views: number;
  avg_time_spent: number | null;
  total_reviews: number;
  avg_rating: number | null;
};

export type ReviewAnalytics = {
  location_id: string;
  location_name: string;
  place_id: string;
  total_reviews: number;
  avg_rating: number | null;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  first_review_date: string | null;
  last_review_date: string | null;
};

export type PlaceAnalytics = {
  place_id: string;
  place_name: string;
  total_locations: number;
  total_maps: number;
  unique_visitors: number;
  total_activities: number;
  total_tours: number;
  total_reviews: number;
  avg_rating: number | null;
};

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

