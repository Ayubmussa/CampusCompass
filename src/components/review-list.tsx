'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase } from '@/supabase';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from './location-info-sheet';
import { formatDistanceToNow } from 'date-fns';

type Review = {
  id: string;
  rating: number;
  comment: string;
  user_id: string;
  display_name: string;
  created_at: string;
};

type ReviewListProps = {
  locationId: string;
};

export function ReviewList({ locationId }: ReviewListProps) {
  const reviewsQuery = useMemoSupabase(() => {
    if (!locationId) return null;
    return { 
      table: 'reviews', 
      select: '*',
      filter: (query: any) => query.eq('location_id', locationId).order('created_at', { ascending: false }),
      __memo: true 
    };
  }, [locationId]);

  const { data: filteredReviews, isLoading, error } = useCollection<Review>(reviewsQuery);

  if (isLoading) {
    return <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin" /></div>;
  }
  
  if (error) {
    console.error(error);
    return <p className="text-destructive text-sm">Could not load reviews.</p>;
  }

  if (!filteredReviews || filteredReviews.length === 0) {
    return <p className="text-muted-foreground text-sm">Be the first to review this location!</p>;
  }

  return (
    <div className="space-y-4">
      {filteredReviews.map(review => (
        <Card key={review.id}>
          <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
            <Avatar>
                <AvatarFallback>{review.display_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <CardTitle className="text-sm font-medium">{review.display_name || 'User'}</CardTitle>
                <p className="text-xs text-muted-foreground">
                {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : ''}
                </p>
            </div>
            <StarRating rating={review.rating} onRate={() => {}} readOnly />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
