'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useMemoSupabase, useUser, useSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Building2, Sparkles, LogOut, Shield, User } from 'lucide-react';
import { type Place } from '@/lib/places';
import { type Collection } from '@/lib/collections';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { AITourChatbot } from '@/components/ai-tour-chatbot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isAdmin } from '@/lib/admin-helpers';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PlaceSelection() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();

  const placesQuery = useMemoSupabase(() => {
    return {
      table: 'places',
      select: '*',
      filter: (query: any) => query.order('name', { ascending: true }),
      __memo: true
    };
  }, []);

  const { data: placesData, isLoading, error } = useCollection<any>(placesQuery);

  // Fetch all locations for AI context
  const allLocationsQuery = useMemoSupabase(() => {
    return {
      table: 'locations',
      select: '*',
      filter: (query: any) => query.order('name', { ascending: true }),
      __memo: true
    };
  }, []);

  const { data: allLocationsData } = useCollection<any>(allLocationsQuery);

  // Fetch collections
  const collectionsQuery = useMemoSupabase(() => {
    return {
      table: 'collections',
      select: '*',
      filter: (query: any) => query.order('is_featured', { ascending: false }).order('name', { ascending: true }),
      __memo: true
    };
  }, []);

  const { data: collectionsData } = useCollection<any>(collectionsQuery);
  const collections: Collection[] | null = collectionsData
    ? collectionsData.map((item: any) => ({
        id: item.id,
        place_id: item.place_id,
        name: item.name,
        description: item.description,
        thumbnail_url: item.thumbnail_url,
        is_featured: item.is_featured || false,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
      }))
    : null;

  // Map database fields to Place type
  const places: Place[] | null = placesData
    ? placesData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        thumbnailUrl: item.thumbnail_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    : null;

  // Group collections by place
  const collectionsByPlace = React.useMemo(() => {
    if (!collections) return new Map<string, Collection[]>();
    const map = new Map<string, Collection[]>();
    collections.forEach(collection => {
      const existing = map.get(collection.place_id) || [];
      map.set(collection.place_id, [...existing, collection]);
    });
    return map;
  }, [collections]);

  const handleCollectionClick = (collectionId: string, placeId: string) => {
    // Navigate to location selection with collection filter
    router.push(`/?place=${placeId}&collection=${collectionId}`);
  };

  const handlePlaceSelect = (placeId: string) => {
    router.push(`/?place=${placeId}`);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleGoToAdmin = () => {
    router.push('/admin');
  };

  const handleStartTour = (locationIds: string[], mapIds?: string[], viewMode?: 'locations' | 'maps' | 'both') => {
    // If we have location IDs, navigate to the first location
    if (locationIds.length > 0) {
      // Find which place these locations belong to
      // For now, we'll need to fetch this or pass it through
      // For simplicity, navigate to the first place and first location
      router.push(`/?place=${places?.[0]?.id || ''}&location=${locationIds[0]}`);
    } else if (mapIds && mapIds.length > 0) {
      // Navigate to map view
      router.push(`/?place=${places?.[0]?.id || ''}&view=map`);
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <Loader2 className="h-12 w-12 animate-spin z-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Places</CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : 'An unknown error occurred.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardHeader>
              <CardTitle>No Places Available</CardTitle>
              <CardDescription>
                There are no places available at the moment. Please contact an administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-50"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-sky-400/20 dark:bg-sky-400/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Header with User Menu */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
      >
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-headline text-xl font-bold flex items-center gap-2">
              Virtuality
              <Sparkles className="w-4 h-4 text-sky-500" />
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <ThemeToggle />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {user.profile?.photoURL && (
                        <AvatarImage src={user.profile.photoURL} alt={user.profile.displayName || 'User'} />
                      )}
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      {user.profile?.displayName && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.profile.displayName}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin(user.profile) && (
                    <>
                      <DropdownMenuItem onClick={handleGoToAdmin}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </motion.div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative z-10 container mx-auto p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="font-headline text-4xl font-bold mb-2 bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
              Select a Place
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose a place to explore its map view and 360° locations
            </p>
          </motion.div>

        {/* Featured Collections */}
        {collections && collections.filter(c => c.is_featured).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-sky-500" />
              Featured Collections
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections
                .filter(c => c.is_featured)
                .map((collection, index) => {
                  const place = places?.find(p => p.id === collection.place_id);
                  return (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <Card
                        className="group cursor-pointer transition-all hover:shadow-xl border-primary/20 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
                        onClick={() => handleCollectionClick(collection.id, collection.place_id)}
                      >
                      <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                        {collection.thumbnail_url ? (
                          <Image
                            src={collection.thumbnail_url}
                            alt={collection.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <Sparkles className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2" variant="default">
                          Featured
                        </Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="font-headline text-lg">{collection.name}</CardTitle>
                        {place && (
                          <CardDescription className="text-xs">{place.name}</CardDescription>
                        )}
                        {collection.description && (
                          <CardDescription className="mt-2 line-clamp-2 text-sm">
                            {collection.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <h2 className="font-headline text-2xl font-semibold mb-4">All Places</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {places.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
            >
              <Card
                className="group cursor-pointer transition-all hover:shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
                onClick={() => handlePlaceSelect(place.id)}
              >
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                {place.thumbnailUrl ? (
                  <Image
                    src={place.thumbnailUrl}
                    alt={place.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <Building2 className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="font-headline">{place.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">
                      {place.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => handlePlaceSelect(place.id)}>
                  Explore
                </Button>
                {collectionsByPlace.has(place.id) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Collections:</p>
                    <div className="flex flex-wrap gap-2">
                      {collectionsByPlace.get(place.id)?.slice(0, 3).map((collection) => (
                        <Badge
                          key={collection.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollectionClick(collection.id, place.id);
                          }}
                        >
                          {collection.name}
                        </Badge>
                      ))}
                      {collectionsByPlace.get(place.id) && collectionsByPlace.get(place.id)!.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{collectionsByPlace.get(place.id)!.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        </div>
      </motion.div>

      {/* AI Chatbot */}
      <AITourChatbot 
        onStartTour={handleStartTour}
        currentLocation={null}
        availableLocations={allLocationsData?.map((item: any) => ({
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
        })) || []}
        availablePlaces={places || []}
      />
    </div>
  );
}

