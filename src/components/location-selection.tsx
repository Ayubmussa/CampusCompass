'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCollection, useMemoSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ArrowLeft, Map as MapIcon } from 'lucide-react';
import { type Location } from '@/lib/locations';
import Image from 'next/image';
import Link from 'next/link';

export function LocationSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('place');

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

  // Map database fields to Location type
  const locations: Location[] | null = locationsData
    ? locationsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        panoramaUrl: item.panorama_url,
        thumbnailUrl: item.thumbnail_url,
        placeId: item.place_id,
        coordinates: item.coordinates,
        connections: item.connections || [],
      }))
    : null;

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
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
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Button onClick={() => router.push('/')} variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Places
            </Button>
            <h1 className="font-headline text-4xl font-bold mb-2">
              {place?.name || 'Locations'}
            </h1>
            <p className="text-muted-foreground">
              {place?.description || 'No description available'}
            </p>
          </div>
          <Card>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Places
            </Button>
            <Button onClick={handleViewMap} variant="default">
              <MapIcon className="mr-2 h-4 w-4" />
              View Map
            </Button>
          </div>
          <h1 className="font-headline text-4xl font-bold mb-2">
            {place?.name || 'Select a Location'}
          </h1>
          <p className="text-muted-foreground">
            {place?.description || 'Choose a location to explore in 360°'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="group cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleLocationSelect(location.id)}
            >
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                {location.thumbnailUrl ? (
                  <Image
                    src={location.thumbnailUrl}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
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
          ))}
        </div>
      </div>
    </div>
  );
}

