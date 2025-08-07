'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
import { customers } from '../../lib/supabase';
import { Customer } from '../../lib/supabase';
import Header from '../../components/Header';

import CustomerForm from '../../components/CustomerForm';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CustomersPage() {
  // Mock a default user for testing
  const user = {
    id: '00000000-0000-0000-0000-000000000000', // Geçerli bir UUID formatı
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Cleanup function
    return () => {
      setCustomersList([]);
      setSearchResults([]);
      setIsSearching(false);
      setIsLoading(false);
    };
  }, []);

  // Müşterileri yükle
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await customers.getAll();
      if (error) {
        console.error('Error loading customers:', error);
      } else {
        setCustomersList(data || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Search fonksiyonu
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await customers.search(query);
      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {};

  const handleSearchSubmit = (query: string) => {
    handleSearch(query);
  };

  const handleUserProfile = () => {
    console.log('User profile clicked');
  };

  const handleLogin = async () => true;

  const handleNavigate = (path: string) => {
    if (path === '/') {
      window.location.href = '/';
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerFormOpen(true);
  };

  const handleCustomerFormClose = () => {
    setIsCustomerFormOpen(false);
    setEditingCustomer(null);
  };

  const handleCustomerFormSuccess = () => {
    loadCustomers(); // Müşteri listesini yenile
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await customers.delete(customerToDelete.id);
      if (error) {
        console.error('Error deleting customer:', error);
        alert('Müşteri silinirken hata oluştu!');
      } else {
        loadCustomers(); // Müşteri listesini yenile
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Müşteri silinirken hata oluştu!');
    }
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  // Hydration tamamlanana kadar loading göster
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        onLogout={handleLogout}
        onSearch={handleSearchSubmit}
        onUserProfile={handleUserProfile}
        onLogin={handleLogin}
        currentUser={user}
        searchResults={searchResults}
        isSearching={isSearching}
        onNavigate={handleNavigate}
        currentPath="/customers"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        {(
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors duration-200"
              >
                Koltuk Düzeni
              </button>
              <button
                onClick={() => {
                  // Bu sayfa aktif
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg"
              >
                Kişiler
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kişiler</h1>
            </div>
            {(
              <button 
                onClick={handleAddCustomer}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kişi Ekle</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {(
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Kişi ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Kişiler yükleniyor...</p>
            </div>
          ) : customersList.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Henüz kişi eklenmemiş</h3>
              <p className="text-gray-500 dark:text-gray-400">İlk kişiyi eklemek için "Yeni Kişi Ekle" butonuna tıklayın.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ad Soyad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Referans
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {customersList.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{customer.title || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{customer.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{customer.reference || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <Eye className="w-4 h-4" />
                          </button>
                                                     <button 
                             onClick={() => handleEditCustomer(customer)}
                             className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1"
                           >
                             <Edit className="w-4 h-4" />
                           </button>
                                                     <button 
                             onClick={() => handleDeleteCustomer(customer)}
                             className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
                 </div>
       </main>

               {/* Customer Form Modal */}
        <CustomerForm
          isOpen={isCustomerFormOpen}
          onClose={handleCustomerFormClose}
          customer={editingCustomer}
          onSuccess={handleCustomerFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleDeleteDialogClose}
          onConfirm={handleConfirmDelete}
          title="Müşteri Sil"
          message={`"${customerToDelete?.name}" adlı müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          type="danger"
        />
      </div>
    );
  } 