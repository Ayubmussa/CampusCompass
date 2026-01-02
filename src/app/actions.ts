'use server';

import { generateTourRecommendations } from '@/ai/flows/generate-tour-recommendations';
import { createServerSupabaseClient } from '@/supabase/server';
import type { Location } from '@/lib/locations';
import type { Map } from '@/lib/maps';
import { canManagePlace, canManageLocation, canManageMap, checkAdminPermissions } from '@/lib/server-admin-helpers';
import type { ActivityType, TimeRange, LocationPopularity, ReviewAnalytics, PlaceAnalytics } from '@/lib/analytics';

export interface TourRecommendationState {
  tourName?: string;
  tourDescription?: string;
  recommendations: {
    locationIds: string[];
    mapIds?: string[];
    viewMode?: 'locations' | 'maps' | 'both';
  } | null;
  error: string | null;
}

export async function getTourRecommendationsAction(
  prevState: TourRecommendationState, 
  formData: FormData
): Promise<TourRecommendationState> {
  const interests = formData.get('interests') as string;

  if (!interests || interests.trim().length < 5) {
    return {
      ...prevState,
      error: 'Please describe your interests in a few words.',
      recommendations: null,
    };
  }

  const supabase = await createServerSupabaseClient();

  try {
    // Fetch both locations and maps
    const [locationsResult, mapsResult] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('maps').select('*'),
    ]);

    if (locationsResult.error) throw locationsResult.error;
    if (mapsResult.error) throw mapsResult.error;

    const locations: Location[] = (locationsResult.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      panoramaUrl: item.panorama_url,
      thumbnailUrl: item.thumbnail_url,
      placeId: item.place_id,
      tags: item.tags || [],
      category: item.category || undefined,
      coordinates: item.coordinates,
      connections: item.connections || [],
    }));

    const maps: Map[] = (mapsResult.data || []).map((item: any) => ({
      id: item.id,
      place_id: item.place_id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      page_number: item.page_number,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
    
    // Format locations with tags and categories for AI
    const availableLocations = locations.map(loc => {
      let info = loc.name;
      if (loc.category) {
        info += ` (Category: ${loc.category})`;
      }
      if (loc.tags && loc.tags.length > 0) {
        info += ` [Tags: ${loc.tags.join(', ')}]`;
      }
      if (loc.description) {
        info += ` - ${loc.description}`;
      }
      return info;
    });
    const availableMaps = maps.map(map => map.name);

    const result = await generateTourRecommendations({ 
      interests, 
      availableLocations,
      availableMaps,
    });
    
    let recommendedLocationIds = result.recommendedLocations
        .map(name => locations.find(loc => loc.name === name)?.id)
        .filter((id): id is string => !!id);

    const recommendedMapIds = result.recommendedMaps
        ?.map(name => maps.find(map => map.name === name)?.id)
        .filter((id): id is string => !!id) || [];

    // Optional: Optimize route if we have multiple locations with coordinates
    if (recommendedLocationIds.length > 1) {
      try {
        const selectedLocations = recommendedLocationIds
          .map(id => {
            const loc = locations.find(l => l.id === id);
            return loc ? {
              id: loc.id,
              name: loc.name,
              coordinates: loc.coordinates,
              category: loc.category,
              estimatedTime: 5, // Default 5 minutes per location
            } : null;
          })
          .filter((loc): loc is NonNullable<typeof loc> => loc !== null);

        if (selectedLocations.length > 1) {
          try {
            const optimizationResult = await optimizeTourRoute({
              selectedLocations,
              userInterests: interests,
              constraints: {
                timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                          new Date().getHours() < 17 ? 'afternoon' : 
                          new Date().getHours() < 21 ? 'evening' : 'night',
              },
            });

            // Use optimized route order
            recommendedLocationIds = optimizationResult.optimizedRoute;
          } catch (error) {
            // Silently fail optimization - use original order
            console.error('Route optimization failed, using original order:', error);
          }
        }
      } catch (error) {
        // Silently fail optimization - use original order
        console.error('Route optimization failed, using original order:', error);
      }
    }

    // Determine view mode based on recommendations
    let viewMode: 'locations' | 'maps' | 'both' = 'locations';
    if (recommendedMapIds.length > 0 && recommendedLocationIds.length > 0) {
      viewMode = 'both';
    } else if (recommendedMapIds.length > 0) {
      viewMode = 'maps';
    }

    return {
      tourName: result.tourName,
      tourDescription: result.tourDescription,
      recommendations: {
        locationIds: recommendedLocationIds,
        mapIds: recommendedMapIds,
        viewMode,
      },
      error: null,
    };
  } catch (error) {
    console.error('AI Error:', error);
    return {
      ...prevState,
      error: 'Sorry, we couldn\'t generate recommendations at this time. Please try again later.',
      recommendations: null,
    };
  }
}

export async function saveTourAction(tourData: {
  name: string;
  description: string;
  locationIds: string[];
  userId: string;
}) {
  const supabase = await createServerSupabaseClient();
  try {
    // Verify authentication and user ID matches
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "You must be logged in to save tours." };
    }
    
    if (user.id !== tourData.userId) {
      return { success: false, error: "User ID mismatch. Cannot save tour." };
    }

    const { error } = await supabase
      .from('saved_tours')
      .insert({
        user_id: user.id, // Use authenticated user ID, not the one from client
        name: tourData.name,
        description: tourData.description,
        location_ids: tourData.locationIds,
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error saving tour: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to save tour. ${errorMessage}` };
  }
}

export async function deleteTourAction(tourId: string) {
  const supabase = await createServerSupabaseClient();
  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "You must be logged in to delete tours." };
    }

    // Verify the tour belongs to the user
    const { data: tour, error: fetchError } = await supabase
      .from('saved_tours')
      .select('user_id')
      .eq('id', tourId)
      .single();

    if (fetchError || !tour) {
      return { success: false, error: "Tour not found." };
    }

    if (tour.user_id !== user.id) {
      return { success: false, error: "You can only delete your own tours." };
    }

    const { error } = await supabase
      .from('saved_tours')
      .delete()
      .eq('id', tourId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting tour: ", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to delete tour. ${errorMessage}` };
  }
}

export async function addReviewAction(reviewData: {
    locationId: string;
    rating: number;
    comment: string;
    userId: string;
    displayName: string;
}) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and user ID matches
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to add reviews." };
        }
        
        if (user.id !== reviewData.userId) {
            return { success: false, error: "User ID mismatch. Cannot add review." };
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                location_id: reviewData.locationId,
                user_id: user.id, // Use authenticated user ID, not the one from client
                rating: reviewData.rating,
                comment: reviewData.comment,
                display_name: reviewData.displayName,
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error adding review: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to add review. ${errorMessage}` };
    }
}

// Admin actions for locations
export async function addLocationAction(locationData: Omit<Location, 'id'>) {
    try {
        const supabase = await createServerSupabaseClient();
        
        // Check authentication - getUser() verifies with Supabase Auth server
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.error("Auth error:", authError);
            return { success: false, error: `Authentication error: ${authError.message}` };
        }
        
        if (!user) {
            console.error("No authenticated user found");
            return { success: false, error: "You must be logged in to add locations. Please refresh the page and try again." };
        }

        if (!locationData.placeId) {
            return { success: false, error: "Place is required. Please select a place for this location." };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, locationData.placeId);
        if (!canManage) {
            console.error("User cannot manage this place");
            return { success: false, error: "You do not have permission to add locations to this place." };
        }

        console.log('Adding location with data:', {
            name: locationData.name,
            description: locationData.description,
            panorama_url: locationData.panoramaUrl,
            thumbnail_url: locationData.thumbnailUrl,
            coordinates: locationData.coordinates,
            connections: locationData.connections,
            userId: user.id,
        });

        const { data: insertedData, error } = await supabase
            .from('locations')
            .insert({
                name: locationData.name,
                description: locationData.description,
                rich_description: locationData.richDescription || null,
                place_id: locationData.placeId,
                panorama_url: locationData.panoramaUrl,
                thumbnail_url: locationData.thumbnailUrl,
                category: locationData.category || null,
                tags: locationData.tags || [],
                opening_hours: locationData.openingHours || null,
                contact_info: locationData.contactInfo || null,
                pricing_info: locationData.pricingInfo || null,
                capacity: locationData.capacity || null,
                related_links: locationData.relatedLinks || [],
                video_url: locationData.videoUrl || null,
                audio_url: locationData.audioUrl || null,
                coordinates: locationData.coordinates,
                connections: locationData.connections || [],
            })
            .select(); // Return the inserted data

        if (error) {
            console.error("Supabase error adding location:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
            throw error;
        }

        console.log("Successfully inserted location:", insertedData);
        return { success: true, data: insertedData };
    } catch (error) {
        console.error("Error adding location: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to add location: ${errorMessage}` };
    }
}

export async function updateLocationAction(locationData: Partial<Location> & { id: string }) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to update locations." };
        }
        
        // Verify user can manage this location's place
        const canManage = await canManageLocation(user.id, locationData.id);
        if (!canManage) {
            return { success: false, error: "You do not have permission to update this location." };
        }

        const updateData: any = {};
        if (locationData.name) updateData.name = locationData.name;
        if (locationData.description) updateData.description = locationData.description;
        if (locationData.richDescription !== undefined) updateData.rich_description = locationData.richDescription || null;
        if (locationData.placeId) updateData.place_id = locationData.placeId;
        if (locationData.panoramaUrl) updateData.panorama_url = locationData.panoramaUrl;
        if (locationData.thumbnailUrl) updateData.thumbnail_url = locationData.thumbnailUrl;
        if (locationData.category !== undefined) updateData.category = locationData.category || null;
        if (locationData.tags !== undefined) updateData.tags = locationData.tags || [];
        if (locationData.openingHours !== undefined) updateData.opening_hours = locationData.openingHours || null;
        if (locationData.contactInfo !== undefined) updateData.contact_info = locationData.contactInfo || null;
        if (locationData.pricingInfo !== undefined) updateData.pricing_info = locationData.pricingInfo || null;
        if (locationData.capacity !== undefined) updateData.capacity = locationData.capacity || null;
        if (locationData.relatedLinks !== undefined) updateData.related_links = locationData.relatedLinks || [];
        if (locationData.videoUrl !== undefined) updateData.video_url = locationData.videoUrl || null;
        if (locationData.audioUrl !== undefined) updateData.audio_url = locationData.audioUrl || null;
        if (locationData.coordinates) updateData.coordinates = locationData.coordinates;
        if (locationData.connections) updateData.connections = locationData.connections;
        
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('locations')
            .update(updateData)
            .eq('id', locationData.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error updating location: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update location: ${errorMessage}` };
    }
}

export async function deleteLocationAction(locationId: string) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to delete locations." };
        }
        
        // Verify user can manage this location's place
        const canManage = await canManageLocation(user.id, locationId);
        if (!canManage) {
            return { success: false, error: "You do not have permission to delete this location." };
        }

        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', locationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting location: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to delete location: ${errorMessage}` };
    }
}

// Place management actions
export async function addPlaceAction(placeData: {
  name: string;
  description: string;
  thumbnailUrl: string;
}) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be logged in to add places." };
        }

        // Only super admins can add places
        const permissions = await checkAdminPermissions(user.id);
        if (!permissions.isSuperAdmin) {
            return { success: false, error: "Only super admins can add places." };
        }

        const now = new Date().toISOString();

        const { data: insertedData, error } = await supabase
            .from('places')
            .insert({
                name: placeData.name,
                description: placeData.description,
                thumbnail_url: placeData.thumbnailUrl,
                // Satisfy NOT NULL constraints if the columns don't have defaults
                created_at: now,
                updated_at: now,
            })
            .select();

        if (error) throw error;
        return { success: true, data: insertedData };
    } catch (error) {
        console.error("Error adding place: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to add place: ${errorMessage}` };
    }
}

export async function updatePlaceAction(placeData: {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
}) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to update places." };
        }
        
        // Only super admins can update places
        const permissions = await checkAdminPermissions(user.id);
        if (!permissions.isSuperAdmin) {
            return { success: false, error: "Only super admins can update places." };
        }

        const { error } = await supabase
            .from('places')
            .update({
                name: placeData.name,
                description: placeData.description,
                thumbnail_url: placeData.thumbnailUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', placeData.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error updating place: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update place: ${errorMessage}` };
    }
}

export async function deletePlaceAction(placeId: string) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to delete places." };
        }
        
        // Only super admins can delete places
        const permissions = await checkAdminPermissions(user.id);
        if (!permissions.isSuperAdmin) {
            return { success: false, error: "Only super admins can delete places." };
        }

        const { error } = await supabase
            .from('places')
            .delete()
            .eq('id', placeId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting place: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to delete place: ${errorMessage}` };
    }
}

// Map management actions
export async function addMapAction(mapData: {
  name: string;
  description?: string;
  image_url: string;
  page_number: number;
  place_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to add maps." };
        }

        if (!mapData.place_id) {
            return { success: false, error: "Place is required. Please select a place for this map." };
        }
        
        // Verify user can manage this place
        if (!mapData.place_id) {
            return { success: false, error: "Place is required. Please select a place for this map." };
        }

        const canManage = await canManagePlace(user.id, mapData.place_id);
        if (!canManage) {
            return { success: false, error: "You do not have permission to add maps to this place." };
        }

        const { data: insertedData, error } = await supabase
            .from('maps')
            .insert({
                name: mapData.name,
                description: mapData.description,
                image_url: mapData.image_url,
                page_number: mapData.page_number,
                place_id: mapData.place_id,
            })
            .select();

        if (error) throw error;
        return { success: true, data: insertedData };
    } catch (error) {
        console.error("Error adding map: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to add map: ${errorMessage}` };
    }
}

export async function updateMapAction(mapData: {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  page_number: number;
  place_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to update maps." };
        }
        
        // Verify user can manage this map's place
        const canManage = await canManageMap(user.id, mapData.id);
        if (!canManage) {
            return { success: false, error: "You do not have permission to update this map." };
        }

        const { error } = await supabase
            .from('maps')
            .update({
                name: mapData.name,
                description: mapData.description,
                image_url: mapData.image_url,
                page_number: mapData.page_number,
                place_id: mapData.place_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', mapData.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error updating map: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update map: ${errorMessage}` };
    }
}

export async function deleteMapAction(mapId: string) {
    const supabase = await createServerSupabaseClient();
    try {
        // Verify authentication and admin status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in to delete maps." };
        }
        
        // Verify user can manage this map's place
        const canManage = await canManageMap(user.id, mapId);
        if (!canManage) {
            return { success: false, error: "You do not have permission to delete this map." };
        }

        const { error } = await supabase
            .from('maps')
            .delete()
            .eq('id', mapId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting map: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to delete map: ${errorMessage}` };
    }
}

// Admin Management Actions
export async function updateAdminLevelAction(userId: string, adminLevel: 'super_admin' | 'sub_admin' | null) {
    const supabase = await createServerSupabaseClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in." };
        }
        
        // Only super admins can update admin levels
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('admin_level')
            .eq('uid', user.id)
            .single();

        if (profileError || userProfile?.admin_level !== 'super_admin') {
            return { success: false, error: "Only super admins can update admin levels." };
        }

        const { error } = await supabase
            .from('users')
            .update({ admin_level: adminLevel })
            .eq('uid', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error updating admin level: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update admin level: ${errorMessage}` };
    }
}

export async function assignPlaceToSubAdminAction(userId: string, placeId: string) {
    const supabase = await createServerSupabaseClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in." };
        }
        
        // Only super admins can assign places
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('admin_level')
            .eq('uid', user.id)
            .single();

        if (profileError || userProfile?.admin_level !== 'super_admin') {
            return { success: false, error: "Only super admins can assign places." };
        }

        // Check if user is a sub-admin
        const { data: targetUser } = await supabase
            .from('users')
            .select('admin_level')
            .eq('uid', userId)
            .single();

        if (targetUser?.admin_level !== 'sub_admin') {
            return { success: false, error: "Can only assign places to sub-admins." };
        }

        // Check if already allocated
        const { data: existing } = await supabase
            .from('place_allocations')
            .select('id')
            .eq('user_id', userId)
            .eq('place_id', placeId)
            .single();

        if (existing) {
            return { success: false, error: "Place is already allocated to this sub-admin." };
        }

        const { error } = await supabase
            .from('place_allocations')
            .insert({
                user_id: userId,
                place_id: placeId,
                allocated_by: user.id,
                allocated_at: new Date().toISOString(),
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error assigning place: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to assign place: ${errorMessage}` };
    }
}

export async function removePlaceFromSubAdminAction(userId: string, placeId: string) {
    const supabase = await createServerSupabaseClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: "You must be logged in." };
        }
        
        // Only super admins can remove place allocations
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('admin_level')
            .eq('uid', user.id)
            .single();

        if (profileError || userProfile?.admin_level !== 'super_admin') {
            return { success: false, error: "Only super admins can remove place allocations." };
        }

        const { error } = await supabase
            .from('place_allocations')
            .delete()
            .eq('user_id', userId)
            .eq('place_id', placeId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error removing place allocation: ", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to remove place allocation: ${errorMessage}` };
    }
}

export type SearchFilters = {
    query: string;
    category: string;
    tags: string[];
    minRating: number;
    placeId?: string;
};

export async function searchLocationsAction(filters: SearchFilters) {
    try {
        const supabase = await createServerSupabaseClient();
        
        // First, get all locations with reviews for rating calculation
        let query = supabase
            .from('locations')
            .select('*, reviews(rating)')
            .order('name', { ascending: true });

        // Filter by place if specified
        if (filters.placeId) {
            query = query.eq('place_id', filters.placeId);
        }

        // Full-text search on name and description
        if (filters.query.trim()) {
            const searchTerm = filters.query.trim();
            // Use PostgreSQL ilike for case-insensitive search
            query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        // Filter by category
        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        // Filter by tags (any of the tags) - tags is an array column
        if (filters.tags.length > 0) {
            // Use overlap operator to check if any tag matches
            query = query.overlaps('tags', filters.tags);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Search error:', error);
            throw error;
        }

        // Filter by minimum rating (calculate average rating per location)
        let filteredData = data || [];
        
        if (filters.minRating > 0) {
            filteredData = filteredData.filter((location: any) => {
                if (!location.reviews || !Array.isArray(location.reviews) || location.reviews.length === 0) {
                    return false; // No reviews means rating is 0
                }
                
                const reviews = location.reviews;
                const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
                const avgRating = totalRating / reviews.length;
                
                return avgRating >= filters.minRating;
            });
        }

        // Map to Location type
        const locations: Location[] = filteredData.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            panoramaUrl: item.panorama_url || '',
            thumbnailUrl: item.thumbnail_url || '',
            placeId: item.place_id,
            tags: item.tags || [],
            category: item.category || undefined,
            coordinates: item.coordinates || { lat: 0, lng: 0 },
            connections: item.connections || [],
        }));

        return { success: true, data: locations };
    } catch (error) {
        console.error('Error searching locations:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to search locations: ${errorMessage}`, data: [] };
    }
}

// Analytics Actions
export async function trackActivityAction(activity: {
    activityType: ActivityType;
    locationId?: string;
    placeId?: string;
    mapId?: string;
    tourId?: string;
    metadata?: Record<string, any>;
}) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabase
            .from('user_activities')
            .insert({
                user_id: user.id,
                activity_type: activity.activityType,
                location_id: activity.locationId || null,
                place_id: activity.placeId || null,
                map_id: activity.mapId || null,
                tour_id: activity.tourId || null,
                metadata: activity.metadata || {},
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error tracking activity:', error);
        return { success: false, error: 'Failed to track activity' };
    }
}

export async function getLocationPopularityAction(placeId?: string, timeRange: TimeRange = '30d'): Promise<{
    success: boolean;
    data?: LocationPopularity[];
    error?: string;
}> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0);
        }

        let query = supabase
            .from('location_popularity')
            .select('*')
            .order('total_views', { ascending: false });

        if (placeId) {
            query = query.eq('place_id', placeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by time range if needed (for now, we'll use the materialized view)
        // In production, you might want to refresh the view or query user_activities directly
        return { success: true, data: data as LocationPopularity[] };
    } catch (error) {
        console.error('Error fetching location popularity:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to fetch location popularity: ${errorMessage}` };
    }
}

export async function getReviewAnalyticsAction(placeId?: string): Promise<{
    success: boolean;
    data?: ReviewAnalytics[];
    error?: string;
}> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        let query = supabase
            .from('review_analytics')
            .select('*')
            .order('total_reviews', { ascending: false });

        if (placeId) {
            query = query.eq('place_id', placeId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data as ReviewAnalytics[] };
    } catch (error) {
        console.error('Error fetching review analytics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to fetch review analytics: ${errorMessage}` };
    }
}

export async function getPlaceAnalyticsAction(placeId?: string): Promise<{
    success: boolean;
    data?: PlaceAnalytics[];
    error?: string;
}> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        let query = supabase
            .from('place_analytics')
            .select('*')
            .order('total_activities', { ascending: false });

        if (placeId) {
            query = query.eq('place_id', placeId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data as PlaceAnalytics[] };
    } catch (error) {
        console.error('Error fetching place analytics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to fetch place analytics: ${errorMessage}` };
    }
}

export async function getUserActivityStatsAction(timeRange: TimeRange = '30d'): Promise<{
    success: boolean;
    data?: {
        totalActivities: number;
        locationViews: number;
        mapViews: number;
        toursStarted: number;
        toursCompleted: number;
        reviewsSubmitted: number;
        searchesPerformed: number;
        activitiesByDay: Array<{ date: string; count: number }>;
    };
    error?: string;
}> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0);
        }

        const { data: activities, error } = await supabase
            .from('user_activities')
            .select('activity_type, created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        const stats = {
            totalActivities: activities?.length || 0,
            locationViews: activities?.filter(a => a.activity_type === 'location_view').length || 0,
            mapViews: activities?.filter(a => a.activity_type === 'map_view').length || 0,
            toursStarted: activities?.filter(a => a.activity_type === 'tour_start').length || 0,
            toursCompleted: activities?.filter(a => a.activity_type === 'tour_complete').length || 0,
            reviewsSubmitted: activities?.filter(a => a.activity_type === 'review_submit').length || 0,
            searchesPerformed: activities?.filter(a => a.activity_type === 'search_performed').length || 0,
            activitiesByDay: [] as Array<{ date: string; count: number }>,
        };

        // Group by day
        const dayMap = new Map<string, number>();
        activities?.forEach(activity => {
            const date = new Date(activity.created_at).toISOString().split('T')[0];
            dayMap.set(date, (dayMap.get(date) || 0) + 1);
        });
        stats.activitiesByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error fetching user activity stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to fetch activity stats: ${errorMessage}` };
    }
}

// AI Enhancement Actions
import { generateLocationDescription } from '@/ai/flows/generate-location-description';
import { answerLocationQuestion } from '@/ai/flows/answer-location-question';
import { optimizeTourRoute } from '@/ai/flows/optimize-tour-route';

export async function generateLocationDescriptionAction(locationData: {
    name: string;
    existingDescription?: string;
    category?: string;
    tags?: string[];
    imageUrl?: string;
}) {
    try {
        const result = await generateLocationDescription(locationData);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error generating location description:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check for quota/rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return { 
                success: false, 
                error: 'AI service is currently unavailable due to rate limits. Please try again later or contact support if this persists.' 
            };
        }
        
        return { success: false, error: `Failed to generate description: ${errorMessage}` };
    }
}

export async function answerLocationQuestionAction(questionData: {
    question: string;
    locationContext?: {
        name: string;
        description?: string;
        category?: string;
        tags?: string[];
        openingHours?: Record<string, any>;
        contactInfo?: Record<string, any>;
        pricingInfo?: string;
    };
    availableLocations?: string[];
    availablePlaces?: string[];
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
    try {
        const result = await answerLocationQuestion(questionData);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error answering question:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check for quota/rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return { 
                success: false, 
                error: 'AI service is currently unavailable due to rate limits. Please try again later or contact support if this persists.' 
            };
        }
        
        return { success: false, error: `Failed to answer question: ${errorMessage}` };
    }
}

export async function optimizeTourRouteAction(optimizationData: {
    selectedLocations: Array<{
        id: string;
        name: string;
        coordinates?: { lat: number; lng: number };
        category?: string;
        estimatedTime?: number;
    }>;
    constraints?: {
        maxTime?: number;
        preferredCategories?: string[];
        avoidCrowded?: boolean;
        accessibilityNeeds?: string[];
        timeOfDay?: string;
    };
    userInterests?: string;
}) {
    try {
        const result = await optimizeTourRoute(optimizationData);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error optimizing tour route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check for quota/rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return { 
                success: false, 
                error: 'AI service is currently unavailable due to rate limits. Please try again later or contact support if this persists.' 
            };
        }
        
        return { success: false, error: `Failed to optimize route: ${errorMessage}` };
    }
}

// Collection Actions
export async function addCollectionAction(collectionData: {
    name: string;
    description?: string;
    place_id: string;
    thumbnail_url?: string;
    is_featured?: boolean;
}) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'You must be logged in to add collections.' };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, collectionData.place_id);
        if (!canManage) {
            return { success: false, error: 'You do not have permission to add collections to this place.' };
        }

        const { data, error } = await supabase
            .from('collections')
            .insert({
                name: collectionData.name,
                description: collectionData.description || null,
                place_id: collectionData.place_id,
                thumbnail_url: collectionData.thumbnail_url || null,
                is_featured: collectionData.is_featured || false,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding collection:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to add collection: ${errorMessage}` };
    }
}

export async function updateCollectionAction(collectionData: {
    id: string;
    name: string;
    description?: string;
    place_id: string;
    thumbnail_url?: string;
    is_featured?: boolean;
}) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'You must be logged in to update collections.' };
        }

        // Get collection to check place_id
        const { data: existingCollection, error: fetchError } = await supabase
            .from('collections')
            .select('place_id')
            .eq('id', collectionData.id)
            .single();

        if (fetchError || !existingCollection) {
            return { success: false, error: 'Collection not found.' };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, existingCollection.place_id);
        if (!canManage) {
            return { success: false, error: 'You do not have permission to update this collection.' };
        }

        const { error } = await supabase
            .from('collections')
            .update({
                name: collectionData.name,
                description: collectionData.description || null,
                place_id: collectionData.place_id,
                thumbnail_url: collectionData.thumbnail_url || null,
                is_featured: collectionData.is_featured || false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', collectionData.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating collection:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to update collection: ${errorMessage}` };
    }
}

export async function deleteCollectionAction(collectionId: string) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'You must be logged in to delete collections.' };
        }

        // Get collection to check place_id
        const { data: existingCollection, error: fetchError } = await supabase
            .from('collections')
            .select('place_id')
            .eq('id', collectionId)
            .single();

        if (fetchError || !existingCollection) {
            return { success: false, error: 'Collection not found.' };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, existingCollection.place_id);
        if (!canManage) {
            return { success: false, error: 'You do not have permission to delete this collection.' };
        }

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', collectionId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting collection:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to delete collection: ${errorMessage}` };
    }
}

export async function addLocationToCollectionAction(collectionId: string, locationId: string, displayOrder?: number) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'You must be logged in to manage collections.' };
        }

        // Get collection to check place_id
        const { data: collection, error: fetchError } = await supabase
            .from('collections')
            .select('place_id')
            .eq('id', collectionId)
            .single();

        if (fetchError || !collection) {
            return { success: false, error: 'Collection not found.' };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, collection.place_id);
        if (!canManage) {
            return { success: false, error: 'You do not have permission to manage this collection.' };
        }

        const { error } = await supabase
            .from('collection_locations')
            .insert({
                collection_id: collectionId,
                location_id: locationId,
                display_order: displayOrder || 0,
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error adding location to collection:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to add location to collection: ${errorMessage}` };
    }
}

export async function removeLocationFromCollectionAction(collectionId: string, locationId: string) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { success: false, error: 'You must be logged in to manage collections.' };
        }

        // Get collection to check place_id
        const { data: collection, error: fetchError } = await supabase
            .from('collections')
            .select('place_id')
            .eq('id', collectionId)
            .single();

        if (fetchError || !collection) {
            return { success: false, error: 'Collection not found.' };
        }

        // Verify user can manage this place
        const canManage = await canManagePlace(user.id, collection.place_id);
        if (!canManage) {
            return { success: false, error: 'You do not have permission to manage this collection.' };
        }

        const { error } = await supabase
            .from('collection_locations')
            .delete()
            .eq('collection_id', collectionId)
            .eq('location_id', locationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error removing location from collection:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to remove location from collection: ${errorMessage}` };
    }
}
