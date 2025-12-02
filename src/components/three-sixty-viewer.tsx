'use client';

import * as React from 'react';
import type { Location } from '@/lib/locations';

type ThreeSixtyViewerProps = {
  location: Location | null;
  onHotspotClick: (targetLocationId: string) => void;
};

export function ThreeSixtyViewer({ location }: ThreeSixtyViewerProps) {
  if (!location) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-muted-foreground">Select a location or generate a tour to begin.</p>
      </div>
    );
  }

  if (!location.panoramaUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-muted-foreground">No panorama image available for this location.</p>
      </div>
    );
  }

  // At this point, `location` is guaranteed non-null due to early returns above
  const safeLocation = location as Exclude<Location | null, null>;

  const [mounted, setMounted] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [viewerError, setViewerError] = React.useState<string | null>(null);
  
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const viewerRef = React.useRef<any>(null);
  const initTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializingRef = React.useRef(false);
  const [containerReady, setContainerReady] = React.useState(false);

  // reset error state whenever the active location changes
  React.useEffect(() => {
    setViewerError(null);
    setIsInitializing(false);
    isInitializingRef.current = false;
  }, [safeLocation.id, safeLocation.panoramaUrl]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Callback ref to detect when container is actually in the DOM
  const containerCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerReady(!!node);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;

    // Helper function to check if container is ready
    function isContainerReady(): boolean {
      if (!containerRef.current) {
        console.log('[ThreeSixtyViewer] Container ref is null');
        return false;
      }
      
      // Check if element is in the document
      if (!containerRef.current.isConnected) {
        console.log('[ThreeSixtyViewer] Container not connected to DOM');
        return false;
      }
      
      return true;
    }

    async function initViewer() {
      // Wait for container to be ready with retry logic
      if (!isContainerReady()) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[ThreeSixtyViewer] Container not ready, retry ${retryCount}/${maxRetries}...`);
          // Retry after a short delay
          setTimeout(() => {
            if (isMounted) {
              initViewer();
            }
          }, 100);
          return;
        } else {
          console.error('[ThreeSixtyViewer] Container not ready after max retries');
          setViewerError('Failed to initialize viewer. Container element not available.');
          setIsInitializing(false);
          isInitializingRef.current = false;
          return;
        }
      }

      retryCount = 0; // Reset retry count on success
      console.log('[ThreeSixtyViewer] Container is ready, proceeding with initialization');

      setIsInitializing(true);
      isInitializingRef.current = true;
      setViewerError(null);

      // Set a timeout to detect if initialization is hanging
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      initTimeoutRef.current = setTimeout(() => {
        if (isMounted && isInitializingRef.current) {
          console.error('[ThreeSixtyViewer] Initialization timeout - viewer took too long to load');
          setViewerError('Viewer initialization timed out. Please try refreshing the page.');
          setIsInitializing(false);
          isInitializingRef.current = false;
        }
      }, 30000); // 30 second timeout

      try {
        console.log('[ThreeSixtyViewer] Starting viewer initialization...');
        // Dynamically import to avoid SSR/ bundling issues
        const psvModule = await import('@photo-sphere-viewer/core');
        console.log('[ThreeSixtyViewer] Photo Sphere Viewer module loaded');

        const Viewer = (psvModule as any).Viewer ?? (psvModule as any).default;

        if (!Viewer) {
          throw new Error('Photo Sphere Viewer class not found in module');
        }

        if (!isMounted) {
          console.log('[ThreeSixtyViewer] Component unmounted during import, aborting');
          return;
        }

        // Destroy previous instance if any
        if (viewerRef.current) {
          try { 
            viewerRef.current.destroy(); 
          } catch (e) { 
            console.warn('[ThreeSixtyViewer] Error destroying previous viewer:', e);
          }
          viewerRef.current = null;
        }

        // Final check before creating viewer - must be ready at this point
        if (!containerRef.current || !containerRef.current.isConnected) {
          throw new Error('Container element not available');
        }
        
        console.log('[ThreeSixtyViewer] Container verified, creating viewer...');

        console.log('[ThreeSixtyViewer] Creating viewer instance with panorama:', safeLocation.panoramaUrl);
        viewerRef.current = new Viewer({
          container: containerRef.current!,
          panorama: safeLocation.panoramaUrl,
          navbar: [
            'zoom',
            'move',
            {
              // minimal navbar text label
              id: 'title',
              content: safeLocation.name,
              className: 'px-2 text-sm opacity-80',
            },
            'fullscreen',
          ],
          defaultYaw: 0,
          touchmoveTwoFingers: true,
          mousewheelCtrlKey: true,
        });

        console.log('[ThreeSixtyViewer] Viewer instance created, setting up event listeners');

        // reset any previous error when a new panorama starts loading
        viewerRef.current.addEventListener('panorama-load', () => {
          console.log('[ThreeSixtyViewer] Panorama load started');
          setViewerError(null);
        });

        viewerRef.current.addEventListener('panorama-loaded', () => {
          console.log('[ThreeSixtyViewer] Panorama loaded successfully');
          setViewerError(null);
          setIsInitializing(false);
          isInitializingRef.current = false;
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
        });

        viewerRef.current.addEventListener('panorama-error', (event: any) => {
          const error = event?.detail || event;
          const message =
            error?.message ||
            (typeof error === 'string' ? error : 'Failed to load panorama image.');
          console.error('[ThreeSixtyViewer] Panorama load error:', error);
          setViewerError(message);
          setIsInitializing(false);
          isInitializingRef.current = false;
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
        });

        console.log('[ThreeSixtyViewer] Viewer initialization complete');
      } catch (error: any) {
        console.error('[ThreeSixtyViewer] Failed to initialise viewer:', error);
        setViewerError(error?.message ?? 'Failed to initialise panorama viewer.');
        setIsInitializing(false);
        isInitializingRef.current = false;
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
      }
    }

    // Only initialize when both mounted and container is ready
    if (mounted && containerReady) {
      console.log('[ThreeSixtyViewer] Mounted and container ready, scheduling initialization...');
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // Use requestAnimationFrame to ensure DOM is fully painted
      const rafId = requestAnimationFrame(() => {
        // Then use a small timeout to ensure everything is ready
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('[ThreeSixtyViewer] Calling initViewer...');
            initViewer();
          }
        }, 50);
      });

      return () => {
        cancelAnimationFrame(rafId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        isMounted = false;
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        if (viewerRef.current) {
          try { 
            viewerRef.current.destroy(); 
          } catch (e) {
            console.warn('[ThreeSixtyViewer] Error destroying viewer on cleanup:', e);
          }
          viewerRef.current = null;
        }
      };
    } else {
      console.log('[ThreeSixtyViewer] Not ready yet - mounted:', mounted, 'containerReady:', containerReady);
    }

    return () => {
      isMounted = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (viewerRef.current) {
        try { 
          viewerRef.current.destroy(); 
        } catch (e) {
          console.warn('[ThreeSixtyViewer] Error destroying viewer on cleanup:', e);
        }
        viewerRef.current = null;
      }
    };
  }, [mounted, containerReady, safeLocation.panoramaUrl, safeLocation.name]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading viewer…</p>
        </div>
      </div>
    );
  }

  if (viewerError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-100 px-6 text-center dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-destructive">Unable to load panorama</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {viewerError}
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          Please check your network connection or verify that the panorama URL is reachable.
        </p>
      </div>
    );
  }

  // Always render the container so it can be initialized, even if we're still initializing
  return (
    <div className="relative h-full w-full bg-black">
      <div ref={containerCallbackRef} className="absolute inset-0" />
      {isInitializing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-white">Initializing viewer…</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/50 p-4 text-white pointer-events-none">
        <h2 className="text-xl font-bold font-headline">{safeLocation.name}</h2>
        <p className="max-w-md text-sm">{safeLocation.description}</p>
      </div>
    </div>
  );
}
