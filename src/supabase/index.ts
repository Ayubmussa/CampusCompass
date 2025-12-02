'use client';

// Main entry point for all Supabase-related CLIENT-SIDE exports
// NOTE: Server-side functions are NOT exported here to avoid importing 'next/headers' in client components
// Import server functions directly: import { createServerSupabaseClient } from '@/supabase/server'

// Re-export client-side providers and hooks
export * from './client-provider';
export * from './provider';

// Re-export hooks for accessing database and auth data
export * from './db/use-collection';
export * from './auth/use-user';

