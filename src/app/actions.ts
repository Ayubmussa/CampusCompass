'use server';

import { generateTourRecommendations } from '@/ai/flows/generate-tour-recommendations';
import { createServerSupabaseClient } from '@/supabase/server';
import type { Location } from '@/lib/locations';

export interface TourRecommendationState {
  tourName?: string;
  tourDescription?: string;
  recommendations: {
    ids: string[];
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
    const { data: locationsData, error } = await supabase
      .from('locations')
      .select('*');

    if (error) throw error;

    const locations: Location[] = (locationsData || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      panoramaUrl: item.panorama_url,
      thumbnailUrl: item.thumbnail_url,
      coordinates: item.coordinates,
      connections: item.connections || [],
    }));
    
    const availableLocations = locations.map(loc => loc.name);

    const result = await generateTourRecommendations({ interests, availableLocations });
    
    const recommendedLocationIds = result.recommendedLocations
        .map(name => locations.find(loc => loc.name === name)?.id)
        .filter((id): id is string => !!id);

    return {
      tourName: result.tourName,
      tourDescription: result.tourDescription,
      recommendations: {
        ids: recommendedLocationIds,
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

        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            console.error("User is not an admin");
            return { success: false, error: "You must be an admin to add locations." };
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
                place_id: locationData.placeId,
                panorama_url: locationData.panoramaUrl,
                thumbnail_url: locationData.thumbnailUrl,
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to update locations." };
        }

        const updateData: any = {};
        if (locationData.name) updateData.name = locationData.name;
        if (locationData.description) updateData.description = locationData.description;
        if (locationData.placeId) updateData.place_id = locationData.placeId;
        if (locationData.panoramaUrl) updateData.panorama_url = locationData.panoramaUrl;
        if (locationData.thumbnailUrl) updateData.thumbnail_url = locationData.thumbnailUrl;
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to delete locations." };
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

        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to add places." };
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to update places." };
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to delete places." };
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to add maps." };
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to update maps." };
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
        
        // Verify user is admin
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('uid', user.id)
            .single();

        if (profileError || !userProfile?.is_admin) {
            return { success: false, error: "You must be an admin to delete maps." };
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
