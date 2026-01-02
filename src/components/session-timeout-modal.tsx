'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type SessionTimeoutModalProps = {
  open: boolean;
  timeRemaining: number;
  onExtend: () => void;
};

export function SessionTimeoutModal({ open, timeRemaining, onExtend }: SessionTimeoutModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription>
            Your session will expire due to inactivity. Please click "Stay Logged In" to continue, or you will be automatically logged out.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{formatTime(timeRemaining)}</p>
            <p className="text-sm text-muted-foreground mt-2">Time remaining before logout</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onExtend} className="w-full">
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

