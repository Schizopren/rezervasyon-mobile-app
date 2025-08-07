'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import Drawer from '../components/Drawer';
import SeatAssignmentForm from '../components/SeatAssignmentForm';
import { useAuth } from '../hooks/useAuth';
import { seatAssignments, customers, supabase } from '../lib/supabase';

// Mock customer data (geçici) - artık kullanılmıyor
const customerData: Record<string, { id: string; name: string; title: string }> = {};

export default function Dashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | undefined>();
  const [seatAssignmentsData, setSeatAssignmentsData] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Supabase bağlantı kontrolü
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔍 Supabase bağlantısı kontrol ediliyor...');
      console.log('Environment variables:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Tanımlı' : '❌ Eksik',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Tanımlı' : '❌ Eksik'
      });
      
      try {
        const { data, error } = await supabase.from('seats').select('count').limit(1);
        console.log('Supabase response:', { data, error });
        
        if (error) {
          console.error('❌ Supabase connection error:', error);
          setConnectionError('Veritabanı bağlantısında sorun var. Lütfen daha sonra tekrar deneyin.');
        } else {
          console.log('✅ Supabase bağlantısı başarılı');
          setConnectionError(null);
        }
      } catch (error) {
        console.error('❌ Connection check failed:', error);
        setConnectionError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
      }
    };

    if (mounted) {
      checkConnection();
    }
  }, [mounted]);

  const loadSeatAssignments = useCallback(async () => {
    console.log('🔄 Koltuk atamaları yükleniyor...', { selectedDate, connectionError });
    
    if (connectionError) {
      console.log('⚠️ Skipping load due to connection error');
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('📅 Tarih:', dateStr);
      
      const { data, error } = await seatAssignments.getByDate(dateStr);
      console.log('📊 Seat assignments response:', { data: data?.length, error });
      
      if (error) {
        console.error('❌ Error loading seat assignments:', error);
        setConnectionError('Veri yüklenirken hata oluştu.');
      } else {
        console.log('✅ Seat assignments loaded successfully:', data?.length, 'records');
        // Tüm atamaları göster (silinmiş müşteriler dahil)
        setSeatAssignmentsData(data || []);
        setConnectionError(null);
      }
    } catch (error) {
      console.error('❌ Error loading seat assignments:', error);
      setConnectionError('Veri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, connectionError]);

  useEffect(() => {
    setMounted(true);
    
    // Cleanup function
    return () => {
      setSeatAssignmentsData([]);
      setSearchResults([]);
      setIsSearching(false);
      setLoading(false);
    };
  }, []);

  // Seçili tarih için koltuk atamalarını yükle
  useEffect(() => {
    if (selectedDate && mounted) {
      loadSeatAssignments();
    }
  }, [selectedDate, mounted, loadSeatAssignments]);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        console.error('Login error:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Seçili tarih için tüm atamaları getir
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: assignments, error } = await seatAssignments.getByDate(dateStr);
      
      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        return;
      }

      // Müşteri adına göre filtrele (silinmiş müşteriler dahil)
      const matchingAssignments = assignments?.filter((assignment: any) => 
        assignment.customer?.name?.toLowerCase().includes(query.toLowerCase()) ||
        assignment.customer?.title?.toLowerCase().includes(query.toLowerCase())
      ) || [];

      // Sonuçları formatla
      const results = matchingAssignments.map((assignment: any) => ({
        customer: assignment.customer,
        seat: `${assignment.seat?.row}${assignment.seat?.number}`,
        date: assignment.date
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserProfile = () => {
    console.log('User profile clicked');
    // Implement user profile functionality
    alert('Profil sayfası açılacak');
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: tr });
  };

  const handleSeatClick = (seatId: string) => {
    console.log('Seat clicked:', seatId);
    
    // Sadece giriş yapmış kullanıcılar drawer'ı açabilir
    if (!user) {
      return;
    }
    
    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk düzenleme yapılamaz!');
      return;
    }
    
    setSelectedSeat(seatId);
    setIsDrawerOpen(true);
  };

  // Dolu koltuğun müşteri bilgisini al
  const getCustomerForSeat = (seatId: string) => {
    const row = seatId.charAt(0);
    const number = parseInt(seatId.slice(1));
    
    const assignment = seatAssignmentsData.find(
      (assignment: any) => 
        assignment.seat?.row === row && 
        assignment.seat?.number === number
    );
    
    return assignment?.customer || null;
  };

  const handleKoltukAtaClick = () => {
    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk atama yapılamaz!');
      return;
    }
    
    setSelectedSeat(undefined);
    setIsDrawerOpen(true);
  };

  const handleAssign = async (data: { customer: any; seat: string; date?: string }) => {
    console.log('Assignment data:', data);
    
    if (!user) {
      alert('Kullanıcı girişi gerekli!');
      return;
    }

    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk atama yapılamaz!');
      return;
    }

    try {
      // Önce seat_id'yi bulalım
      const { data: seatData, error: seatError } = await supabase
        .from('seats')
        .select('id')
        .eq('row', data.seat.charAt(0))
        .eq('number', parseInt(data.seat.slice(1)))
        .single();

      if (seatError || !seatData) {
        console.error('Seat not found:', seatError);
        alert('Koltuk bulunamadı!');
        return;
      }

      // Müşteriyi ekleyelim (eğer yeni ise)
      let customerId = data.customer.id;
      
      // Eğer müşteri yeni ise (geçici ID ile işaretlenmiş)
      if (data.customer.id && data.customer.id.startsWith('temp_')) {
        const { data: newCustomer, error: customerError } = await customers.create({
          name: data.customer.name,
          title: data.customer.title,
          phone: data.customer.phone,
          email: data.customer.email,
          reference: data.customer.reference
        });

        if (customerError) {
          console.error('Customer creation error:', customerError);
          alert('Müşteri eklenirken hata oluştu!');
          return;
        }

        customerId = newCustomer.id;
      }

      // Önce mevcut atamayı kontrol et ve sil
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: existingAssignment, error: checkError } = await seatAssignments.getBySeatAndDate(
        seatData.id,
        dateStr
      );

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
        alert('Mevcut atama kontrol edilirken hata oluştu!');
        return;
      }

      if (existingAssignment) {
        // Mevcut atamayı sil
        const { error: deleteError } = await seatAssignments.delete(existingAssignment.id);
        if (deleteError) {
          console.error('Existing assignment delete error:', deleteError);
          alert('Mevcut koltuk ataması silinirken hata oluştu!');
          return;
        }
      }

      // Yeni koltuk atamasını oluşturalım
      const { data: assignment, error: assignmentError } = await seatAssignments.create({
        seat_id: seatData.id,
        customer_id: customerId,
        date: dateStr,
        assigned_by: user.id
      });

      if (assignmentError) {
        console.error('Assignment creation error:', assignmentError);
        alert('Koltuk ataması yapılırken hata oluştu!');
        return;
      }

      console.log('Assignment created:', assignment);
      alert(`${data.customer.name} ${data.seat} koltuğuna başarıyla atandı!`);
      
      // Drawer'ı kapat ve verileri yenile
      setIsDrawerOpen(false);
      setSelectedSeat(undefined);
      loadSeatAssignments();
      
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Koltuk ataması yapılırken bir hata oluştu!');
    }
  };

  const handleEmptySeat = async (seatId: string) => {
    console.log('Emptying seat:', seatId);
    
    if (!user) {
      alert('Kullanıcı girişi gerekli!');
      return;
    }

    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk boşaltma yapılamaz!');
      return;
    }

    try {
      // Seat_id'yi bulalım
      const { data: seatData, error: seatError } = await supabase
        .from('seats')
        .select('id')
        .eq('row', seatId.charAt(0))
        .eq('number', parseInt(seatId.slice(1)))
        .single();

      if (seatError || !seatData) {
        console.error('Seat not found:', seatError);
        alert('Koltuk bulunamadı!');
        return;
      }

      // Bu tarih için bu koltuğun atamasını bulalım
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('seat_assignments')
        .select('id')
        .eq('seat_id', seatData.id)
        .eq('date', dateStr)
        .single();

      if (assignmentError) {
        console.error('Assignment not found:', assignmentError);
        alert('Bu koltukta atama bulunamadı!');
        return;
      }

      // Atamayı silelim
      const { error: deleteError } = await seatAssignments.delete(assignmentData.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        alert('Koltuk boşaltılırken hata oluştu!');
        return;
      }

      console.log('Seat emptied successfully');
      alert(`${seatId} koltuğu başarıyla boşaltıldı!`);
      
      // Drawer'ı kapat ve verileri yenile
      setSelectedSeat(undefined);
      setIsDrawerOpen(false);
      loadSeatAssignments();
      
    } catch (error) {
      console.error('Empty seat error:', error);
      alert('Koltuk boşaltılırken bir hata oluştu!');
    }
  };

  // Koltuk grid'i oluştur
  const renderSeatGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'P'];
    const seats: React.ReactElement[] = [];
    
    rows.forEach(row => {
      const maxSeats = row === 'P' ? 9 : 19;
      const rowSeats: React.ReactElement[] = [];
      
      for (let i = 1; i <= maxSeats; i++) {
        const seatId = `${row}${i}`;
        
        // Gerçek verilerden bu koltuğun atanıp atanmadığını kontrol et
        const assignment = seatAssignmentsData.find(
          (assignment: any) => assignment.seat?.row === row && assignment.seat?.number === i
        );
        
        const isAssigned = !!assignment;
        const customer = assignment?.customer;
        
        // Geçmiş tarihlerde koltukların tıklanabilir olup olmadığını kontrol et
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateOnly = new Date(selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        const isPastDate = selectedDateOnly < today;
        
        rowSeats.push(
          <button
            key={seatId}
            className={`
              w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 
              rounded-lg border-2 font-bold text-xs md:text-sm lg:text-base
              transition-all duration-200
              ${isPastDate 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:scale-105'
              }
              ${isAssigned 
                ? 'bg-red-500 text-white border-red-600 shadow-lg' 
                : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
              }
              relative
            `}
            onClick={() => !isPastDate && handleSeatClick(seatId)}
            disabled={isPastDate}
          >
            <span className="font-bold">{seatId}</span>
            
            {/* Müşteri bilgileri - sadece dolu koltuklarda, direkt görünür */}
            {isAssigned && customer && (
              <div className={`absolute inset-0 text-white rounded-lg 
                            flex flex-col items-center justify-center text-xs md:text-sm
                            ${customer.is_deleted 
                              ? 'bg-gray-600 bg-opacity-75' 
                              : 'bg-black bg-opacity-75'
                            }`}>
                <div className="font-semibold">{customer.title}</div>
                <div className="text-center leading-tight">{customer.name}</div>
                {customer.is_deleted && (
                  <div className="text-xs text-gray-300 mt-1">(Silinmiş)</div>
                )}
              </div>
            )}
          </button>
        );
      }
      
      seats.push(
        <div key={row} className="mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-bold mb-4 text-center text-gray-800">
            {row} Sırası
          </h3>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            {rowSeats}
          </div>
        </div>
      );
    });
    
    return seats;
  };

  // Hydration tamamlanana kadar loading göster
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onLogout={handleLogout}
        onSearch={handleSearch}
        onUserProfile={handleUserProfile}
        onLogin={handleLogin}
        currentUser={user}
        searchResults={searchResults}
        isSearching={isSearching}
        onNavigate={(path) => {
          if (path === '/') {
            // Ana sayfada kal
          } else if (path === '/customers') {
            // Kişiler sayfasına git (henüz oluşturmadık)
            alert('Kişiler sayfası yakında eklenecek!');
          }
        }}
        currentPath="/"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation - Only show for logged in users */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex space-x-1 border-b border-gray-200">
              <button
                onClick={() => {
                  // Ana sayfa aktif
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50 rounded-t-lg"
              >
                Koltuk Düzeni
              </button>
              <button
                onClick={() => {
                  window.location.href = '/customers';
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors duration-200"
              >
                Kişiler
              </button>
            </div>
          </div>
        )}

        {/* Date Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Tarih Seçimi
          </h2>
          
          {/* DatePicker */}
          <div className="mb-4">
            <DatePicker 
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                // Geçersiz tarih kontrolü
                if (date && !isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
              isReadOnly={!user}
            />
          </div>
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Bağlantı Hatası
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {connectionError}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setConnectionError(null);
                      loadSeatAssignments();
                    }}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seat Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Koltuk Düzeni</h2>
            {user && !connectionError && (
              (() => {
                // Geçmiş tarihlerde butonu gizle
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDateOnly = new Date(selectedDate);
                selectedDateOnly.setHours(0, 0, 0, 0);
                const isPastDate = selectedDateOnly < today;
                
                if (isPastDate) {
                  return (
                    <div className="text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded-lg">
                      Geçmiş tarihlerde koltuk düzenleme yapılamaz
                    </div>
                  );
                }
                
                return (
                  <button 
                    onClick={handleKoltukAtaClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Koltuk Ata</span>
                  </button>
                );
              })()
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : connectionError ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Veri Yüklenemedi</div>
                <div className="text-sm">Bağlantı sorunu nedeniyle koltuk bilgileri gösterilemiyor.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {renderSeatGrid()}
            </div>
          )}
        </div>
      </main>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedSeat ? `${selectedSeat} Koltuk Atama` : 'Koltuk Atama'}
      >
        <SeatAssignmentForm
          selectedSeat={selectedSeat}
          selectedDate={selectedDate}
          onClose={() => setIsDrawerOpen(false)}
          onAssign={handleAssign}
          onSeatSelect={(seat) => setSelectedSeat(seat || undefined)}
          existingCustomer={selectedSeat ? getCustomerForSeat(selectedSeat) : undefined}
          onEmptySeat={handleEmptySeat}
          seatAssignmentsData={seatAssignmentsData}
        />
      </Drawer>
    </div>
  );
}
