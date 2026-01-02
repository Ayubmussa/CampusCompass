'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabase } from '../provider';
import type { AdminLevel, UserProfile as AdminUserProfile } from '@/lib/admin-types';

export type UserProfile = AdminUserProfile;

export interface UserHookResult {
  user: (User & { profile: UserProfile | null }) | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  userError: Error | null;
}

export const useUser = (): UserHookResult => {
  const supabase = useSupabase();
  const [userState, setUserState] = useState<UserHookResult>({
    user: null,
    isUserLoading: true,
    isProfileLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!supabase) {
      setUserState(prevState => ({ ...prevState, isUserLoading: false, isProfileLoading: false }));
      return;
    }

    const client = supabase;
    let mounted = true;

    const loadUserProfile = async (authUser: User) => {
      if (!mounted) return;
      setUserState(prev => ({ ...prev, isUserLoading: false, isProfileLoading: true }));

      try {
        const { data: profile, error } = await client
          .from('users')
          .select('*')
          .eq('uid', authUser.id)
          .single();

        let userProfile: UserProfile | null = null;

        if (error && error.code === 'PGRST116') {
          // Determine admin level for new users
          const adminLevel: AdminLevel = authUser.email === 'admin@example.com' ? 'super_admin' : null;
          
          const newProfile: UserProfile = {
            uid: authUser.id,
            email: authUser.email,
            displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || null,
            photoURL: authUser.user_metadata?.avatar_url || null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            adminLevel,
            allocatedPlaceIds: [],
          };

          const { data: createdProfile, error: createError } = await client
            .from('users')
            .insert({
              uid: newProfile.uid,
              email: newProfile.email,
              display_name: newProfile.displayName,
              photo_url: newProfile.photoURL,
              created_at: newProfile.createdAt,
              last_login: newProfile.lastLogin,
              admin_level: newProfile.adminLevel,
            })
            .select()
            .single();

          if (createError) throw createError;
          
          // Load allocated places for sub-admins
          let allocatedPlaceIds: string[] = [];
          if (createdProfile.admin_level === 'sub_admin') {
            const { data: allocations } = await client
              .from('place_allocations')
              .select('place_id')
              .eq('user_id', createdProfile.uid);
            allocatedPlaceIds = allocations?.map(a => a.place_id) || [];
          }
          
          userProfile = {
            uid: createdProfile.uid,
            email: createdProfile.email,
            displayName: createdProfile.display_name,
            photoURL: createdProfile.photo_url,
            createdAt: createdProfile.created_at,
            lastLogin: createdProfile.last_login,
            adminLevel: createdProfile.admin_level as AdminLevel,
            allocatedPlaceIds,
          };
        } else if (error) {
          throw error;
        } else {
          await client
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('uid', authUser.id);
          
          // Load allocated places for sub-admins
          let allocatedPlaceIds: string[] = [];
          if (profile.admin_level === 'sub_admin') {
            const { data: allocations } = await client
              .from('place_allocations')
              .select('place_id')
              .eq('user_id', profile.uid);
            allocatedPlaceIds = allocations?.map((a: any) => a.place_id) || [];
          }
          
          userProfile = {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.display_name,
            photoURL: profile.photo_url,
            createdAt: profile.created_at,
            lastLogin: profile.last_login,
            adminLevel: profile.admin_level as AdminLevel,
            allocatedPlaceIds,
          };
        }

        if (!mounted) return;
        
        setUserState({
          user: {
            ...authUser,
            profile: userProfile,
          },
          isUserLoading: false,
          isProfileLoading: false,
          userError: null,
        });
      } catch (error: any) {
        if (!mounted) return;
        
        console.error('Error fetching or creating user profile:', error);
        setUserState(prev => ({
          ...prev,
          userError: error,
          isProfileLoading: false,
        }));
      }
    };

    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (!mounted) return;

        if (error) {
          setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: error });
          return;
        }

        if (user) {
          await loadUserProfile(user);
        } else {
          setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: null });
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Error fetching auth user:', err);
        setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: err });
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: null });
        }
      }
    );

    // Fallback: on visibility/focus, refetch to avoid stuck loading after tab switching
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [supabase]);

  return userState;
};

