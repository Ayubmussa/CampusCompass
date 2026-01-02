'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCollection, useMemoSupabase, useSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ArrowLeft, Map as MapIcon, Sparkles } from 'lucide-react';
import { type Location } from '@/lib/locations';
import Image from 'next/image';
import Link from 'next/link';
import { LocationSearch, type SearchFilters } from '@/components/location-search';
import { searchLocationsAction } from '@/app/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'motion/react';

export function LocationSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('place');
  const supabase = useSupabase();

  const [resolvedThumbnailUrls, setResolvedThumbnailUrls] = React.useState<Record<string, string>>({});
  const [resolvedPanoramaUrls, setResolvedPanoramaUrls] = React.useState<Record<string, string>>({});
  const [searchFilters, setSearchFilters] = React.useState<SearchFilters>({
    query: '',
    category: '',
    tags: [],
    minRating: 0,
    placeId: placeId || undefined,
  });
  const [filteredLocations, setFilteredLocations] = React.useState<Location[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Normalize storage paths to public URLs for Next/Image
  const buildPublicUrl = React.useCallback((path?: string | null) => {
    if (!path) return '';

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) return path;

    // If already a full URL, use it as-is (but ensure it's properly formatted)
    if (/^https?:\/\//i.test(path)) {
      try {
        const url = new URL(path);
        // If it's our Supabase URL, return as-is
        if (url.origin === baseUrl) {
          return path;
        }
        // Different host, return as-is
        return path;
      } catch {
        return path;
      }
    }

    // Relative path - need to build full URL
    let cleanPath = path.replace(/^\/+/, '');
    const storagePrefix = 'storage/v1/object/public/';
    const bucketName = 'locations';

    // If path already includes storage prefix, strip it to get the bucket-relative path
    if (cleanPath.startsWith(storagePrefix)) {
      cleanPath = cleanPath.slice(storagePrefix.length);
    }

    // If path doesn't start with bucket name, add it
    // This handles cases where DB stores just "class-rooms/thumbnail.jpg"
    if (!cleanPath.startsWith(bucketName)) {
      cleanPath = `${bucketName}/${cleanPath}`;
    }

    // Build final URL: baseUrl/storage/v1/object/public/locations/...
    // Note: We preserve the path as-is, including double "locations" if present
    // because that's how Supabase Storage works when bucket name is in the path
    const finalPath = `${storagePrefix}${cleanPath}`;

    // Don't encode - Next.js Image will handle encoding, and encoding segments individually breaks URLs
    // Only encode special characters in the path if needed, but preserve the structure
    return `${baseUrl}/${finalPath}`;
  }, []);

  // Extract a bucket-relative path (e.g., "locations/foo/bar.jpg") from various shapes
  const extractBucketPath = React.useCallback((path?: string | null) => {
    if (!path) return { bucketPath: '', url: '' };

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    let rawPath = path;

    if (/^https?:\/\//i.test(path)) {
      try {
        const url = new URL(path);
        if (baseUrl && url.origin !== baseUrl) {
          // Different host; return as-is
          return { bucketPath: '', url: path };
        }
        rawPath = url.pathname;
      } catch {
        return { bucketPath: '', url: path };
      }
    }

    let cleanPath = rawPath.replace(/^\/+/, '');

    const storagePrefix = 'storage/v1/object/public/';
    if (cleanPath.startsWith(storagePrefix)) {
      cleanPath = cleanPath.slice(storagePrefix.length);
    }

    const bucketName = 'locations';

    if (cleanPath.startsWith(`${bucketName}/${bucketName}/`)) {
      cleanPath = cleanPath.slice(bucketName.length + 1);
    }

    if (cleanPath.startsWith(`${bucketName}/`)) {
      return { bucketPath: cleanPath, url: '' };
    }

    // If nothing matches, fall back
    return { bucketPath: '', url: path };
  }, []);

  const placeQuery = useMemoSupabase(() => {
    if (!placeId) return null;
    return {
      table: 'places',
      select: '*',
      filter: (query: any) => query.eq('id', placeId),
      __memo: true
    };
  }, [placeId]);

  const { data: placeData } = useCollection<any>(placeQuery);
  const place = placeData && placeData.length > 0 ? placeData[0] : null;

  const locationsQuery2 = useMemoSupabase(() => {
    if (!placeId) return null;
    return {
      table: 'locations',
      select: '*',
      filter: (query: any) => query.eq('place_id', placeId).order('name', { ascending: true }),
      __memo: true
    };
  }, [placeId]);

  const { data: locationsData, isLoading, error } = useCollection<any>(locationsQuery2);

  // Map database fields to Location type - memoize to prevent infinite loops
  // Don't include resolved URLs here to avoid dependency issues
  const allLocations: Location[] | null = React.useMemo(() => {
    if (!locationsData) return null;
    return locationsData.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      panoramaUrl: item.panorama_url, // Use raw URL, resolve at display time
      thumbnailUrl: item.thumbnail_url, // Use raw URL, resolve at display time
      placeId: item.place_id,
      tags: item.tags || [],
      category: item.category || undefined,
      coordinates: item.coordinates,
      connections: item.connections || [],
    }));
  }, [locationsData]);

  // Get all unique tags from locations for search component
  const availableTags = React.useMemo(() => {
    if (!allLocations) return [];
    const tagSet = new Set<string>();
    allLocations.forEach(loc => {
      loc.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allLocations]);

  // Perform search when filters change
  React.useEffect(() => {
    const performSearch = async () => {
      if (!placeId) return;

      const hasActiveFilters = searchFilters.query || searchFilters.category || searchFilters.tags.length > 0 || searchFilters.minRating > 0;

      if (!hasActiveFilters) {
        // No filters, show all locations
        setFilteredLocations(allLocations);
        return;
      }

      setIsSearching(true);
      const result = await searchLocationsAction({
        ...searchFilters,
        placeId: placeId,
      });
      setIsSearching(false);

      if (result.success && result.data) {
        // Map search results - don't use resolved URLs here to avoid dependency loop
        // URLs will be resolved separately when displaying
        setFilteredLocations(result.data);
      } else {
        setFilteredLocations([]);
      }
    };

    performSearch();
  }, [searchFilters, placeId, allLocations]);

  // Use filtered locations if search is active, otherwise use all locations
  // Apply resolved URLs at display time to avoid dependency loops
  const locations = React.useMemo(() => {
    const baseLocations = filteredLocations !== null ? filteredLocations : allLocations;
    if (!baseLocations) return null;
    
    return baseLocations.map((location) => ({
      ...location,
      panoramaUrl: resolvedPanoramaUrls[location.id] || buildPublicUrl(location.panoramaUrl),
      thumbnailUrl: resolvedThumbnailUrls[location.id] || buildPublicUrl(location.thumbnailUrl),
    }));
  }, [filteredLocations, allLocations, resolvedPanoramaUrls, resolvedThumbnailUrls, buildPublicUrl]);

  // Resolve signed URLs for Supabase storage to avoid private bucket issues
  React.useEffect(() => {
    if (!supabase || !locationsData) return;

    const bucketName = 'locations';

    const resolveUrls = async () => {
      const thumbEntries: [string, string][] = [];
      const panoEntries: [string, string][] = [];

      for (const item of locationsData) {
        const thumbInfo = extractBucketPath(item.thumbnail_url);
        const panoInfo = extractBucketPath(item.panorama_url);

        // Thumbnail
        if (thumbInfo.url) {
          thumbEntries.push([item.id, thumbInfo.url]);
        } else if (thumbInfo.bucketPath) {
          const storagePath = thumbInfo.bucketPath.replace(/^locations\//, '');
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(storagePath, 60 * 60);
          if (!error && data?.signedUrl) {
            thumbEntries.push([item.id, data.signedUrl]);
          } else {
            thumbEntries.push([item.id, buildPublicUrl(item.thumbnail_url)]);
          }
        }

        // Panorama
        if (panoInfo.url) {
          panoEntries.push([item.id, panoInfo.url]);
        } else if (panoInfo.bucketPath) {
          const storagePath = panoInfo.bucketPath.replace(/^locations\//, '');
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(storagePath, 60 * 60);
          if (!error && data?.signedUrl) {
            panoEntries.push([item.id, data.signedUrl]);
          } else {
            panoEntries.push([item.id, buildPublicUrl(item.panorama_url)]);
          }
        }
      }

      setResolvedThumbnailUrls((prev) => ({ ...prev, ...Object.fromEntries(thumbEntries) }));
      setResolvedPanoramaUrls((prev) => ({ ...prev, ...Object.fromEntries(panoEntries) }));
    };

    resolveUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, locationsData, buildPublicUrl, extractBucketPath]);

  const handleLocationSelect = (locationId: string) => {
    router.push(`/?place=${placeId}&location=${locationId}`);
  };

  const handleViewMap = () => {
    router.push(`/?place=${placeId}&view=map`);
  };

  // If no placeId, redirect to place selection
  React.useEffect(() => {
    if (!placeId) {
      router.push('/');
    }
  }, [placeId, router]);


  if (!placeId) {
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

  if (isLoading) {
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
              <CardTitle className="text-destructive">Error Loading Locations</CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : 'An unknown error occurred.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Places
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
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
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-6xl"
        >
          <div className="mb-6">
            <Button onClick={() => router.push('/')} variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Places
            </Button>
            <h1 className="font-headline text-4xl font-bold mb-2 bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
              {place?.name || 'Locations'}
            </h1>
            <p className="text-muted-foreground">
              {place?.description || 'No description available'}
            </p>
          </div>
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle>No Locations Available</CardTitle>
              <CardDescription>
                There are no locations available for this place at the moment. You can still explore the map view.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={handleViewMap} className="flex-1">
                <MapIcon className="mr-2 h-4 w-4" />
                Proceed to Campus Tour
              </Button>
            </CardContent>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Places
              </Button>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button onClick={handleViewMap} variant="default" className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700">
                  <MapIcon className="mr-2 h-4 w-4" />
                  View Map
                </Button>
              </div>
            </div>
            <h1 className="font-headline text-4xl font-bold mb-2 bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              {place?.name || 'Select a Location'}
              <Sparkles className="w-6 h-6 text-sky-500" />
            </h1>
            <p className="text-muted-foreground">
              {place?.description || 'Choose a location to explore in 360°'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4">
              <LocationSearch
                filters={searchFilters}
                onFiltersChange={setSearchFilters}
                availableTags={availableTags}
                placeId={placeId || undefined}
              />
            </div>
          </motion.div>

          {isSearching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!isSearching && (!locations || locations.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>No Locations Found</CardTitle>
                  <CardDescription>
                    Try adjusting your search filters or clear them to see all locations.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}

          {!isSearching && locations && locations.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card
                  className="group cursor-pointer transition-all hover:shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0"
                  onClick={() => handleLocationSelect(location.id)}
                >
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                {location.thumbnailUrl ? (
                  <Image
                    src={location.thumbnailUrl}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized={location.thumbnailUrl.includes('supabase.co')}
                    onError={(e) => {
                      console.error('Image load error:', location.thumbnailUrl);
                      // Fallback to placeholder on error
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <MapPin className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="font-headline">{location.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">
                      {location.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => handleLocationSelect(location.id)}>
                  Explore in 360°
                </Button>
              </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

