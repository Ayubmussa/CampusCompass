'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase } from '@/supabase';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PlaceForm } from './place-form';
import { deletePlaceAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { type Place } from '@/lib/places';
import { useUser } from '@/supabase';
import { isSuperAdmin, canManagePlace } from '@/lib/admin-helpers';
import Image from 'next/image';

export function PlaceAdminPage() {
    const { user } = useUser();
    const placesQuery = useMemoSupabase(() => {
        return { 
            table: 'places',
            filter: (query: any) => query.order('name', { ascending: true }),
            __memo: true 
        };
    }, []);
    const { data: placesData, isLoading: isLoadingPlaces, error, refetch } = useCollection<any>(placesQuery);
    
    // Map database fields to Place type and filter by admin permissions
    const allPlaces: Place[] | null = placesData ? placesData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        thumbnailUrl: item.thumbnail_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
    })) : null;

    // Filter places based on admin level
    const places: Place[] | null = React.useMemo(() => {
        if (!allPlaces || !user?.profile) return null;
        
        if (isSuperAdmin(user.profile)) {
            return allPlaces; // Super admin sees all places
        }
        
        // Sub-admin only sees their allocated places
        return allPlaces.filter(place => canManagePlace(user.profile, place.id));
    }, [allPlaces, user?.profile]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedPlace, setSelectedPlace] = React.useState<Place | null>(null);
    const [placeToDelete, setPlaceToDelete] = React.useState<Place | null>(null);

    const { toast } = useToast();

    const handleEdit = (place: Place) => {
        setSelectedPlace(place);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedPlace(null);
        setIsFormOpen(true);
    };

    const handleDelete = (place: Place) => {
        setPlaceToDelete(place);
        setIsAlertOpen(true);
    }

    const confirmDelete = async () => {
        if (!placeToDelete) return;
        
        const result = await deletePlaceAction(placeToDelete.id);

        if (result.success) {
            toast({ title: "Place deleted", description: `"${placeToDelete.name}" has been removed.` });
            refetch();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsAlertOpen(false);
        setPlaceToDelete(null);
    }

    const handleFormSubmit = () => {
        setIsFormOpen(false);
        setSelectedPlace(null);
        refetch();
    };

    if (isLoadingPlaces) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <p className="text-destructive">Error loading places: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }

    const canManagePlaces = isSuperAdmin(user?.profile);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-semibold">Places</h2>
                {canManagePlaces && (
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Place
                    </Button>
                )}
            </div>

            {places && places.length > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Thumbnail</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                {canManagePlaces && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {places.map((place) => (
                                <TableRow key={place.id}>
                                    <TableCell>
                                        {place.thumbnailUrl ? (
                                            <div className="relative h-16 w-16 overflow-hidden rounded">
                                                <Image
                                                    src={place.thumbnailUrl}
                                                    alt={place.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                                                <span className="text-xs text-muted-foreground">No image</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{place.name}</TableCell>
                                    <TableCell className="max-w-md truncate">{place.description}</TableCell>
                                    <TableCell className="text-right">
                                        {canManagePlaces && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(place)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(place)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-md border p-8 text-center">
                    <p className="text-muted-foreground">No places found. Create your first place to get started.</p>
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedPlace ? 'Edit Place' : 'Add New Place'}</DialogTitle>
                        <DialogDescription>
                            {selectedPlace
                                ? 'Update the place information below.'
                                : 'Fill in the details to create a new place.'}
                        </DialogDescription>
                    </DialogHeader>
                    <PlaceForm place={selectedPlace} onFormSubmit={handleFormSubmit} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the place
                            &quot;{placeToDelete?.name}&quot; and all associated locations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

