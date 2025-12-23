// Next.js replaces process.env.NEXT_PUBLIC_* at build time
// We must access them directly, not via bracket notation, for the replacement to work
// Lazy getter functions to avoid validation at module load time

function getEnvVar(value: string | undefined): string {
  if (!value || value.trim() === '') {
    // Never throw - return empty string and let calling code handle it
    // This allows the app to load and show a helpful error message instead of crashing
    if (typeof window !== 'undefined') {
      // Only log on client side to avoid server logs
      console.warn(`Missing required environment variable. The app may not function correctly.`);
    }
    return '';
  }
  return value.trim();
}

// Lazy config object - only validates when accessed
// Never throws - returns empty strings if env vars are missing
// IMPORTANT: Access process.env.NEXT_PUBLIC_* directly (not via bracket notation)
// so Next.js can replace them at build time
export const supabaseConfig = {
  get url(): string {
    // Direct access - Next.js will replace this at build time
    return getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get anonKey(): string {
    // Direct access - Next.js will replace this at build time
    return getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
};

