'use client';

import { ReactNode, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './client';
import { SupabaseProvider } from './provider';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  // Create client once using useMemo to prevent recreating on every render
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      return createSupabaseClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  return (
    <SupabaseProvider supabase={supabase}>
      {children}
    </SupabaseProvider>
  );
}

