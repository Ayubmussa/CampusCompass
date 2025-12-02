'use client';

import { useUser } from '@/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LocationAdminPage } from '@/components/location-admin-page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';

export default function AdminPage() {
  // isUserLoading is for auth state, isProfileLoading is for Firestore profile data
  const { user, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();

  // We are only "done" loading when both are false.
  const isLoading = isUserLoading || isProfileLoading;

  React.useEffect(() => {
    // This effect should ONLY run when loading is fully complete.
    if (isLoading) {
      return; // Do nothing while loading.
    }
    
    // After all loading is done, if there's no user, or they aren't an admin, redirect.
    if (!user || !user.profile?.isAdmin) {
        router.push('/');
    }
  }, [isLoading, user, router]);


  // Show a loading spinner if ANY loading is in progress.
  // This is the gatekeeper that prevents the non-admin redirect from firing too early.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // After loading, if the user still isn't an admin, they are being redirected.
  // Render nothing here while the browser handles the redirection.
  // This prevents the admin page from flashing for non-admin users.
  if (!user?.profile?.isAdmin) {
    return null; 
  }


  // Only render the admin content if loading is finished and the user is confirmed to be an admin.
  return (
    <div>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <h1 className="text-lg font-semibold">Admin - Manage Locations</h1>
            <Button asChild>
                <Link href="/">Back to Tour</Link>
            </Button>
        </header>
        <main className="p-4 lg:p-6">
            <LocationAdminPage />
        </main>
    </div>
  );
}
