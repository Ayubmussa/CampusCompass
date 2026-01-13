'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/supabase';
import { isAdmin } from '@/lib/admin-helpers';

type BackButtonProps = {
  fallbackRoute?: string;
  label?: string;
};

export function BackButton({ fallbackRoute, label = 'Back to tour' }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const handleBack = () => {
    // If we're on the admin page, determine appropriate fallback
    if (pathname?.startsWith('/admin')) {
      // For admins, if there's no history, stay on admin page
      // Otherwise, go back in history (but prevent going to landing page)
      if (window.history.length > 1) {
        // Use router.back() but we can't intercept where it goes
        // The middleware and page components will handle redirecting away from landing
        router.back();
      } else {
        // Stay on admin page if no history
        router.push('/admin');
      }
      return;
    }

    // For other pages, try to go back in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Use provided fallback route, or determine based on user role
      if (fallbackRoute) {
        router.push(fallbackRoute);
      } else if (user && isAdmin(user.profile)) {
        // If user is admin and no fallback provided, go to admin
        router.push('/admin');
      } else if (user) {
        // If user is authenticated (regular user), go to home
        router.push('/');
      } else {
        // If not authenticated, go to landing page
        router.push('/landing');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="text-sm text-primary hover:underline"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

