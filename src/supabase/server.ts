import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  // Validate config on server side (should always be available)
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
    );
  }

  return createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In server actions, we can't set cookies directly
          // The middleware handles this
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignore cookie setting errors in server actions
            // Middleware will handle it on next request
          }
        },
      },
    }
  );
};

