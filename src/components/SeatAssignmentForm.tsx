'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Save, X } from 'lucide-react';
import { customers } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  reference?: string;
}

interface SeatAssignmentFormProps {
  selectedSeat?: string;
  selectedDate: Date;
  onClose: () => void;
  onAssign: (data: { customer: Customer; seat: string; date: string }) => void;
  onSeatSelect?: (seat: string) => void;
  existingCustomer?: Customer;
  onEmptySeat?: (seat: string) => void;
  seatAssignmentsData?: any[];
}

export default function SeatAssignmentForm({ 
  selectedSeat, 
  selectedDate, 
  onClose, 
  onAssign,
  onSeatSelect,
  existingCustomer,
  onEmptySeat,
  seatAssignmentsData
}: SeatAssignmentFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(existingCustomer || null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    title: '',
    name: '',
    phone: '',
    email: '',
    reference: ''
  });

  // existingCustomer değiştiğinde selectedCustomer'ı güncelle
  useEffect(() => {
    setSelectedCustomer(existingCustomer || null);
  }, [existingCustomer]);

  // Müşterileri yükle
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const { data, error } = await customers.getAll();
        if (error) {
          console.error('Error loading customers:', error);
        } else {
          setAllCustomers(data || []);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = allCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowNewCustomerForm(false);
  };

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Yeni müşteri için geçici ID oluştur
      const tempCustomer = {
        id: `temp_${Date.now()}`,
        name: newCustomer.name,
        title: newCustomer.title || undefined,
        phone: newCustomer.phone || undefined,
        email: newCustomer.email || undefined,
        reference: newCustomer.reference || undefined
      };

      setSelectedCustomer(tempCustomer);
      setShowNewCustomerForm(false);
      setNewCustomer({ title: '', name: '', phone: '', email: '', reference: '' });
      
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Müşteri eklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatId: string) => {
    if (onSeatSelect) {
      onSeatSelect(seatId);
    }
  };

  const handleAssign = () => {
    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk atama yapılamaz!');
      return;
    }
    
    if (selectedCustomer && selectedSeat) {
      onAssign({
        customer: selectedCustomer,
        seat: selectedSeat,
        date: '' // Tarih artık page.tsx'de selectedDate'den alınıyor
      });
      onClose();
    }
  };

  const handleEmptySeat = () => {
    // Geçmiş tarihlerde koltuk işlemlerini engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      alert('Geçmiş tarihlerde koltuk boşaltma yapılamaz!');
      return;
    }
    
    if (selectedSeat && onEmptySeat) {
      onEmptySeat(selectedSeat);
      onClose();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Seat Selection */}
      {!selectedSeat && (
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Koltuk Seçimi</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 max-h-60 overflow-y-auto">
            {['A', 'B', 'C', 'D', 'E', 'P'].map(row => {
              const maxSeats = row === 'P' ? 9 : 19;
              return Array.from({ length: maxSeats }, (_, i) => {
                const seatId = `${row}${i + 1}`;
                
                // Gerçek verilerden bu koltuğun atanıp atanmadığını kontrol et
                const assignment = seatAssignmentsData?.find(
                  (assignment: any) => assignment.seat?.row === row && assignment.seat?.number === i + 1
                );
                
                const isOccupied = !!assignment;
                const customer = assignment?.customer;
                
                return (
                  <button
                    key={seatId}
                    onClick={() => handleSeatSelect(seatId)}
                    className={`p-1 sm:p-2 text-xs sm:text-sm font-medium rounded border-2 transition-colors duration-200 ${
                      isOccupied
                        ? customer?.is_deleted
                          ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600'
                          : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                        : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                    }`}
                  >
                    {seatId}
                  </button>
                );
              });
            })}
          </div>
        </div>
      )}

             {/* Seat Info */}
       {selectedSeat && (
                 <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Seçilen Koltuk</h3>
              <div className="text-xl sm:text-2xl font-bold text-blue-800">{selectedSeat}</div>
            </div>
            <div className="flex space-x-1 sm:space-x-2">
                               <button
                  onClick={() => handleSeatSelect('')}
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                >
                  Değiştir
                </button>
                {existingCustomer && onEmptySeat && (
                  (() => {
                    // Geçmiş tarihlerde butonu devre dışı bırak
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDateOnly = new Date(selectedDate);
                    selectedDateOnly.setHours(0, 0, 0, 0);
                    const isPastDate = selectedDateOnly < today;
                    
                    return (
                      <button
                        onClick={handleEmptySeat}
                        disabled={isPastDate}
                        className={`text-xs sm:text-sm font-medium ${
                          isPastDate 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                      >
                        {isPastDate ? 'Geçmiş Tarih' : 'Koltuğu Boşalt'}
                      </button>
                    );
                  })()
                )}
             </div>
           </div>
         </div>
       )}

      {/* Customer Search */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Müşteri Seçimi</h3>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Müşteri ara (isim, telefon, email)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Customer List */}
        {!showNewCustomerForm && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`w-full p-2 sm:p-3 text-left rounded-lg border transition-colors duration-200 ${
                  selectedCustomer?.id === customer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                             >
                 <div className="font-medium text-gray-900 text-sm sm:text-base">
                   {customer.title && <span className="text-gray-600 mr-1">{customer.title}</span>}
                   {customer.name}
                 </div>
                                   {customer.phone && (
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center space-x-1 sm:space-x-2">
                      <Phone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                                   {customer.email && (
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center space-x-1 sm:space-x-2">
                      <Mail className="w-3 h-3" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.reference && (
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center space-x-1 sm:space-x-2">
                      <span className="text-xs bg-gray-200 px-1 sm:px-2 py-1 rounded">Ref</span>
                      <span>{customer.reference}</span>
                    </div>
                  )}
               </button>
            ))}
          </div>
        )}

                 {/* New Customer Form */}
         {showNewCustomerForm && (
           <form onSubmit={handleNewCustomerSubmit} className="space-y-3 sm:space-y-4 border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 bg-gray-50">
             <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                 Ünvan
               </label>
               <input
                 type="text"
                 placeholder="Dr., Prof., Av., Doç., Yrd. Doç. vb."
                 value={newCustomer.title}
                 onChange={(e) => setNewCustomer({ ...newCustomer, title: e.target.value })}
                 className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
             <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                 Ad Soyad
               </label>
               <input
                 type="text"
                 required
                 value={newCustomer.name}
                 onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                 className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
                         <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                 Telefon (Opsiyonel)
               </label>
               <input
                 type="tel"
                 value={newCustomer.phone}
                 onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                 className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
                         <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                 Email (Opsiyonel)
               </label>
               <input
                 type="email"
                 value={newCustomer.email}
                 onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                 className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
             <div>
               <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                 Referans (Opsiyonel)
               </label>
               <input
                 type="text"
                 placeholder="Kim tarafından geldiği, özel not vb."
                 value={newCustomer.reference}
                 onChange={(e) => setNewCustomer({ ...newCustomer, reference: e.target.value })}
                 className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
            <div className="flex space-x-2">
                              <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(false)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* New Customer Button */}
        {!showNewCustomerForm && (
          <button
            onClick={() => setShowNewCustomerForm(true)}
            className="w-full p-2 sm:p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2" />
            <div className="font-medium text-sm sm:text-base">Yeni Müşteri Ekle</div>
          </button>
        )}
      </div>

             {/* Selected Customer */}
       {selectedCustomer && (
         <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-sm sm:text-base font-semibold text-green-900">Seçilen Müşteri</h3>
             <button
               onClick={() => setSelectedCustomer(null)}
               className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium flex items-center space-x-1"
             >
               <X className="w-4 h-4" />
               <span>Sil</span>
             </button>
           </div>
           <div className="text-green-800">
             {selectedCustomer.title && (
               <div className="text-xs sm:text-sm font-medium text-green-700">{selectedCustomer.title}</div>
             )}
                           <div className="font-medium text-sm sm:text-base">{selectedCustomer.name}</div>
              {selectedCustomer.phone && (
                <div className="text-xs sm:text-sm">{selectedCustomer.phone}</div>
              )}
                             {selectedCustomer.email && (
                 <div className="text-xs sm:text-sm">{selectedCustomer.email}</div>
               )}
               {selectedCustomer.reference && (
                 <div className="text-xs sm:text-sm">
                   <span className="text-xs bg-green-200 text-green-800 px-1 sm:px-2 py-1 rounded mr-1 sm:mr-2">Ref</span>
                   {selectedCustomer.reference}
                 </div>
               )}
           </div>
         </div>
       )}

      {/* Action Buttons */}
      <div className="flex space-x-2 sm:space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          İptal
        </button>
                 {(() => {
           // Geçmiş tarihlerde butonu devre dışı bırak
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           const selectedDateOnly = new Date(selectedDate);
           selectedDateOnly.setHours(0, 0, 0, 0);
           const isPastDate = selectedDateOnly < today;
           
           return (
             <button
               onClick={handleAssign}
               disabled={!selectedCustomer || !selectedSeat || isPastDate}
               className={`flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1 sm:space-x-2 ${
                 isPastDate 
                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                   : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
               }`}
             >
               <Save className="w-4 h-4" />
               <span>{isPastDate ? 'Geçmiş Tarih' : 'Koltuk Ata'}</span>
             </button>
           );
         })()}
      </div>
    </div>
  );
} 