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

  try {
    // Validate config before creating client - wrap in try-catch for safety
    const url = supabaseConfig.url;
    const anonKey = supabaseConfig.anonKey;
    
    // Check for empty strings as well as null/undefined
    if (!url || url.trim() === '' || !anonKey || anonKey.trim() === '') {
      if (typeof window !== 'undefined') {
        console.error('Supabase configuration is missing. Please check your environment variables.');
        console.error('URL present:', !!url && url.trim() !== '');
        console.error('AnonKey present:', !!anonKey && anonKey.trim() !== '');
      }
      // Return null instead of throwing - let components handle it gracefully
      return null;
    }

    // Create new instance using SSR client which handles cookies properly
    supabaseClientInstance = createBrowserClient(url, anonKey);

    return supabaseClientInstance;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

