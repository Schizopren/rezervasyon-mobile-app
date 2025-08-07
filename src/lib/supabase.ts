import { createClient } from '@supabase/supabase-js';

// Environment variables kontrolü
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Environment variables eksikse uyarı ver
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Supabase client oluştur
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Database tipleri
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  reference?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface SeatAssignment {
  id: string;
  seat_id: string;
  customer_id: string;
  date: string;
  assigned_by: string;
  created_at: string;
  seat?: Seat;
  customer?: Customer;
  assigned_by_user?: UserProfile;
}

// Authentication fonksiyonları
export const auth = {
  // Email/şifre ile giriş
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Çıkış yap
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Mevcut kullanıcıyı al
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Kullanıcı profilini al
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Kullanıcı durumu değişikliklerini dinle
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Seat işlemleri
export const seats = {
  // Tüm koltukları getir
  getAll: async () => {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .order('row', { ascending: true })
      .order('number', { ascending: true });
    return { data, error };
  },

  // Belirli bir koltuğu getir
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  }
};

// Customer işlemleri
export const customers = {
  // Tüm müşterileri getir (silinmemiş olanlar)
  getAll: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('is_deleted', false)
      .order('name', { ascending: true });
    return { data, error };
  },

  // Müşteri ara (silinmemiş olanlar)
  search: async (searchTerm: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('is_deleted', false)
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });
    return { data, error };
  },

  // Yeni müşteri ekle
  create: async (customer: Omit<Customer, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    return { data, error };
  },

  // Müşteri güncelle
  update: async (id: string, updates: Partial<Customer>) => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Müşteri sil (soft delete)
  delete: async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id);
    return { error };
  }
};

// Seat assignment işlemleri
export const seatAssignments = {
  // Belirli tarih için tüm atamaları getir (silinmiş müşteriler dahil)
  getByDate: async (date: string) => {
    const { data, error } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        seat:seats(*),
        customer:customers(*)
      `)
      .eq('date', date);
    return { data, error };
  },

  // Belirli koltuk için atama getir (silinmiş müşteriler dahil)
  getBySeatAndDate: async (seatId: string, date: string) => {
    const { data, error } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        seat:seats(*),
        customer:customers(*)
      `)
      .eq('seat_id', seatId)
      .eq('date', date)
      .maybeSingle();
    return { data, error };
  },

  // Yeni atama oluştur
  create: async (assignment: {
    seat_id: string;
    customer_id: string;
    date: string;
    assigned_by: string;
  }) => {
    const { data, error } = await supabase
      .from('seat_assignments')
      .insert(assignment)
      .select(`
        *,
        seat:seats(*),
        customer:customers(*)
      `)
      .single();
    return { data, error };
  },

  // Atama sil
  delete: async (id: string) => {
    const { error } = await supabase
      .from('seat_assignments')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Atama güncelle
  update: async (id: string, updates: Partial<SeatAssignment>) => {
    const { data, error } = await supabase
      .from('seat_assignments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        seat:seats(*),
        customer:customers(*)
      `)
      .single();
    return { data, error };
  }
}; 