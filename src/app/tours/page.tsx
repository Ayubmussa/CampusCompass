'use client';

import * as React from 'react';
import Link from 'next/link';
import { useUser, useCollection, useMemoSupabase } from '@/supabase';
import { deleteTourAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

type SavedTourRecord = {
  id: string;
  name: string;
  description: string | null;
  location_ids: string[] | null;
  created_at: string;
};

export default function ToursPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [tourToDelete, setTourToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const savedToursQuery = useMemoSupabase(() => {
    if (!user) return null;
    return {
      table: 'saved_tours',
      select: 'id, name, description, location_ids, created_at',
      filter: (query: any) => query.eq('user_id', user.id).order('created_at', { ascending: false }),
      __memo: true,
    };
  }, [user]);

  const { data: toursData, isLoading } = useCollection<SavedTourRecord>(savedToursQuery);
  const tours = toursData ?? [];

  const handleDeleteClick = (tourId: string) => {
    setTourToDelete(tourId);
  };

  const handleDeleteConfirm = async () => {
    if (!tourToDelete) return;

    setIsDeleting(true);
    const result = await deleteTourAction(tourToDelete);
    setIsDeleting(false);
    setTourToDelete(null);

    if (result.success) {
      toast({
        title: 'Tour deleted',
        description: 'The tour has been successfully deleted.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: result.error || 'Failed to delete the tour.',
      });
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <h1 className="text-3xl font-headline font-semibold">My Tours</h1>
        <p className="text-muted-foreground">
          Please sign in to view and manage your saved tours.
        </p>
        <Link href="/login" className="text-primary hover:underline text-sm">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold">My Tours</h1>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to tour
          </Link>
        </div>
        {tours.length === 0 ? (
          <p className="text-muted-foreground">You have not saved any tours yet.</p>
        ) : (
          <div className="space-y-4">
            {tours.map((tour) => (
              <article
                key={tour.id}
                className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-headline font-semibold">{tour.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tour.description ?? 'No description provided.'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tour.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tour.location_ids?.length
                      ? `${tour.location_ids.length} location${tour.location_ids.length > 1 ? 's' : ''}`
                      : 'No locations included'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/?tour=${tour.id}`}
                      className="text-primary hover:underline"
                    >
                      Load tour
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(tour.id)}
                      title="Delete tour"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={tourToDelete !== null} onOpenChange={(open) => !open && setTourToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tour</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tour? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

