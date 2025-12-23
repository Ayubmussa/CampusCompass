'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Volume2, MicOff, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { ReviewForm } from './review-form';
import { ReviewList } from './review-list';
import { useUser } from '@/supabase';
import { ScrollArea } from './ui/scroll-area';
import { type Location } from '@/lib/locations';

type LocationInfoSheetProps = {
  location: Location | null;
  onOpenChange: (isOpen: boolean) => void;
  isTtsEnabled: boolean;
};

type StarRatingProps = {
  totalStars?: number;
  rating: number;
  onRate?: (value: number) => void;
  readOnly?: boolean;
};

function StarRating({ totalStars = 5, rating, onRate, readOnly = false }: StarRatingProps) {
  const [hover, setHover] = React.useState(0);
  const effectiveRating = rating || 0;

  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !readOnly && onRate && onRate(starValue)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
            disabled={readOnly}
          >
            <Star
              className={`h-5 w-5 ${
                starValue <= (hover || effectiveRating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}


export function LocationInfoSheet({
  location,
  onOpenChange,
  isTtsEnabled,
}: LocationInfoSheetProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = React.useState(false);

  React.useEffect(() => {
    setIsSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const handleReadAloud = () => {
    if (!isSpeechSupported || !location) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Feature',
        description: 'Text-to-speech is not supported on your browser.',
      });
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${location.name}. ${location.description}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        variant: 'destructive',
        title: 'Speech Error',
        description: 'Could not read the text aloud.',
      });
    }
    window.speechSynthesis.speak(utterance);
  };
  
  // Cancel speech when sheet closes
  React.useEffect(() => {
    if (!location && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [location, isSpeaking]);

  return (
    <Sheet open={!!location} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        {location && (
          <>
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl">{location.name}</SheetTitle>
              <SheetDescription>{location.description}</SheetDescription>
            </SheetHeader>
            {isTtsEnabled && isSpeechSupported && (
              <div className="mt-4">
                <Button variant="outline" onClick={handleReadAloud}>
                  {isSpeaking ? <MicOff /> : <Volume2 />}
                  {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                </Button>
              </div>
            )}
            <Separator className="my-4" />

            <div className="flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="pr-6">
                        <h3 className="font-headline text-lg mb-2">Reviews & Ratings</h3>
                        {user && <ReviewForm locationId={location.id} user={user} />}
                        <Separator className="my-4" />
                        <ReviewList locationId={location.id} />
                    </div>
                </ScrollArea>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { StarRating };
