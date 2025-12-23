'use client';

import { ReactNode, useMemo, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './client';
import { SupabaseProvider } from './provider';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Create client once using useMemo to prevent recreating on every render
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      const client = createSupabaseClient();
      if (!client) {
        console.error(
          'Failed to create Supabase client. ' +
          'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
        );
      }
      return client;
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  // Only check for errors after component has mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show error message if Supabase is not configured (only after mount to prevent hydration mismatch)
  if (isMounted && !supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <h1 className="mb-2 text-xl font-headline font-semibold text-destructive">
            Configuration Error
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Supabase is not configured. Please ensure the following environment variables are set in your <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> file:
          </p>
          <ul className="mb-4 list-inside list-disc text-left text-sm text-muted-foreground">
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          </ul>
          <p className="text-xs text-muted-foreground">
            After adding these variables, restart your development server.
          </p>
        </div>
      </div>
    );
  }

  // During SSR and initial render, always render children to prevent hydration mismatch
  // If supabase is null, children will handle errors gracefully
  if (!supabase) {
    // Return children wrapped in a fragment to maintain structure
    return <>{children}</>;
  }

  return (
    <SupabaseProvider supabase={supabase}>
      {children}
    </SupabaseProvider>
  );
}

