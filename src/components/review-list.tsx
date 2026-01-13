'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase } from '@/supabase';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from './location-info-sheet';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { updateReviewAction, deleteReviewAction } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

type Review = {
  id: string;
  rating: number;
  comment: string;
  user_id: string;
  display_name: string;
  created_at: string;
  updated_at?: string;
};

type ReviewListProps = {
  locationId: string;
};

export function ReviewList({ locationId }: ReviewListProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [editingReviewId, setEditingReviewId] = React.useState<string | null>(null);
  const [editRating, setEditRating] = React.useState(0);
  const [editComment, setEditComment] = React.useState('');
  const [deleteReviewId, setDeleteReviewId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // Listen for review added event to refresh
  React.useEffect(() => {
    const handleReviewAdded = () => {
      // The useCollection hook should automatically refresh due to real-time subscriptions
      // But we can force a refresh if needed
    };
    window.addEventListener('reviewAdded', handleReviewAdded);
    return () => window.removeEventListener('reviewAdded', handleReviewAdded);
  }, []);

  const handleEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleSaveEdit = async () => {
    if (!editingReviewId || !user) return;

    if (editRating < 1 || editRating > 5) {
      toast({
        variant: 'destructive',
        title: 'Invalid Rating',
        description: 'Please select a rating between 1 and 5 stars.',
      });
      return;
    }

    if (editComment.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Incomplete Review',
        description: 'Please provide a comment.',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await updateReviewAction({
      reviewId: editingReviewId,
      rating: editRating,
      comment: editComment.trim(),
      userId: user.id,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Review Updated!',
        description: 'Your review has been updated.',
      });
      handleCancelEdit();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId || !user) return;

    setIsSubmitting(true);
    const result = await deleteReviewAction(deleteReviewId, user.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Review Deleted',
        description: 'Your review has been deleted.',
      });
      setDeleteReviewId(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    }
  };

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

  // Calculate average rating
  const avgRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <div className="flex items-center gap-1">
          <StarRating rating={Math.round(avgRating)} onRate={() => {}} readOnly />
          <span className="text-sm font-medium ml-2">
            {avgRating.toFixed(1)} ({filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {filteredReviews.map(review => {
        const isOwnReview = user?.id === review.user_id;
        const isEditing = editingReviewId === review.id;

        return (
          <Card key={review.id}>
            {isEditing ? (
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Rating</label>
                  <StarRating rating={editRating} onRate={setEditRating} />
                </div>
                <Textarea
                  placeholder="Share your thoughts about this location..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} disabled={isSubmitting} size="sm">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                  <Avatar>
                    <AvatarFallback>{review.display_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <CardTitle className="text-sm font-medium">{review.display_name || 'User'}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : ''}
                      {review.updated_at && review.updated_at !== review.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} onRate={() => {}} readOnly />
                    {isOwnReview && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(review)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteReviewId(review.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm">{review.comment}</p>
                </CardContent>
              </>
            )}
          </Card>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteReviewId !== null} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
