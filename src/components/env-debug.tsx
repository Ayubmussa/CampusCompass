'use client';

import { useEffect, useState } from 'react';

export function EnvDebug() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Log raw process.env access
    console.log('=== Environment Variables Debug ===');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('All NEXT_PUBLIC_ vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
    
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
        : 'MISSING',
      'process.env keys count': Object.keys(process.env).length,
      'NEXT_PUBLIC_ vars found': Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length,
    });
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-background p-4 text-xs shadow-lg">
      <h3 className="mb-2 font-semibold">Environment Variables Debug</h3>
      <pre className="overflow-auto">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
}

