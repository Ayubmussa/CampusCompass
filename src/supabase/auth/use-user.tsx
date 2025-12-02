'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabase } from '../provider';

export type UserProfile = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt: string;
  lastLogin: string;
  isAdmin?: boolean;
};

export interface UserHookResult {
  user: (User & { profile: UserProfile | null; isAnonymous: boolean }) | null;
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

    // Get authenticated user - getUser() verifies with Supabase Auth server
    client.auth.getUser().then(({ data: { user }, error }) => {
      if (!mounted) return;
      
      if (error) {
        setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: error });
        return;
      }

      if (user) {
        loadUserProfile(user);
      } else {
        setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: null });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUserState({ user: null, isUserLoading: false, isProfileLoading: false, userError: null });
        }
      }
    );

    async function loadUserProfile(authUser: User) {
      if (!mounted) return;
      setUserState(prev => ({ ...prev, isUserLoading: false, isProfileLoading: true }));

      try {
        // Check if profile exists
        const { data: profile, error } = await client
          .from('users')
          .select('*')
          .eq('uid', authUser.id)
          .single();

        let userProfile: UserProfile | null = null;

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const isAnonymous = authUser.is_anonymous || false;
          const newProfile: UserProfile = {
            uid: authUser.id,
            email: authUser.email,
            displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || null,
            photoURL: authUser.user_metadata?.avatar_url || null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isAdmin: authUser.email === 'admin@example.com',
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
              is_admin: newProfile.isAdmin,
            })
            .select()
            .single();

          if (createError) throw createError;
          // Map snake_case back to camelCase
          userProfile = {
            uid: createdProfile.uid,
            email: createdProfile.email,
            displayName: createdProfile.display_name,
            photoURL: createdProfile.photo_url,
            createdAt: createdProfile.created_at,
            lastLogin: createdProfile.last_login,
            isAdmin: createdProfile.is_admin,
          };
        } else if (error) {
          throw error;
        } else {
          // Profile exists, update last login and map to camelCase
          await client
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('uid', authUser.id);
          
          userProfile = {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.display_name,
            photoURL: profile.photo_url,
            createdAt: profile.created_at,
            lastLogin: profile.last_login,
            isAdmin: profile.is_admin,
          };
        }

        if (!mounted) return;
        
        setUserState({
          user: {
            ...authUser,
            profile: userProfile,
            isAnonymous: authUser.is_anonymous || false,
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
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return userState;
};

