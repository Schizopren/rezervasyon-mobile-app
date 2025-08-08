import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();

  // Auth state query - Supabase session'ını kontrol eder
  const { data: authState } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        user: session?.user || null,
        session,
        isAuthenticated: !!session?.user
      };
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection
  });

  // User profile query - Kullanıcı adını al
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = authState?.user || authStore.user;
      if (!user) return null;
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        return profile;
      } catch (error) {
        console.error('User profile yüklenemedi:', error);
        return null;
      }
    },
    enabled: !!authState?.user || !!authStore.user,
    staleTime: 10 * 60 * 1000, // 10 dakika cache
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authStore.signIn(email, password);
    },
    onSuccess: () => {
      // Auth state'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      // Permissions'ları invalidate et
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return authStore.signOut();
    },
    onSuccess: () => {
      // Tüm cache'i temizle
      queryClient.clear();
      // Ana sayfaya yönlendir
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
    }
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authStore.signUp(email, password);
    },
    onError: (error) => {
      console.error('Signup error:', error);
    }
  });

  // Permissions query
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const user = authState?.user || authStore.user;
      if (!user) return [];
      
      try {
        // user_profiles tablosundan role'ü al
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('useAuth - User profile loaded:', profile);
        
        // Role'e göre permissions belirle
        let permissions: string[] = [];
        
        if (profile?.role === 'admin') {
          permissions = ['view_seats', 'edit_seats', 'change_date', 'edit_customers'];
        } else if (profile?.role === 'employee') {
          permissions = ['view_seats', 'edit_seats', 'change_date'];
        } else {
          // Varsayılan permissions (role yoksa)
          permissions = ['view_seats', 'edit_seats', 'change_date', 'edit_customers'];
        }
        
        console.log('useAuth - Permissions set for role:', profile?.role, permissions);
        return permissions;
      } catch (error) {
        console.error('Permissions yüklenemedi:', error);
        // Varsayılan permissions
        return ['view_seats', 'edit_seats', 'change_date', 'edit_customers'];
      }
    },
    enabled: !!authState?.user || !!authStore.user,
    staleTime: 10 * 60 * 1000, // 10 dakika cache
  });

  return {
    // State
    user: authState?.user || authStore.user,
    session: authState?.session || authStore.session,
    isAuthenticated: authState?.isAuthenticated || authStore.isAuthenticated,
    loading: authStore.loading,
    permissions: permissions || authStore.permissions,
    userProfile,
    
    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSigningUp: signupMutation.isPending,
    
    // Error states
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    signupError: signupMutation.error,
    
    // Permission check
    checkPermission: (permission: string) => {
      const currentPermissions = permissions || authStore.permissions;
      return currentPermissions.includes(permission);
    }
  };
};
