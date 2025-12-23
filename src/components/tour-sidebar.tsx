
'use client';

import * as React from 'react';
import { getTourRecommendationsAction, saveTourAction, type TourRecommendationState } from '@/app/actions';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  LogOut,
  Save,
  Shield,
  Sparkles,
  User,
  Volume2,
  Wand2,
  Info,
  MapPin,
  Map,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase, useCollection, useMemoSupabase, useUser } from '@/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { type Location } from '@/lib/locations';

type ViewMode = 'locations' | 'maps';

type TourSidebarProps = {
  onStartTour: (ids: string[]) => void;
  onLocationSelect: (id: string) => void;
  isTtsEnabled: boolean;
  onTtsToggle: (enabled: boolean) => void;
  rotationSpeed: number;
  onRotationSpeedChange: (speed: number) => void;
  onInfoClick: (location: Location) => void;
  currentLocationId: string | null;
  allLocations: Location[];
  isLoading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Generate Tour
    </Button>
  );
}

function UserProfile() {
  const supabase = useSupabase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSignIn = () => {
    router.push('/login');
  };
  
  const handleGoToAdmin = () => {
    router.push('/admin');
  }

  if (isUserLoading) {
    return <div className="flex items-center justify-center p-2"><Loader2 className="animate-spin h-5 w-5" /></div>;
  }

  return (
    <div className="p-3">
      {user && supabase ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-8 w-8">
              {user.profile?.photoURL && <AvatarImage src={user.profile.photoURL} alt={user.profile.displayName || 'User'} />}
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden text-sm">
              <p className="font-medium truncate">{user.email || 'User'}</p>
            </div>
          </div>
          <div className='flex items-center'>
            {user.profile?.isAdmin && (
                <Button variant="ghost" size="icon" onClick={handleGoToAdmin} title="Go to Admin">
                    <Shield className="h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleSignIn} className="w-full">
          Sign In
        </Button>
      )}
    </div>
  );
}

type SavedTour = {
    id: string;
    name: string;
    description: string;
    locationIds: string[];
}

function SavedTours({ onStartTour }: { onStartTour: (ids: string[]) => void }) {
    const { user, isUserLoading } = useUser();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const savedToursQuery = useMemoSupabase(() => {
        if (!user) return null;
        return { 
            table: 'saved_tours',
            select: '*',
            filter: (query: any) => query.eq('user_id', user.id).order('created_at', { ascending: false }),
            __memo: true 
        };
    }, [user]);

    const { data: savedToursData, isLoading } = useCollection<any>(savedToursQuery);
    
    // Map saved tours to match SavedTour type
    const savedTours: SavedTour[] | null = savedToursData 
        ? savedToursData.map((tour: any) => ({
            id: tour.id,
            name: tour.name,
            description: tour.description,
            locationIds: tour.location_ids || [],
        }))
        : null;

    if (!isMounted || isUserLoading) {
      // On the server or while loading, render a placeholder or nothing to prevent hydration mismatch
      return null;
    }
    
    if (!user) return null;


    return (
        <>
            <SidebarSeparator />
            <SidebarGroup>
            <SidebarGroupLabel>
              <Link href="/tours" className="hover:underline">
                My Tours
              </Link>
            </SidebarGroupLabel>
                {isLoading && <div className='px-2'><Loader2 className="animate-spin" /></div>}
                {savedTours && savedTours.length > 0 && (
                    <SidebarMenu>
                        {savedTours.map(tour => (
                            <SidebarMenuItem key={tour.id}>
                                <SidebarMenuButton onClick={() => onStartTour(tour.locationIds)} className="justify-between h-auto flex-col items-start">
                                    <div className="font-semibold">{tour.name}</div>
                                    <div className="text-xs text-muted-foreground text-wrap">{tour.description}</div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                )}
                 {savedTours && savedTours.length === 0 && !isLoading && (
                    <p className="px-2 text-sm text-muted-foreground">You have no saved tours.</p>
                )}
            </SidebarGroup>
        </>
    )
}


export function TourSidebar({
  onStartTour,
  onLocationSelect,
  isTtsEnabled,
  onTtsToggle,
  rotationSpeed,
  onRotationSpeedChange,
  onInfoClick,
  currentLocationId,
  allLocations,
  isLoading,
  viewMode,
  onViewModeChange,
}: TourSidebarProps) {
  const { toast } = useToast();
  const { user } = useUser();
  
  const [state, setState] = React.useState<TourRecommendationState>({ recommendations: null, error: null });
  const [isPending, setIsPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await getTourRecommendationsAction(state, formData);
    
    setState(result);
    setIsPending(false);
  };
  
  const handleSaveTour = async () => {
    if (!state.recommendations || !state.tourName || !state.tourDescription || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot save tour. Missing data.' });
        return;
    }

    const result = await saveTourAction({
        name: state.tourName,
        description: state.tourDescription,
        locationIds: state.recommendations.ids,
        userId: user.id,
    });

    if (result.success) {
        toast({ title: 'Tour Saved!', description: `"${state.tourName}" has been added to your tours.` });
    } else {
        toast({ variant: 'destructive', title: 'Save Failed', description: result.error });
    }
  };

  React.useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);
  
  React.useEffect(() => {
    if (state.recommendations) {
        onStartTour(state.recommendations.ids);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.recommendations]);


  return (
    <>
      {/* <SidebarHeader className='hidden md:flex'>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <a href="/" aria-label="Home">
                <Map />
              </a>
            </Button>
            <h1 className="font-headline text-xl font-semibold">UniSphere 360</h1>
          </div>
        </div>
      </SidebarHeader> */}

      <ScrollArea className="flex-grow">
        <SidebarContent>
          {/* Location-specific content - only show in locations mode */}
          {viewMode === 'locations' && (
            <>
          <SidebarGroup>
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="font-headline text-base hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Wand2 className="size-5 text-primary" />
                    AI Guided Tour
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Describe your interests and let our AI create a personalized tour for you.
                  </p>
                  <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                    <Textarea
                      name="interests"
                      placeholder="e.g., prospective computer science student"
                      rows={3}
                      disabled={isPending}
                    />
                    <SubmitButton isPending={isPending} />
                  </form>
                  {state.recommendations && state.tourName && (
                    <div className="space-y-3 rounded-lg border bg-card p-3">
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-grow'>
                              <h4 className="font-headline font-semibold">{state.tourName}</h4>
                              <p className="text-sm text-muted-foreground">{state.tourDescription}</p>
                          </div>
                          {user && (
                            <Button size="icon" variant="ghost" onClick={handleSaveTour} title="Save Tour">
                                <Save className="size-4" />
                            </Button>
                          )}
                        </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroup>

          <SidebarSeparator />
          
          <SidebarGroup>
            <SidebarGroupLabel>
              <Link href="/locations" className="hover:underline">
                All Locations
              </Link>
            </SidebarGroupLabel>
             {isLoading && !allLocations?.length ? (
                <div className='px-2'><Loader2 className="animate-spin" /></div>
             ) : (
                <SidebarMenu>
                {allLocations.map((location) => (
                    <SidebarMenuItem key={location.id}>
                    <SidebarMenuButton 
                        onClick={() => onLocationSelect(location.id)}
                        isActive={currentLocationId === location.id && (!state.recommendations || state.recommendations.ids.length === 0)}
                    >
                        <span>{location.name}</span>
                    </SidebarMenuButton>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => onInfoClick(location)}
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
             )}
          </SidebarGroup>
          
          <SavedTours onStartTour={onStartTour} />
          </>
          )}

          {/* Maps mode info */}
          {viewMode === 'maps' && (
            <SidebarGroup>
              <SidebarGroupLabel>Maps</SidebarGroupLabel>
              <p className="px-2 text-sm text-muted-foreground">
                Browse through the campus maps. Use the navigation controls to move between pages, zoom in/out, and view in fullscreen.
              </p>
            </SidebarGroup>
          )}
          
        </SidebarContent>
      </ScrollArea>
      
      <SidebarSeparator />
      <SidebarFooter>
        <div className="p-2 space-y-4">
          <Label className="font-headline text-base">Settings</Label>
          {viewMode === 'locations' && (
            <>
              <div className="flex items-center justify-between">
                <div className='flex items-center gap-2'>
                  <Volume2 className="size-5" />
                  <Label htmlFor="tts-switch">Text-to-Speech</Label>
                </div>
                <Switch id="tts-switch" checked={isTtsEnabled} onCheckedChange={onTtsToggle} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rotation-speed">Auto-rotate Speed</Label>
                <Slider
                  id="rotation-speed"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[rotationSpeed]}
                  onValueChange={(value) => onRotationSpeedChange(value[0])}
                />
              </div>
            </>
          )}
          {viewMode === 'maps' && (
            <p className="text-sm text-muted-foreground">
              Use arrow keys to navigate between maps, +/- to zoom, and click the fullscreen button for a better view.
            </p>
          )}
        </div>
      </SidebarFooter>
       <SidebarSeparator />
      <SidebarFooter>
        {/* View Mode Switcher */}
        <div className="p-2 space-y-2">
          <Label className="font-headline text-base">View Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'locations' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onViewModeChange('locations')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </Button>
            <Button
              variant={viewMode === 'maps' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onViewModeChange('maps')}
            >
              <Map className="h-4 w-4 mr-2" />
              Maps
            </Button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarSeparator />
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </>
  );
}
