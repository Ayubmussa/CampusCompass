'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase } from '@/supabase';
import { Loader2, PlusCircle } from 'lucide-react';
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
import { LocationForm } from './location-form';
import { deleteLocationAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { type Location } from '@/lib/locations';

export function LocationAdminPage() {
    const locationsQuery = useMemoSupabase(() => {
        return { table: 'locations', __memo: true };
    }, []);
    const { data: locationsData, isLoading: isLoadingLocations, error, refetch } = useCollection<any>(locationsQuery);
    
    // Map database fields to Location type
    const locations: Location[] | null = locationsData ? locationsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        panoramaUrl: item.panorama_url,
        thumbnailUrl: item.thumbnail_url,
        placeId: item.place_id,
        coordinates: item.coordinates,
        connections: item.connections || [],
    })) : null;

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
    const [locationToDelete, setLocationToDelete] = React.useState<Location | null>(null);

    const { toast } = useToast();

    const handleEdit = (location: Location) => {
        setSelectedLocation(location);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedLocation(null);
        setIsFormOpen(true);
    };

    const handleDelete = (location: Location) => {
        setLocationToDelete(location);
        setIsAlertOpen(true);
    }

    const confirmDelete = async () => {
        if (!locationToDelete) return;
        
        const result = await deleteLocationAction(locationToDelete.id);

        if (result.success) {
            toast({ title: "Location deleted", description: `"${locationToDelete.name}" has been removed.` });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsAlertOpen(false);
        setLocationToDelete(null);
    }
    
    // Log for debugging
    React.useEffect(() => {
        if (error) {
            console.error('Error loading locations in admin:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
            });
        }
        if (locationsData !== null) {
            console.log('Locations loaded in admin:', locationsData?.length || 0, 'items');
        }
    }, [locationsData, error]);

    if (error) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <p className="text-destructive text-sm font-semibold">Error loading locations</p>
                    <p className="text-destructive text-sm mt-2">{error.message}</p>
                    <Button onClick={() => refetch()} className="mt-4" variant="outline">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Campus Locations</h2>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Location
                </Button>
            </div>

            {isLoadingLocations && !locations ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                {!locations || locations.length === 0 ? (
                     <div className="text-center py-10 border rounded-lg">
                        <h2 className="text-xl font-bold mb-2">No Locations Found</h2>
                        <p className="text-muted-foreground">Add your first location to get started.</p>
                     </div>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations?.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-medium">{location.name}</TableCell>
                                        <TableCell className="max-w-sm truncate">{location.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(location)} className="mr-2">Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(location)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                </>
            )}
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                        <DialogDescription>
                            {selectedLocation 
                                ? 'Update the location information below.'
                                : 'Fill in the details to create a new campus location.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <LocationForm 
                        location={selectedLocation}
                        onFormSubmit={async () => {
                            setIsFormOpen(false);
                            // Manually refetch to ensure new location appears
                            await refetch();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the location
                        "{locationToDelete?.name}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
