'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/supabase';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 5 * 60 * 1000; // Show warning 5 minutes before timeout (at 25 minutes)

export function useSessionTimeout() {
  const supabase = useSupabase();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const showWarningRef = useRef<boolean>(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Sync ref with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Update last activity time
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Set warning timeout (at 25 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      const remaining = SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
      setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
      setShowWarning(true);

      // Update countdown every second
      countdownIntervalRef.current = setInterval(() => {
        const remaining = SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setShowWarning(false);
        } else {
          setTimeRemaining(Math.ceil(remaining / 1000));
        }
      }, 1000);
    }, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

    // Set logout timeout (at 30 minutes)
    timeoutRef.current = setTimeout(async () => {
      if (supabase) {
        await supabase.auth.signOut();
        router.push('/login?session=expired');
      }
    }, SESSION_TIMEOUT_MS);
  }, [supabase, router]);

  const handleActivity = useCallback(() => {
    // Only reset if we're past the warning threshold
    // This prevents resetting when user is actively using the app
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > 1000) { // Throttle to once per second
      // Use ref to check warning state without causing re-renders
      const wasShowingWarning = showWarningRef.current;
      
      // Just update the last activity time and reset timeouts
      lastActivityRef.current = Date.now();
      
      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // If warning was showing, hide it
      if (wasShowingWarning) {
        setShowWarning(false);
      }

      // Set warning timeout (at 25 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        const remaining = SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
        setTimeRemaining(Math.ceil(remaining / 1000));
        setShowWarning(true);

        // Update countdown every second
        countdownIntervalRef.current = setInterval(() => {
          const remaining = SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
          if (remaining <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setShowWarning(false);
          } else {
            setTimeRemaining(Math.ceil(remaining / 1000));
          }
        }, 1000);
      }, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

      // Set logout timeout (at 30 minutes)
      timeoutRef.current = setTimeout(async () => {
        if (supabase) {
          await supabase.auth.signOut();
          router.push('/login?session=expired');
        }
      }, SESSION_TIMEOUT_MS);
    }
  }, [supabase, router]);

  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Only initialize timeout once on mount
    resetTimeout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Track user activity separately to avoid re-initializing on every activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity tracking to avoid excessive resets
    let activityThrottle: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (activityThrottle) return;
      activityThrottle = setTimeout(() => {
        handleActivity();
        activityThrottle = null;
      }, 1000); // Throttle to once per second
    };

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
      if (activityThrottle) {
        clearTimeout(activityThrottle);
      }
    };
  }, [handleActivity]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
  };
}

