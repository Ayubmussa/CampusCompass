'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { type Location } from '@/lib/locations';
import { getLocationPositionOnPage, getLocationsOnPage, getLocationMetadata, getMapOnlyLocationsOnPage, type LocationMapPosition } from '@/lib/map-positions';

const MAP_IMAGES = [
  '/maps/Page_1 copy.jpg',
  '/maps/Page_2 copy.jpg',
  '/maps/Page_3 copy.jpg',
  '/maps/Page_4 copy.jpg',
  '/maps/Page_5 copy.jpg',
];

type MapOnlyLocation = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type MapViewerProps = {
  locations?: Location[];
  onLocationClick?: (locationId: string) => void;
  onMapOnlyLocationClick?: (location: MapOnlyLocation) => void;
  selectedMapOnlyLocation?: MapOnlyLocation | null;
};

export function MapViewer({ 
  locations = [], 
  onLocationClick,
  onMapOnlyLocationClick,
  selectedMapOnlyLocation 
}: MapViewerProps) {
  const [currentMapIndex, setCurrentMapIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(100);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const imageElementRef = React.useRef<HTMLImageElement>(null);
  const resizeTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const [hoveredLocationId, setHoveredLocationId] = React.useState<string | null>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

  const currentMap = MAP_IMAGES[currentMapIndex];
  const canGoPrevious = currentMapIndex > 0;
  const canGoNext = currentMapIndex < MAP_IMAGES.length - 1;

  // Get locations visible on the current map page based on name mapping
  const visibleLocations = React.useMemo(() => {
    if (locations.length === 0) return [];
    
    // Get location names that appear on the current page
    const locationNamesOnPage = getLocationsOnPage(currentMapIndex);
    
    // Filter locations that appear on this page (excluding map-only locations)
    return locations.filter((location) => {
      // Check if location name is mapped for this page
      const position = getLocationPositionOnPage(location.name, currentMapIndex);
      const metadata = getLocationMetadata(location.name);
      // Only include if it has a position and is not map-only
      return position !== null && !metadata?.isMapOnly;
    });
  }, [locations, currentMapIndex]);

  // Get map-only locations for the current page
  const mapOnlyLocations = React.useMemo(() => {
    const locations = getMapOnlyLocationsOnPage(currentMapIndex);
    console.log(`[MapViewer] Page ${currentMapIndex + 1} - Map-only locations:`, locations.length);
    return locations;
  }, [currentMapIndex]);
  
  // Debug logging
  React.useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      console.log('[MapViewer] Container size set:', containerSize);
      console.log('[MapViewer] Visible locations:', visibleLocations.length);
      console.log('[MapViewer] Map-only locations:', mapOnlyLocations.length);
    }
  }, [containerSize, visibleLocations.length, mapOnlyLocations.length]);

  // Calculate pixel positions based on percentage and rendered image size
  // This matches the new implementation approach: convert percentages to pixels
  const calculatePixelPosition = React.useCallback((
    position: { x: number; y: number; width?: number; height?: number },
    imageWidth: number,
    imageHeight: number
  ) => {
    // x, y are percentages (0-100) from map-positions.ts
    // Convert to pixel positions based on rendered image dimensions
    const leftPercent = position.x / 100;
    const topPercent = position.y / 100;
    
    // If width/height are provided, use them (they're also percentages)
    // Otherwise, create a small clickable area for point markers
    const widthPercent = position.width ? position.width / 100 : 0.02; // 2% default
    const heightPercent = position.height ? position.height / 100 : 0.02; // 2% default
    
    return {
      top: topPercent * imageHeight,
      left: leftPercent * imageWidth,
      width: widthPercent * imageWidth,
      height: heightPercent * imageHeight,
    };
  }, []);

  // Track image natural dimensions for overlay container sizing
  // Container size is set in the onLoad handler, but we also listen for resize
  React.useEffect(() => {
    const updateSize = () => {
      if (imageElementRef.current) {
        const img = imageElementRef.current;
        if (img.complete && img.naturalWidth > 0) {
          setContainerSize({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        }
      }
    };

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateSize, 100);
    };

    window.addEventListener('resize', handleResize);
    updateSize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [currentMapIndex]);

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentMapIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentMapIndex(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle mouse drag for panning when zoomed
  React.useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Don't start dragging if clicking on a marker
      const target = e.target as HTMLElement;
      if (target.closest('[data-location-marker]')) {
        return;
      }
      
      if (zoom > 100) {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        container.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = (x - startX) * 2;
      const walkY = (y - startY) * 2;
      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = zoom > 100 ? 'grab' : 'default';
    };

    const handleMouseLeave = () => {
      isDragging = false;
      container.style.cursor = zoom > 100 ? 'grab' : 'default';
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [zoom]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentMapIndex > 0) {
        setCurrentMapIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentMapIndex < MAP_IMAGES.length - 1) {
        setCurrentMapIndex(prev => prev + 1);
      } else if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 25, 300));
      } else if (e.key === '-') {
        setZoom(prev => Math.max(prev - 25, 50));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentMapIndex]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-gray-900 overflow-hidden">
      {/* Map Image Container */}
      <div 
        ref={scrollContainerRef}
        className="relative h-full w-full overflow-auto"
        style={{ cursor: zoom > 100 ? 'grab' : 'default' }}
      >
        <div 
          ref={imageRef}
          className="relative min-h-full min-w-full flex items-center justify-center"
          style={{ padding: 0 }}
        >
        <div
          ref={mapContainerRef}
          className="relative transition-transform duration-200"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            display: 'inline-block',
            lineHeight: 0,
          }}
        >
          <div 
            className="relative" 
            style={{ 
              display: 'block', 
              lineHeight: 0,
              position: 'relative',
              margin: 0,
              padding: 0,
            }}
          >
            <img
              ref={imageElementRef}
              src={currentMap}
              alt={`Campus Map Page ${currentMapIndex + 1}`}
              className="select-none"
              style={{
                display: 'block',
                width: containerSize.width > 0 ? `${containerSize.width}px` : 'auto',
                height: containerSize.height > 0 ? `${containerSize.height}px` : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  const naturalW = img.naturalWidth;
                  const naturalH = img.naturalHeight;
                  
                  console.log('[MapViewer] Image loaded:', {
                    naturalWidth: naturalW,
                    naturalHeight: naturalH,
                    aspectRatio: (naturalW / naturalH).toFixed(4),
                    currentPage: currentMapIndex + 1,
                  });
                  
                  // Verify dimensions match expected values
                  if (currentMapIndex === 0) { // Page 1 (Basement)
                    const expectedWidth = 1113;
                    const expectedHeight = 2955;
                    if (Math.abs(naturalW - expectedWidth) > 10 || Math.abs(naturalH - expectedHeight) > 10) {
                      console.warn('[MapViewer] ⚠️ DIMENSION MISMATCH! Actual:', naturalW, 'x', naturalH, `Expected: ${expectedWidth} x ${expectedHeight}`);
                      console.warn('[MapViewer] Positions may be inaccurate. Please verify image dimensions and update map-positions.ts if needed.');
                    } else {
                      console.log('[MapViewer] ✓ Dimensions match expected values:', expectedWidth, 'x', expectedHeight);
                    }
                  } else if (currentMapIndex === 1) { // Page 2 (Ground Floor)
                    const expectedWidth = 1058;
                    const expectedHeight = 2939;
                    if (Math.abs(naturalW - expectedWidth) > 10 || Math.abs(naturalH - expectedHeight) > 10) {
                      console.warn('[MapViewer] ⚠️ DIMENSION MISMATCH! Actual:', naturalW, 'x', naturalH, `Expected: ${expectedWidth} x ${expectedHeight}`);
                      console.warn('[MapViewer] Positions may be inaccurate. Please verify image dimensions and update map-positions.ts if needed.');
                    } else {
                      console.log('[MapViewer] ✓ Dimensions match expected values:', expectedWidth, 'x', expectedHeight);
                    }
                  } else if (currentMapIndex === 2) { // Page 3 (First Floor)
                    const expectedWidth = 955;
                    const expectedHeight = 2805;
                    if (Math.abs(naturalW - expectedWidth) > 10 || Math.abs(naturalH - expectedHeight) > 10) {
                      console.warn('[MapViewer] ⚠️ DIMENSION MISMATCH! Actual:', naturalW, 'x', naturalH, `Expected: ${expectedWidth} x ${expectedHeight}`);
                      console.warn('[MapViewer] Positions may be inaccurate. Please verify image dimensions and update map-positions.ts if needed.');
                    } else {
                      console.log('[MapViewer] ✓ Dimensions match expected values:', expectedWidth, 'x', expectedHeight);
                    }
                  } else if (currentMapIndex === 3) { // Page 4 (Second Floor)
                    const expectedWidth = 984;
                    const expectedHeight = 2805;
                    if (Math.abs(naturalW - expectedWidth) > 10 || Math.abs(naturalH - expectedHeight) > 10) {
                      console.warn('[MapViewer] ⚠️ DIMENSION MISMATCH! Actual:', naturalW, 'x', naturalH, `Expected: ${expectedWidth} x ${expectedHeight}`);
                      console.warn('[MapViewer] Positions may be inaccurate. Please verify image dimensions and update map-positions.ts if needed.');
                    } else {
                      console.log('[MapViewer] ✓ Dimensions match expected values:', expectedWidth, 'x', expectedHeight);
                    }
                  } else if (currentMapIndex === 4) { // Page 5 (Campus Overview)
                    const expectedWidth = 1800;
                    const expectedHeight = 2773;
                    if (Math.abs(naturalW - expectedWidth) > 10 || Math.abs(naturalH - expectedHeight) > 10) {
                      console.warn('[MapViewer] ⚠️ DIMENSION MISMATCH! Actual:', naturalW, 'x', naturalH, `Expected: ${expectedWidth} x ${expectedHeight}`);
                      console.warn('[MapViewer] Positions may be inaccurate. Please verify image dimensions and update map-positions.ts if needed.');
                    } else {
                      console.log('[MapViewer] ✓ Dimensions match expected values:', expectedWidth, 'x', expectedHeight);
                    }
                  }
                  
                  // Set container size to natural dimensions
                  // Overlay container will match this size for accurate positioning
                  setContainerSize({
                    width: naturalW,
                    height: naturalH,
                  });
                  
                  // Set image to exact natural dimensions
                  img.style.width = `${naturalW}px`;
                  img.style.height = `${naturalH}px`;
                }
              }}
            />
            
            {/* Clickable Location Overlays - Using pixel positioning based on rendered image size */}
            {containerSize.width > 0 && containerSize.height > 0 && (
              <div 
                className="absolute pointer-events-none" 
                style={{ 
                  top: 0,
                  left: 0,
                  zIndex: 10,
                  width: `${containerSize.width}px`,
                  height: `${containerSize.height}px`,
                }}
              >
              {/* Regular locations with 360 views */}
              {visibleLocations.map((location) => {
                const position = getLocationPositionOnPage(location.name, currentMapIndex);
                if (!position) return null;
                
                const isPointMarker = !position.width && !position.height;
                const locationKey = `location-${location.id}`;
                
                // Calculate pixel positions from percentages
                // Use containerSize (natural image dimensions) for accurate positioning
                const pixelPos = calculatePixelPosition(
                  position,
                  containerSize.width,
                  containerSize.height
                );
                
                return (
                  <div
                    key={locationKey}
                    data-location-marker
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      top: `${pixelPos.top}px`,
                      left: `${pixelPos.left}px`,
                      width: `${pixelPos.width}px`,
                      height: `${pixelPos.height}px`,
                      border: hoveredLocationId === locationKey 
                        ? '2px solid #007BFF' 
                        : '2px solid transparent',
                      borderRadius: isPointMarker ? '50%' : '4px',
                      transition: 'border-color 0.3s, background-color 0.3s',
                      backgroundColor: hoveredLocationId === locationKey && !isPointMarker
                        ? 'rgba(0, 123, 255, 0.1)'
                        : 'transparent',
                      zIndex: hoveredLocationId === locationKey ? 20 : 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log('[MapViewer] Location clicked:', location.name, location.id);
                      if (onLocationClick) {
                        onLocationClick(location.id);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#007BFF';
                      setHoveredLocationId(locationKey);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      setHoveredLocationId(null);
                    }}
                  >
                    {isPointMarker && (
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                          transform: `translate(-50%, -50%) scale(${Math.max(0.5, 100 / zoom)})`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <MapPin 
                          className={`h-8 w-8 transition-all duration-200 ${
                            hoveredLocationId === locationKey
                              ? 'text-blue-600 scale-125 fill-blue-600'
                              : 'text-red-600 hover:text-blue-500 hover:scale-110'
                          }`}
                          fill={hoveredLocationId === locationKey ? 'currentColor' : 'currentColor'}
                        />
                      </div>
                    )}
                    
                    {hoveredLocationId === locationKey && (
                      <div 
                        className="absolute pointer-events-none z-50"
                        style={{
                          top: isPointMarker ? 'calc(100% + 4px)' : '50%',
                          left: '50%',
                          transform: isPointMarker 
                            ? 'translateX(-50%)' 
                            : 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="px-3 py-1.5 bg-black/90 text-white text-sm rounded-md whitespace-nowrap shadow-lg">
                          {location.name}
                          {isPointMarker && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Map-only locations (no 360 views) */}
              {mapOnlyLocations.map((mapLocation) => {
                const position = getLocationPositionOnPage(mapLocation.locationName, currentMapIndex);
                if (!position) return null;
                
                const locationKey = `maponly-${mapLocation.locationName}`;
                const isSelected = selectedMapOnlyLocation?.name === mapLocation.locationName;
                
                // Calculate pixel positions from percentages
                const pixelPos = calculatePixelPosition(
                  position,
                  containerSize.width,
                  containerSize.height
                );
                
                return (
                  <div
                    key={locationKey}
                    data-location-marker
                    data-map-only
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      top: `${pixelPos.top}px`,
                      left: `${pixelPos.left}px`,
                      width: `${pixelPos.width}px`,
                      height: `${pixelPos.height}px`,
                      border: hoveredLocationId === locationKey || isSelected
                        ? '2px solid #28A745' 
                        : '2px solid transparent',
                      borderRadius: '4px',
                      transition: 'border-color 0.3s, background-color 0.3s',
                      backgroundColor: hoveredLocationId === locationKey || isSelected
                        ? 'rgba(40, 167, 69, 0.15)'
                        : 'transparent',
                      zIndex: hoveredLocationId === locationKey || isSelected ? 20 : 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log('[MapViewer] Map-only location clicked:', mapLocation.locationName);
                      if (onMapOnlyLocationClick) {
                        onMapOnlyLocationClick({
                          id: mapLocation.locationName.toLowerCase().replace(/\s+/g, '-'),
                          name: mapLocation.locationName,
                          type: mapLocation.type,
                          description: mapLocation.description,
                        });
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#28A745';
                      setHoveredLocationId(locationKey);
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                      setHoveredLocationId(null);
                    }}
                  >
                    {hoveredLocationId === locationKey && (
                      <div 
                        className="absolute pointer-events-none z-50"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="px-3 py-1.5 bg-black/90 text-white text-sm rounded-md whitespace-nowrap shadow-lg max-w-xs">
                          <div className="font-semibold">{mapLocation.locationName}</div>
                          {mapLocation.type && (
                            <div className="text-xs text-gray-300 mt-1">{mapLocation.type}</div>
                          )}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Previous Button */}
        {canGoPrevious && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto shadow-lg"
            onClick={handlePrevious}
            aria-label="Previous map"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Next Button */}
        {canGoNext && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto shadow-lg"
            onClick={handleNext}
            aria-label="Next map"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Top Controls Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-4 shadow-lg">
          {/* Map Counter */}
          <span className="text-white text-sm font-medium">
            Page {currentMapIndex + 1} of {MAP_IMAGES.length}
          </span>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={50}
              max={300}
              step={10}
              className="w-24"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-2">
          {MAP_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMapIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentMapIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

