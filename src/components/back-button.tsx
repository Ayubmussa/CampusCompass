'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in history, if that fails or we're at the start, go to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
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
      Back to tour
    </Button>
  );
}

