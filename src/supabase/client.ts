'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';

// Singleton pattern to prevent multiple instances
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createSupabaseClient = () => {
  // Return existing instance if it exists
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Create new instance using SSR client which handles cookies properly
  supabaseClientInstance = createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );

  return supabaseClientInstance;
};

