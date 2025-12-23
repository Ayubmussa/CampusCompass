
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
      : 'MISSING',
    allNextPublicVars: Object.keys(process.env)
      .filter(k => k.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? 'SET' : 'MISSING';
        return acc;
      }, {} as Record<string, string>),
  });
}

