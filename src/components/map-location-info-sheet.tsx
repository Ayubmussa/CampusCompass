'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type MapOnlyLocation = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type MapLocationInfoSheetProps = {
  location: MapOnlyLocation | null;
  onOpenChange: (isOpen: boolean) => void;
};

export function MapLocationInfoSheet({
  location,
  onOpenChange,
}: MapLocationInfoSheetProps) {
  return (
    <Sheet open={!!location} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        {location && (
          <>
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl">{location.name}</SheetTitle>
              {location.type && (
                <SheetDescription>
                  <span className="font-semibold">Type:</span> {location.type}
                </SheetDescription>
              )}
            </SheetHeader>
            
            <div className="mt-6 flex-grow">
              {location.description ? (
                <p className="text-muted-foreground">{location.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  This is a map-only location. Click on the map to view other locations.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

