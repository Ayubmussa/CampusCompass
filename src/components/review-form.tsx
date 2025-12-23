'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addReviewAction } from '@/app/actions';
import { StarRating } from './location-info-sheet';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/supabase';

type ReviewFormProps = {
  locationId: string;
  user: ReturnType<typeof useUser>['user'];
};

export function ReviewForm({ locationId, user }: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Please sign in to leave a review.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Incomplete Review',
        description: 'Please provide a rating and a comment.',
      });
      return;
    }
    
    setIsSubmitting(true);
    const result = await addReviewAction({
      locationId,
      rating,
      comment,
      userId: user.id,
      displayName: user.profile?.displayName || user.email?.split('@')[0] || 'User',
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });
      setRating(0);
      setComment('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Your Rating</label>
        <StarRating rating={rating} onRate={setRating} />
      </div>
      <Textarea
        placeholder="Share your thoughts about this location..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isSubmitting}
        rows={4}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}
