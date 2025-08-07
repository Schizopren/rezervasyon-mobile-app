import { useState, useEffect } from 'react';
import { auth, UserProfile } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mevcut kullanıcıyı kontrol et
    const checkUser = async () => {
      try {
        const { user: authUser, error } = await auth.getCurrentUser();
        if (authUser && !error) {
          const { data: profile, error: profileError } = await auth.getUserProfile(authUser.id);
          if (profile && !profileError) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: authUser.email || '',
              role: profile.role,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            });
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error } = await auth.getUserProfile(session.user.id);
        if (profile && !error) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: session.user.email || '',
            role: profile.role,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (!error) {
      setUser(null);
    }
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
} 