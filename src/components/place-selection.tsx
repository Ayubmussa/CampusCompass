'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useMemoSupabase, useUser } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import { type Place } from '@/lib/places';
import Image from 'next/image';

export function PlaceSelection() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const placesQuery = useMemoSupabase(() => {
    return {
      table: 'places',
      select: '*',
      filter: (query: any) => query.order('name', { ascending: true }),
      __memo: true
    };
  }, []);

  const { data: placesData, isLoading, error } = useCollection<any>(placesQuery);

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

  const handlePlaceSelect = (placeId: string) => {
    router.push(`/?place=${placeId}`);
  };

  if (isUserLoading || isLoading) {
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
            <CardTitle className="text-destructive">Error Loading Places</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'An unknown error occurred.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Places Available</CardTitle>
            <CardDescription>
              There are no places available at the moment. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold mb-2">Select a Place</h1>
          <p className="text-muted-foreground">
            Choose a place to explore its map view and 360° locations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Card
              key={place.id}
              className="group cursor-pointer transition-all hover:shadow-lg"
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
              <CardContent>
                <Button className="w-full" onClick={() => handlePlaceSelect(place.id)}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

