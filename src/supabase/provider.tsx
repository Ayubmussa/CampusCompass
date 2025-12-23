'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './client';

interface SupabaseProviderProps {
  children: ReactNode;
  supabase: SupabaseClient | null;
}

export interface SupabaseContextState {
  isAvailable: boolean;
  supabase: SupabaseClient | null;
}

export interface SupabaseServices {
  supabase: SupabaseClient | null;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
  supabase,
}) => {
  // Use a stable reference - only recreate if supabase actually changes (by reference)
  const contextValue = useMemo((): SupabaseContextState => {
    return {
      isAvailable: !!supabase,
      supabase: supabase,
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseClient | null => {
  const context = useContext(SupabaseContext);
  return context?.supabase ?? null;
};

export const useSupabaseServices = (): SupabaseServices => {
  const context = useContext(SupabaseContext);
  return {
    supabase: context?.supabase ?? null,
  };
};

type MemoSupabase<T> = T & { __memo?: boolean };

export function useMemoSupabase<T>(factory: () => T, deps: DependencyList): T | MemoSupabase<T> {
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoSupabase<T>).__memo = true;
  
  return memoized;
}

// Deprecated: Use useMemoSupabase instead
// @deprecated This function is kept for backward compatibility but will be removed
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoSupabase<T> {
  return useMemoSupabase(factory, deps);
}

