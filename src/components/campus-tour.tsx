
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
import { Map, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LocationInfoSheet } from './location-info-sheet';
import { MapLocationInfoSheet } from './map-location-info-sheet';
import { useCollection, useMemoSupabase } from '@/supabase';
import { type Location } from '@/lib/locations';
import { MapViewer } from './map-viewer';
import { AITourChatbot } from './ai-tour-chatbot';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'motion/react';

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
    richDescription: item.rich_description || undefined,
    panoramaUrl: item.panorama_url,
    thumbnailUrl: item.thumbnail_url,
    placeId: item.place_id,
    tags: item.tags || [],
    category: item.category || undefined,
    openingHours: item.opening_hours || undefined,
    contactInfo: item.contact_info || undefined,
    pricingInfo: item.pricing_info || undefined,
    capacity: item.capacity || undefined,
    relatedLinks: item.related_links || [],
    videoUrl: item.video_url || undefined,
    audioUrl: item.audio_url || undefined,
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

  const handleStartTour = (locationIds: string[], mapIds?: string[], viewMode?: 'locations' | 'maps' | 'both') => {
    setTourPath(locationIds);
    setCurrentTourIndex(0);
    
    // Set view mode based on recommendations
    if (viewMode === 'maps' || (viewMode === 'both' && mapIds && mapIds.length > 0 && locationIds.length === 0)) {
      setViewMode('maps');
    } else if (viewMode === 'both' && locationIds.length > 0) {
      // If both, start with locations view
      setViewMode('locations');
    } else if (locationIds.length > 0) {
      setViewMode('locations');
    } else if (mapIds && mapIds.length > 0) {
      setViewMode('maps');
    }
    
    // Set first location if available
    if (locationIds.length > 0) {
      setCurrentLocationId(locationIds[0]);
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          className="absolute w-2 h-2 bg-sky-400/20 dark:bg-sky-400/10 rounded-full pointer-events-none"
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

      <SidebarProvider>
        <Sidebar className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-r border-gray-200/50 dark:border-gray-700/50">
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
        <div className="flex flex-1 flex-col relative z-10">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex h-14 items-center justify-between gap-4 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm px-4 lg:h-[60px] lg:px-6"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden" asChild>
                <SidebarTrigger />
              </Button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 font-headline text-lg font-semibold"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Map className='h-5 w-5 text-white' />
                </div>
                <span className="flex items-center gap-1">
                  Virtuality
                  <Sparkles className="w-4 h-4 text-sky-500" />
                </span>
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                Change place
              </Button>
            </motion.div>
          </motion.header>
          <SidebarInset>
            <main className="relative h-[calc(100svh-3.5rem)] w-full overflow-hidden lg:h-[calc(100svh-60px)] flex flex-col">
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
        <AITourChatbot 
          onStartTour={handleStartTour}
          currentLocation={mappedLocations?.find(l => l.id === currentLocationId) || null}
          availableLocations={mappedLocations || []}
        />
      </SidebarProvider>
    </div>
  );
}
