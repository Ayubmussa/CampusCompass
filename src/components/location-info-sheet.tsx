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
import { Volume2, MicOff, Star, Phone, Mail, Globe, MapPin, Clock, DollarSign, Users, ExternalLink, Video, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { ReviewForm } from './review-form';
import { ReviewList } from './review-list';
import { useUser } from '@/supabase';
import { ScrollArea } from './ui/scroll-area';
import { type Location } from '@/lib/locations';
import { Badge } from './ui/badge';
import Image from 'next/image';

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
              <SheetDescription>
                {location.richDescription ? (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert" 
                    dangerouslySetInnerHTML={{ __html: location.richDescription }} 
                  />
                ) : (
                  location.description
                )}
              </SheetDescription>
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
                    <div className="pr-6 space-y-6">
                        {/* Contact Information */}
                        {location.contactInfo && (
                          <div>
                            <h3 className="font-headline text-lg mb-3">Contact Information</h3>
                            <div className="space-y-2">
                              {location.contactInfo.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <a href={`tel:${location.contactInfo.phone}`} className="hover:underline">
                                    {location.contactInfo.phone}
                                  </a>
                                </div>
                              )}
                              {location.contactInfo.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <a href={`mailto:${location.contactInfo.email}`} className="hover:underline">
                                    {location.contactInfo.email}
                                  </a>
                                </div>
                              )}
                              {location.contactInfo.website && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <a href={location.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                    {location.contactInfo.website}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              {location.contactInfo.address && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{location.contactInfo.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        {(location.pricingInfo || location.capacity) && (
                          <div>
                            <h3 className="font-headline text-lg mb-3">Additional Information</h3>
                            <div className="space-y-2">
                              {location.pricingInfo && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>{location.pricingInfo}</span>
                                </div>
                              )}
                              {location.capacity && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>Capacity: {location.capacity} people</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Opening Hours */}
                        {location.openingHours && (
                          <div>
                            <h3 className="font-headline text-lg mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Opening Hours
                            </h3>
                            <div className="space-y-1 text-sm">
                              {Object.entries(location.openingHours).map(([day, hours]) => (
                                <div key={day} className="flex justify-between">
                                  <span className="capitalize font-medium">{day}:</span>
                                  <span>
                                    {hours.closed ? (
                                      <span className="text-muted-foreground">Closed</span>
                                    ) : (
                                      `${hours.open || 'N/A'} - ${hours.close || 'N/A'}`
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Media */}
                        {(location.videoUrl || location.audioUrl) && (
                          <div>
                            <h3 className="font-headline text-lg mb-3">Media</h3>
                            <div className="space-y-3">
                              {location.videoUrl && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Video</span>
                                  </div>
                                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                    {location.videoUrl.includes('youtube.com') || location.videoUrl.includes('youtu.be') ? (
                                      <iframe
                                        src={location.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    ) : location.videoUrl.includes('vimeo.com') ? (
                                      <iframe
                                        src={location.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video src={location.videoUrl} controls className="w-full h-full" />
                                    )}
                                  </div>
                                </div>
                              )}
                              {location.audioUrl && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Music className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Audio Narration</span>
                                  </div>
                                  <audio src={location.audioUrl} controls className="w-full" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Related Links */}
                        {location.relatedLinks && location.relatedLinks.length > 0 && (
                          <div>
                            <h3 className="font-headline text-lg mb-3">Related Links</h3>
                            <div className="space-y-2">
                              {location.relatedLinks.map((link, index) => (
                                <a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Reviews */}
                        <div>
                          <h3 className="font-headline text-lg mb-2">Reviews & Ratings</h3>
                          {user && <ReviewForm locationId={location.id} user={user} />}
                          <Separator className="my-4" />
                          <ReviewList locationId={location.id} />
                        </div>
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
