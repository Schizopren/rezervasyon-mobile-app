import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  checkPermission: (permission: string) => boolean;
  loadUserPermissions: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isAuthenticated: false,
      permissions: [],

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (error) return { error };
          
          set({ 
            user: data.user, 
            session: data.session, 
            isAuthenticated: !!data.user,
            loading: false 
          });
          
          // Kullanıcı permissions'larını al
          if (data.user) {
            await get().loadUserPermissions(data.user.id);
          }
          
          return { error: null };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.signOut();
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false, 
            permissions: [],
            loading: false 
          });
          // Ana sayfaya yönlendir
          window.location.href = '/';
          return { error };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },

      signUp: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({ 
            email, 
            password 
          });
          set({ loading: false });
          return { error };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setSession: (session: Session | null) => set({ session }),
      setLoading: (loading: boolean) => set({ loading }),

      loadUserPermissions: async (userId: string) => {
        try {
          // user_profiles tablosundan role'ü al
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', userId)
            .single();
          
          console.log('User profile loaded:', profile);
          
          // Role'e göre permissions belirle
          let permissions: string[] = [];
          
                  if (profile?.role === 'admin') {
          permissions = ['view_seats', 'edit_seats', 'change_date', 'edit_customers', 'view_reports'];
        } else if (profile?.role === 'manager') {
          permissions = ['view_seats', 'edit_seats', 'change_date'];
        } else if (profile?.role === 'employee') {
          permissions = ['view_seats', 'edit_seats', 'change_date'];
        } else {
          // Varsayılan permissions (role yoksa)
          permissions = ['view_seats', 'edit_seats', 'change_date', 'edit_customers'];
        }
          
          console.log('Permissions set for role:', profile?.role, permissions);
          set({ permissions });
        } catch (error) {
          console.error('Permissions yüklenemedi:', error);
          // Hata durumunda varsayılan permissions ver
          console.log('Varsayılan permissions veriliyor (error)');
          set({ permissions: ['view_seats', 'edit_seats', 'change_date', 'edit_customers'] });
        }
      },

      checkPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        permissions: state.permissions 
      })
    }
  )
);
