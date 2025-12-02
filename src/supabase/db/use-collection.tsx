'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../provider';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

type CollectionQuery = {
  table: string;
  select?: string;
  filter?: (query: any) => any; // Optional filter function for Supabase query builder
  __memo?: boolean;
};

export function useCollection<T = any>(
  memoizedQuery: CollectionQuery | null | undefined
): UseCollectionResult<T> {
  const supabase = useSupabase();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(memoizedQuery);

  // Update ref when query changes
  useEffect(() => {
    queryRef.current = memoizedQuery;
  }, [memoizedQuery]);

  const refetch = useCallback(async () => {
    const currentQuery = queryRef.current;
    if (!currentQuery || !supabase) return;

    let query = supabase.from(currentQuery.table).select(currentQuery.select || '*');
    
    // Apply filter if provided
    if (currentQuery.filter) {
      query = currentQuery.filter(query);
    }

    const { data: freshData, error: fetchError } = await query;
    
    if (fetchError) {
      setError(fetchError as Error);
      setData(null);
    } else if (freshData) {
      const results: WithId<T>[] = freshData.map((item: any) => ({
        ...item,
        id: item.id || item.uid,
      }));
      setData(results);
    }
  }, [supabase]);

  useEffect(() => {
    if (!memoizedQuery || !supabase) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (memoizedQuery && !memoizedQuery.__memo) {
      throw new Error(memoizedQuery.table + ' was not properly memoized using useMemoFirebase');
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    let query = supabase.from(memoizedQuery.table).select(memoizedQuery.select || '*');
    
    // Apply filter if provided
    if (memoizedQuery.filter) {
      query = memoizedQuery.filter(query);
    }

    // Initial fetch
    (async () => {
      try {
        const { data: initialData, error: fetchError } = await query;
        if (!mounted) return;

        if (fetchError) {
          console.error(`Error fetching ${memoizedQuery.table}:`, fetchError);
          console.error('Error details:', {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details,
            hint: fetchError.hint,
          });
          setError(fetchError as Error);
          setData(null);
          setIsLoading(false);
        } else {
          console.log(`Fetched ${memoizedQuery.table}:`, initialData?.length || 0, 'items');
          if (initialData) {
            const results: WithId<T>[] = initialData.map((item: any) => ({
              ...item,
              id: item.id || item.uid,
            }));
            console.log(`Mapped ${memoizedQuery.table} results:`, results);
            setData(results);
          } else {
            console.warn(`No data returned for ${memoizedQuery.table}`);
            setData([]);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error(`Exception fetching ${memoizedQuery.table}:`, err);
        setError(err as Error);
        setData(null);
        setIsLoading(false);
      }
    })();

    // Subscribe to real-time changes (with error handling)
    // Realtime is optional - if it fails, the app will still work with manual refetches
    // Check if Realtime is enabled via environment variable (default: true)
    const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false';
    let channel: any = null;
    let subscriptionTimeout: ReturnType<typeof setTimeout> | null = null;
    
    if (realtimeEnabled) {
      try {
        const channelName = `${memoizedQuery.table}-changes-${Date.now()}`;
        
        // Create channel with error handling wrapper
        const handleRealtimePayload = (payload: any) => {
          if (!mounted) return;
          
          try {
            // Refetch on any change - rebuild query with filter
            let refetchQuery = supabase.from(memoizedQuery.table).select(memoizedQuery.select || '*');
            if (memoizedQuery.filter) {
              refetchQuery = memoizedQuery.filter(refetchQuery);
            }
            refetchQuery.then(({ data: freshData, error: refetchError }) => {
              if (!mounted) return;
              
              if (refetchError) {
                // Silently handle refetch errors
                return;
              }
              
              if (freshData) {
                const results: WithId<T>[] = freshData.map((item: any) => ({
                  ...item,
                  id: item.id || item.uid,
                }));
                setData(results);
              }
            });
          } catch (err) {
            // Silently handle payload processing errors
          }
        };

        // Use setTimeout to defer subscription and prevent blocking
        subscriptionTimeout = setTimeout(() => {
          try {
            channel = supabase
              .channel(channelName)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: memoizedQuery.table,
                },
                handleRealtimePayload
              )
              .subscribe((status: string) => {
                if (!mounted) return;
                // Silently handle all statuses - errors are non-critical
              });
          } catch (err) {
            // Silently handle subscription errors
            channel = null;
          }
        }, 0);
      } catch (err) {
        // Realtime subscription setup failed - not critical
        channel = null;
      }
    }

    return () => {
      mounted = false;
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [memoizedQuery, supabase]);

  return { data, isLoading, error, refetch };
}

