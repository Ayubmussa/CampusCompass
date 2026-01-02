'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase, useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { type Collection } from '@/lib/collections';
import { CollectionForm } from './collection-form';
import { deleteCollectionAction } from '@/app/actions';
import { isSuperAdmin, canManagePlace } from '@/lib/admin-helpers';

export function CollectionAdminPage() {
    const { user } = useUser();
    const collectionsQuery = useMemoSupabase(() => {
        return { table: 'collections', __memo: true };
    }, []);
    const { data: collectionsData, isLoading, error, refetch } = useCollection<any>(collectionsQuery);
    
    // Map database fields to Collection type
    const allCollections: Collection[] | null = collectionsData
        ? collectionsData.map((item: any) => ({
            id: item.id,
            place_id: item.place_id,
            name: item.name,
            description: item.description,
            thumbnail_url: item.thumbnail_url,
            is_featured: item.is_featured || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            created_by: item.created_by,
        }))
        : null;

    // Filter collections based on admin level and allocated places
    const collections: Collection[] | null = React.useMemo(() => {
        if (!allCollections || !user?.profile) return null;
        
        if (isSuperAdmin(user.profile)) {
            return allCollections; // Super admin sees all collections
        }
        
        // Sub-admin only sees collections for their allocated places
        return allCollections.filter(collection => 
            canManagePlace(user.profile, collection.place_id)
        );
    }, [allCollections, user?.profile]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedCollection, setSelectedCollection] = React.useState<Collection | null>(null);
    const [collectionToDelete, setCollectionToDelete] = React.useState<Collection | null>(null);

    const { toast } = useToast();

    const handleEdit = (collection: Collection) => {
        setSelectedCollection(collection);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCollection(null);
        setIsFormOpen(true);
    };

    const handleDelete = (collection: Collection) => {
        setCollectionToDelete(collection);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!collectionToDelete) return;

        const result = await deleteCollectionAction(collectionToDelete.id);
        if (result.success) {
            toast({
                title: 'Collection Deleted',
                description: `"${collectionToDelete.name}" has been removed.`,
            });
            refetch();
        } else {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: result.error || 'Failed to delete collection.',
            });
        }
        setIsAlertOpen(false);
        setCollectionToDelete(null);
    };

    const handleFormSubmit = () => {
        setIsFormOpen(false);
        setSelectedCollection(null);
        refetch();
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="text-destructive text-sm font-semibold">Error Loading Collections</p>
                <p className="text-destructive text-sm mt-2">{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
            </div>
        );
    }

    const canManageCollections = isSuperAdmin(user?.profile) || (user?.profile?.adminLevel === 'sub_admin' && user.profile.allocatedPlaces && user.profile.allocatedPlaces.length > 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-semibold">Collections</h2>
                {canManageCollections && (
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Collection
                    </Button>
                )}
            </div>

            {collections && collections.length > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Place</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Featured</TableHead>
                                {canManageCollections && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collections.map((collection) => (
                                <TableRow key={collection.id}>
                                    <TableCell className="font-medium">{collection.name}</TableCell>
                                    <TableCell>{collection.place_id}</TableCell>
                                    <TableCell className="max-w-md truncate">{collection.description || '-'}</TableCell>
                                    <TableCell>{collection.is_featured ? 'Yes' : 'No'}</TableCell>
                                    {canManageCollections && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(collection)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(collection)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>No Collections</CardTitle>
                        <CardDescription>
                            {canManageCollections
                                ? 'Get started by creating your first collection.'
                                : 'No collections are available for your allocated places.'}
                        </CardDescription>
                    </CardHeader>
                    {canManageCollections && (
                        <CardContent>
                            <Button onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Collection
                            </Button>
                        </CardContent>
                    )}
                </Card>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedCollection ? 'Edit Collection' : 'Add New Collection'}</DialogTitle>
                        <DialogDescription>
                            {selectedCollection ? 'Update the collection details.' : 'Create a new collection to group related locations.'}
                        </DialogDescription>
                    </DialogHeader>
                    <CollectionForm collection={selectedCollection} onFormSubmit={handleFormSubmit} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone.
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

