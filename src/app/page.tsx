'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import Drawer from '../components/Drawer';
import SeatAssignmentForm from '../components/SeatAssignmentForm';
import ProtectedAction from '../components/ProtectedAction';
import { useAuth } from '../hooks/useAuth';

import { seatAssignments, customers, supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Mock customer data (geçici) - artık kullanılmıyor
const customerData: Record<string, { id: string; name: string; title: string }> = {};

export default function Dashboard() {
  const { isAuthenticated, checkPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | undefined>();
  const [seatAssignmentsData, setSeatAssignmentsData] = useState<any[]>([]);

  const loadSeatAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await seatAssignments.getByDate(dateStr);
      if (error) {
        console.error('Error loading seat assignments:', error);
      } else {
        // Tüm atamaları göster (silinmiş Kişiler dahil)
        setSeatAssignmentsData(data || []);
      }
    } catch (error) {
      console.error('Error loading seat assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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

      // Kişi adına göre filtrele (silinmiş Kişiler dahil)
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



  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: tr });
  };

  const handleSeatClick = (seatId: string) => {
    console.log('Seat clicked:', seatId);
    
    // Giriş yapmamış kullanıcılar için kontrol
    if (!isAuthenticated) {
      alert('Koltuk işlemleri için giriş yapmanız gerekiyor!');
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

  // Dolu koltuğun Kişi bilgisini al
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
    // Giriş yapmamış kullanıcılar için kontrol
    if (!isAuthenticated) {
      alert('Koltuk işlemleri için giriş yapmanız gerekiyor!');
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
    
    setSelectedSeat(undefined);
    setIsDrawerOpen(true);
  };

  const handleAssign = async (data: { customer: any; seat: string; date?: string }) => {
    console.log('Assignment data:', data);

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

      // Kişiyi ekleyelim (eğer yeni ise)
      let customerId = data.customer.id;
      
      // Eğer Kişi yeni ise (geçici ID ile işaretlenmiş)
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
          alert('Kişi eklenirken hata oluştu!');
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

      // Hata kontrolünü kaldırdık çünkü maybeSingle() kullanıyoruz

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
        date: dateStr
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
            
            {/* Kişi bilgileri - sadece dolu koltuklarda, direkt görünür */}
            {isAssigned && customer && (
              <div className={`absolute inset-0 text-white rounded-lg 
                            flex flex-col items-center justify-center text-xs md:text-sm
                            ${customer.deleted_at 
                              ? 'bg-gray-600 bg-opacity-75' 
                              : 'bg-black bg-opacity-75'
                            }`}>
                <div className="font-semibold">{customer.title}</div>
                <div className="text-center leading-tight">{customer.name}</div>
                {customer.deleted_at && (
                  <div className="text-xs text-gray-300 mt-1">(Kullanıcı silindi)</div>
                )}
              </div>
            )}
          </button>
        );
      }
      
      seats.push(
        <div key={row} className="mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">
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
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        onSearch={handleSearch}
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
        {/* Tab Navigation */}
        {(
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Ana sayfa aktif
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg"
              >
                Koltuk Düzeni
              </button>
              <button
                onClick={() => {
                  window.location.href = '/customers';
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors duration-200"
              >
                Kişiler
              </button>
            </div>
          </div>
        )}

        {/* Date Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Tarih Seçimi
          </h2>
          
          {/* DatePicker */}
          <div className="mb-4">
            {isAuthenticated ? (
              <DatePicker 
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  // Geçersiz tarih kontrolü
                  if (date && !isNaN(date.getTime())) {
                    setSelectedDate(date);
                  }
                }}
                isReadOnly={false}
              />
            ) : (
              <DatePicker 
                selectedDate={new Date()}
                onDateSelect={() => {}} // Boş fonksiyon
                isReadOnly={true}
              />
            )}
          </div>
        </div>

        {/* Seat Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Koltuk Düzeni</h2>
            {(
              (() => {
                // Geçmiş tarihlerde butonu gizle
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDateOnly = new Date(selectedDate);
                selectedDateOnly.setHours(0, 0, 0, 0);
                const isPastDate = selectedDateOnly < today;
                
                if (isPastDate) {
                  return (
                    <div className="text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                      Geçmiş tarihlerde koltuk düzenleme yapılamaz
                    </div>
                  );
                }
                
                return (
                  <ProtectedAction
                    permission="edit_seats"
                    fallback={
                      <div className="text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                        Koltuk işlemleri için giriş yapın
                      </div>
                    }
                  >
                    <button 
                      onClick={handleKoltukAtaClick}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Koltuk Ata</span>
                    </button>
                  </ProtectedAction>
                );
              })()
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
