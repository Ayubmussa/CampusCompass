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
import { MapForm } from './map-form';
import { deleteMapAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { type Map } from '@/lib/maps';
import { useUser } from '@/supabase';
import { isSuperAdmin, canManagePlace } from '@/lib/admin-helpers';
import Image from 'next/image';

export function MapAdminPage() {
    const { user } = useUser();
    const mapsQuery = useMemoSupabase(() => {
        return { 
            table: 'maps',
            filter: (query: any) => query.order('place_id', { ascending: true }).order('page_number', { ascending: true }),
            __memo: true 
        };
    }, []);
    const { data: mapsData, isLoading: isLoadingMaps, error, refetch } = useCollection<any>(mapsQuery);
    
    // Map database fields to Map type
    const allMaps: Map[] | null = mapsData ? mapsData.map((item: any) => ({
        id: item.id,
        place_id: item.place_id,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        page_number: item.page_number,
        created_at: item.created_at,
        updated_at: item.updated_at,
    })) : null;

    // Filter maps based on admin level and allocated places
    const maps: Map[] | null = React.useMemo(() => {
        if (!allMaps || !user?.profile) return null;
        
        if (isSuperAdmin(user.profile)) {
            return allMaps; // Super admin sees all maps
        }
        
        // Sub-admin only sees maps for their allocated places
        return allMaps.filter(map => canManagePlace(user.profile, map.place_id));
    }, [allMaps, user?.profile]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedMap, setSelectedMap] = React.useState<Map | null>(null);
    const [mapToDelete, setMapToDelete] = React.useState<Map | null>(null);

    const { toast } = useToast();

    const handleEdit = (map: Map) => {
        setSelectedMap(map);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedMap(null);
        setIsFormOpen(true);
    };

    const handleDelete = (map: Map) => {
        setMapToDelete(map);
        setIsAlertOpen(true);
    }

    const confirmDelete = async () => {
        if (!mapToDelete) return;
        
        const result = await deleteMapAction(mapToDelete.id);

        if (result.success) {
            toast({ title: "Map deleted", description: `"${mapToDelete.name}" has been removed.` });
            refetch();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsAlertOpen(false);
        setMapToDelete(null);
    }

    const handleFormSubmit = () => {
        setIsFormOpen(false);
        setSelectedMap(null);
        refetch();
    };

    if (isLoadingMaps) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <p className="text-destructive">Error loading maps: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-semibold">Maps</h2>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Map
                </Button>
            </div>

            {maps && maps.length > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Preview</TableHead>
                                <TableHead>Place ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Page #</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {maps.map((map) => (
                                <TableRow key={map.id}>
                                    <TableCell>
                                        {map.image_url ? (
                                            <div className="relative h-16 w-24 overflow-hidden rounded">
                                                <Image
                                                    src={map.image_url}
                                                    alt={map.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                                                <span className="text-xs text-muted-foreground">No image</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{map.place_id.substring(0, 8)}...</TableCell>
                                    <TableCell className="font-medium">{map.name}</TableCell>
                                    <TableCell>{map.page_number || '-'}</TableCell>
                                    <TableCell className="max-w-md truncate">{map.description || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(map)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(map)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-md border p-8 text-center">
                    <p className="text-muted-foreground">No maps found. Create your first map to get started.</p>
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedMap ? 'Edit Map' : 'Add New Map'}</DialogTitle>
                        <DialogDescription>
                            {selectedMap
                                ? 'Update the map information below.'
                                : 'Fill in the details to create a new map.'}
                        </DialogDescription>
                    </DialogHeader>
                    <MapForm map={selectedMap} onFormSubmit={handleFormSubmit} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the map
                            &quot;{mapToDelete?.name}&quot;.
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

