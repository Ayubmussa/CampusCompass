'use client';

import * as React from 'react';
import { useUser } from '@/supabase';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { SessionTimeoutModal } from './session-timeout-modal';

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout();

  // Only show timeout modal if user is logged in
  const shouldShowModal = user && showWarning;

  return (
    <>
      {children}
      {shouldShowModal && (
        <SessionTimeoutModal
          open={showWarning}
          timeRemaining={timeRemaining}
          onExtend={extendSession}
        />
      )}
    </>
  );
}

