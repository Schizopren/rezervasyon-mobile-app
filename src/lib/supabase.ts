import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client'ı yapılandır
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  created_at: string;
  seat?: Seat;
  customer?: Customer;
  // assigned_by alanını kaldırdık
}

// Müşteri işlemleri
export const customers = {
  // Sadece aktif müşterileri getir
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null) // Sadece silinmemiş olanları getir
        .order('name');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Tüm müşterileri getir (silinmiş olanlar dahil)
  getAllWithDeleted: async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('name');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  create: async (customer: {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    reference?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Soft delete - Müşteriyi silmek yerine deleted_at alanını güncelle
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Restore - Silinen müşteriyi geri yükle
  restore: async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: null })
        .eq('id', id);
      return { error };
    } catch (error) {
      return { error };
    }
  },

  update: async (id: string, customer: {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    reference?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  search: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,title.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Seat assignment işlemleri
export const seatAssignments = {
  // Belirli tarih için tüm atamaları getir (silinmiş müşteriler dahil)
  getByDate: async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          *,
          seat:seats(*),
          customer:customers(*)
        `)
        .eq('date', date);

      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Supabase error:', error);
      return { data: [], error };
    }
  },

  // Belirli koltuk için atama getir (silinmiş müşteriler dahil)
  getBySeatAndDate: async (seatId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          *,
          seat:seats(*),
          customer:customers(*)
        `)
        .eq('seat_id', seatId)
        .eq('date', date)
        .maybeSingle();  // single() yerine maybeSingle() kullanıyoruz

      // maybeSingle() sonuç bulamazsa error yerine null döndürür
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Yeni atama oluştur
  create: async (assignment: {
    seat_id: string;
    customer_id: string;
    date: string;
    assigned_by?: string;
  }) => {
    try {
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
    } catch (error) {
      return { data: null, error };
    }
  },

  // Atama sil
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('seat_assignments')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }
};