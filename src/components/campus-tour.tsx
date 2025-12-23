
'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TourSidebar } from '@/components/tour-sidebar';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LocationInfoSheet } from './location-info-sheet';
import { MapLocationInfoSheet } from './map-location-info-sheet';
import { useCollection, useMemoSupabase } from '@/supabase';
import { type Location } from '@/lib/locations';
import { MapViewer } from './map-viewer';

type MapOnlyLocation = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type ViewMode = 'locations' | 'maps';

type CampusTourProps = {
  placeId: string;
  initialLocationId?: string | null;
  initialViewMode?: ViewMode;
};

export function CampusTour({ placeId, initialLocationId, initialViewMode = 'locations' }: CampusTourProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(initialViewMode);
  const router = useRouter();
  // Filter locations by the selected place - only locations belonging to this place will be shown
  const locationsQuery = useMemoSupabase(() => {
      return { 
        table: 'locations',
        filter: (query: any) => query.eq('place_id', placeId),
        __memo: true 
      }
  }, [placeId]);
  const { data: allLocations, isLoading: isLoadingLocations, error } = useCollection<any>(locationsQuery);
  
  // Log for debugging
  React.useEffect(() => {
    if (error) {
      console.error('Error loading locations:', error);
    }
    if (allLocations !== null) {
      console.log('Locations loaded:', allLocations?.length || 0, 'items');
    }
  }, [allLocations, error]);
  
  // Map database fields to Location type
  const mappedLocations: Location[] | null = allLocations ? allLocations.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    panoramaUrl: item.panorama_url,
    thumbnailUrl: item.thumbnail_url,
    placeId: item.place_id,
    coordinates: item.coordinates,
    connections: item.connections || [],
  })) : null;


  const [tourPath, setTourPath] = React.useState<string[]>([]);
  const [currentTourIndex, setCurrentTourIndex] = React.useState(0);
  const [isTtsEnabled, setIsTtsEnabled] = React.useState(true);
  const [rotationSpeed, setRotationSpeed] = React.useState(0.1);
  const [currentLocationId, setCurrentLocationId] = React.useState<string | null>(initialLocationId || null);
  const [selectedLocationForInfo, setSelectedLocationForInfo] = React.useState<Location | null>(null);
  const [selectedMapOnlyLocation, setSelectedMapOnlyLocation] = React.useState<MapOnlyLocation | null>(null);

  // When locations load, set the initial location or first one as active
  React.useEffect(() => {
    if (!currentLocationId && mappedLocations && mappedLocations.length > 0) {
      // Use initialLocationId if provided and valid, otherwise use first location
      const targetId = initialLocationId && mappedLocations.some(loc => loc.id === initialLocationId)
        ? initialLocationId
        : mappedLocations[0].id;
      setCurrentLocationId(targetId);
    }
  }, [mappedLocations, currentLocationId, initialLocationId]);

  const handleStartTour = (ids: string[]) => {
    setTourPath(ids);
    setCurrentTourIndex(0);
    if (ids.length > 0) {
      setCurrentLocationId(ids[0]);
    }
  };
  
  const handleLocationSelect = (id: string) => {
    setCurrentLocationId(id);
    setTourPath([]); // Clear AI tour when a location is manually selected
  }
  
  const handleInfoClick = (location: Location) => {
    setSelectedLocationForInfo(location);
  };
  
  const handleHotspotClick = (targetLocationId: string) => {
    setCurrentLocationId(targetLocationId);
    // Check if this new location is part of the current tour
    const tourIndex = tourPath.indexOf(targetLocationId);
    if (tourIndex !== -1) {
      setCurrentTourIndex(tourIndex);
    } else {
      // If it's not in the tour, clear the tour path
      setTourPath([]);
    }
  };

  const currentLocation = mappedLocations?.find(loc => loc.id === currentLocationId) || null;

  const ThreeSixtyViewer = dynamic(() => import('@/components/three-sixty-viewer').then(m => m.ThreeSixtyViewer), {
    ssr: false,
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <TourSidebar
          onStartTour={handleStartTour}
          onLocationSelect={handleLocationSelect}
          isTtsEnabled={isTtsEnabled}
          onTtsToggle={setIsTtsEnabled}
          rotationSpeed={rotationSpeed}
          onRotationSpeedChange={setRotationSpeed}
          onInfoClick={handleInfoClick}
          currentLocationId={currentLocationId}
          allLocations={mappedLocations || []}
          isLoading={isLoadingLocations}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden" asChild>
              <SidebarTrigger />
            </Button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 font-headline text-lg font-semibold"
            >
              <Map className='h-6 w-6' />
              <span>CampusCompass</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              Change place
            </Button>
          </div>
        </header>
        <SidebarInset>
          <main className="relative h-[calc(100svh-3.5rem)] w-full overflow-hidden lg:h-[calc(100svh-60px)]">
            {viewMode === 'locations' ? (
              <ThreeSixtyViewer 
                location={currentLocation}
                onHotspotClick={handleHotspotClick}
              />
            ) : (
              <MapViewer 
                locations={mappedLocations || []}
                placeId={placeId}
                onLocationClick={(locationId) => {
                  setCurrentLocationId(locationId);
                  setViewMode('locations'); // Switch to locations view to show 360 image
                }}
                onMapOnlyLocationClick={(location) => {
                  setSelectedMapOnlyLocation(location);
                }}
                selectedMapOnlyLocation={selectedMapOnlyLocation}
              />
            )}
          </main>
        </SidebarInset>
      </div>
      {viewMode === 'locations' && (
        <LocationInfoSheet 
          location={selectedLocationForInfo}
          onOpenChange={(isOpen) => !isOpen && setSelectedLocationForInfo(null)}
          isTtsEnabled={isTtsEnabled}
        />
      )}
      {viewMode === 'maps' && (
        <MapLocationInfoSheet
          location={selectedMapOnlyLocation}
          onOpenChange={(isOpen) => !isOpen && setSelectedMapOnlyLocation(null)}
        />
      )}
    </SidebarProvider>
  );
}
