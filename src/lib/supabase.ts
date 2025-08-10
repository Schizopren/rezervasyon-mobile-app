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

// Müşteri raporları için yeni API
export const customerReports = {
  // En sık gelen müşterileri getir (ziyaret sayısına göre sıralı)
  getTopCustomers: async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          customer_id,
          customer:customers(id, name, title, phone, email, created_at, deleted_at),
          date,
          created_at
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      // Müşteri bazında grupla ve ziyaret sayısını hesapla
      const customerStats = new Map();
      
      data?.forEach((assignment) => {
        const customerId = assignment.customer_id;
        const customer = assignment.customer;
        
        if (!customerStats.has(customerId)) {
          customerStats.set(customerId, {
            customer: customer,
            visitCount: 0,
            lastVisit: null,
            firstVisit: null,
            visits: []
          });
        }
        
        const stats = customerStats.get(customerId);
        stats.visitCount += 1;
        stats.visits.push({
          date: assignment.date,
          created_at: assignment.created_at
        });
        
        // İlk ve son ziyaret tarihlerini güncelle
        const visitDate = new Date(assignment.date);
        if (!stats.firstVisit || visitDate < new Date(stats.firstVisit)) {
          stats.firstVisit = assignment.date;
        }
        if (!stats.lastVisit || visitDate > new Date(stats.lastVisit)) {
          stats.lastVisit = assignment.date;
        }
      });

      // Ziyaret sayısına göre sırala ve limit uygula
      const sortedCustomers = Array.from(customerStats.values())
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, limit);

      return { data: sortedCustomers, error: null };
    } catch (error) {
      console.error('❌ Customer reports error:', error);
      return { data: [], error };
    }
  },

  // Belirli müşterinin ziyaret geçmişini getir
  getCustomerVisitHistory: async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          *,
          seat:seats(row, number),
          customer:customers(*)
        `)
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Customer visit history error:', error);
      return { data: [], error };
    }
  },

  // Genel müşteri istatistikleri
  getCustomerStats: async () => {
    try {
      // Toplam müşteri sayısı
      const { data: totalCustomers, error: totalError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' });

      // Aktif müşteri sayısı (silinmemiş)
      const { data: activeCustomers, error: activeError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .is('deleted_at', null);

      // Silinmiş müşteri sayısı
      const { data: deletedCustomers, error: deletedError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .not('deleted_at', 'is', null);

      // Bu ay yeni eklenen müşteri sayısı
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: newCustomers, error: newError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .gte('created_at', firstDayOfMonth.toISOString());

      if (totalError || activeError || deletedError || newError) {
        throw new Error('Error fetching customer stats');
      }

      return {
        data: {
          total: totalCustomers?.length || 0,
          active: activeCustomers?.length || 0,
          deleted: deletedCustomers?.length || 0,
          newThisMonth: newCustomers?.length || 0
        },
        error: null
      };
    } catch (error) {
      console.error('❌ Customer stats error:', error);
      return { data: null, error };
    }
  }
};