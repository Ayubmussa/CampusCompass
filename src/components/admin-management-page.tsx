'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase, useUser } from '@/supabase';
import { Loader2, UserPlus, Shield, User } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { isSuperAdmin } from '@/lib/admin-helpers';
import { assignPlaceToSubAdminAction, removePlaceFromSubAdminAction, updateAdminLevelAction } from '@/app/actions';

export function AdminManagementPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<string>('');

  // Fetch all users
  const usersQuery = useMemoSupabase(() => ({
    table: 'users',
    filter: (query: any) => query.order('created_at', { ascending: false }),
    __memo: true
  }), []);
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useCollection<any>(usersQuery);

  // Fetch all places
  const placesQuery = useMemoSupabase(() => ({
    table: 'places',
    filter: (query: any) => query.order('name', { ascending: true }),
    __memo: true
  }), []);
  const { data: placesData } = useCollection<any>(placesQuery);

  // Fetch place allocations
  const allocationsQuery = useMemoSupabase(() => ({
    table: 'place_allocations',
    __memo: true
  }), []);
  const { data: allocationsData, refetch: refetchAllocations } = useCollection<any>(allocationsQuery);

  if (!isSuperAdmin(user?.profile)) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive text-sm font-semibold">Access Denied</p>
        <p className="text-destructive text-sm mt-2">Only super admins can access this page.</p>
      </div>
    );
  }

  const allocations = allocationsData || [];
  const places = placesData || [];
  const users = usersData || [];

  const getUserAllocations = (userId: string) => {
    return allocations
      .filter((a: any) => a.user_id === userId)
      .map((a: any) => a.place_id);
  };

  const getPlaceName = (placeId: string) => {
    return places.find((p: any) => p.id === placeId)?.name || 'Unknown';
  };

  const handleUpdateAdminLevel = async (userId: string, newLevel: 'super_admin' | 'sub_admin' | null) => {
    const result = await updateAdminLevelAction(userId, newLevel);
    if (result.success) {
      toast({ title: 'Success', description: 'Admin level updated successfully.' });
      refetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleAssignPlace = async () => {
    if (!selectedUserId || !selectedPlaceId) return;
    
    const result = await assignPlaceToSubAdminAction(selectedUserId, selectedPlaceId);
    if (result.success) {
      toast({ title: 'Success', description: 'Place assigned successfully.' });
      refetchAllocations();
      setIsDialogOpen(false);
      setSelectedPlaceId('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleRemovePlace = async (userId: string, placeId: string) => {
    const result = await removePlaceFromSubAdminAction(userId, placeId);
    if (result.success) {
      toast({ title: 'Success', description: 'Place removed successfully.' });
      refetchAllocations();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Place to Sub-Admin
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Admin Level</TableHead>
              <TableHead>Allocated Places</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userItem: any) => {
              const allocatedPlaceIds = getUserAllocations(userItem.uid);
              return (
                <TableRow key={userItem.uid}>
                  <TableCell className="font-medium">
                    {userItem.display_name || userItem.email?.split('@')[0] || 'Unknown'}
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Select
                      value={userItem.admin_level || 'null'}
                      onValueChange={(value) => {
                        const level = value === 'null' ? null : value as 'super_admin' | 'sub_admin';
                        handleUpdateAdminLevel(userItem.uid, level);
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Regular User</SelectItem>
                        <SelectItem value="sub_admin">Sub Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {userItem.admin_level === 'sub_admin' ? (
                      <div className="space-y-1">
                        {allocatedPlaceIds.length > 0 ? (
                          allocatedPlaceIds.map((placeId: string) => (
                            <div key={placeId} className="flex items-center gap-2">
                              <span className="text-sm">{getPlaceName(placeId)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleRemovePlace(userItem.uid, placeId)}
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No places allocated</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedUserId(userItem.uid);
                            setIsDialogOpen(true);
                          }}
                        >
                          + Add Place
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {userItem.admin_level === 'super_admin' ? 'All places' : 'N/A'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {userItem.admin_level === 'super_admin' && (
                      <Shield className="h-4 w-4 text-primary inline-block" />
                    )}
                    {userItem.admin_level === 'sub_admin' && (
                      <User className="h-4 w-4 text-primary inline-block" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Place to Sub-Admin</DialogTitle>
            <DialogDescription>
              Select a place to assign to the sub-admin. They will be able to manage locations and maps for this place.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a place" />
              </SelectTrigger>
              <SelectContent>
                {places
                  .filter((place: any) => {
                    if (!selectedUserId) return true;
                    const userAllocations = getUserAllocations(selectedUserId);
                    return !userAllocations.includes(place.id);
                  })
                  .map((place: any) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignPlace} disabled={!selectedPlaceId || !selectedUserId}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

