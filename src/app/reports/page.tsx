'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, TrendingUp, Eye, Phone, Mail, User } from 'lucide-react';
import Header from '../../components/Header';
import { customerReports } from '../../lib/supabase';
import ProtectedAction from '../../components/ProtectedAction';

interface CustomerStats {
  customer: {
    id: string;
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    created_at: string;
    deleted_at?: string;
  };
  visitCount: number;
  lastVisit: string;
  firstVisit: string;
  visits: Array<{
    date: string;
    created_at: string;
  }>;
}

interface GeneralStats {
  total: number;
  active: number;
  deleted: number;
  newThisMonth: number;
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [topCustomers, setTopCustomers] = useState<CustomerStats[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStats | null>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    // Mock search implementation
    setTimeout(() => {
      setIsSearching(false);
      setSearchResults([]);
    }, 500);
  };

  const handleSearchSubmit = (query: string) => {
    handleSearch(query);
  };

  const handleNavigate = (path: string) => {
    if (path === '/') {
      window.location.href = '/';
    } else if (path === '/customers') {
      window.location.href = '/customers';
    } else if (path === '/reports') {
      // Bu sayfa aktif
    }
  };

  // Kişi detaylarını görüntüle
  const handleViewCustomerDetails = async (customer: CustomerStats) => {
    setSelectedCustomer(customer);
    setIsHistoryLoading(true);
    
    try {
      const { data: history } = await customerReports.getCustomerVisitHistory(customer.customer.id);
      setCustomerHistory(history || []);
    } catch (error) {
      console.error('Kişi geçmişi yüklenirken hata:', error);
      setCustomerHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Kişi detay modal'ını kapat
  const handleCloseCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerHistory([]);
    setIsHistoryLoading(false);
  };

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // En sık gelen Kişileri yükle
        const { data: topCustomersData } = await customerReports.getTopCustomers(10);
        setTopCustomers(topCustomersData || []);

        // Genel istatistikleri yükle
        const { data: statsData } = await customerReports.getCustomerStats();
        setGeneralStats(statsData);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Kişi arama
  const filteredCustomers = topCustomers.filter(customer =>
    customer.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.customer.title && customer.customer.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        onSearch={handleSearchSubmit}
        searchResults={searchResults}
        isSearching={isSearching}
        onNavigate={handleNavigate}
        currentPath="/reports"
      />

      {/* Main Content */}
      <ProtectedAction permission="view_reports">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors duration-200"
              >
                Koltuk Düzeni
              </button>
              <button
                onClick={() => window.location.href = '/customers'}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors duration-200"
              >
                Kişiler
              </button>
              <button
                onClick={() => {
                  // Bu sayfa aktif
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg"
              >
                Raporlar
              </button>
            </div>
          </div>

        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6 mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kişi İstatistikleri</h1>
          </div>
        </div>

        {/* General Statistics Cards */}
        {generalStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {generalStats.total}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Toplam Kişi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sistemde kayıtlı tüm Kişiler
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-green-500">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {generalStats.active}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aktif Kişi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Silinmemiş Kişiler
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-red-500">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {generalStats.deleted}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Silinmiş Kişi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Soft delete ile silinmiş
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-purple-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {generalStats.newThisMonth}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Bu Ay Yeni
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Bu ay eklenen Kişiler
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Kişi ara (ad, başlık)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              En Sık Gelen Kişiler (Top 10)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Kişi istatistikleri yükleniyor...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Kişi bulunamadı</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : 'Henüz Kişi ziyaret kaydı yok.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kişi Bilgileri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ziyaret Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İlk Ziyaret
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Son Ziyaret
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customerStats, index) => (
                    <tr key={customerStats.customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {customerStats.customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {customerStats.customer.name}
                              {customerStats.customer.deleted_at && (
                                <span className="ml-2 text-xs text-red-500">(Silindi)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customerStats.customer.title || 'Başlık belirtilmemiş'}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              {customerStats.customer.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {customerStats.customer.phone}
                                </div>
                              )}
                              {customerStats.customer.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {customerStats.customer.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customerStats.visitCount} kez
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          #{index + 1} sırada
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customerStats.firstVisit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customerStats.lastVisit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewCustomerDetails(customerStats)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Detay</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      </ProtectedAction>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedCustomer.customer.name} - Detaylı Rapor
              </h2>
              <button
                onClick={handleCloseCustomerDetails}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Genel Bilgiler</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Toplam Ziyaret:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedCustomer.visitCount} kez</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">İlk Ziyaret:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedCustomer.firstVisit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Son Ziyaret:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedCustomer.lastVisit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Başlık:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedCustomer.customer.title || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">İletişim Bilgileri</h3>
                  <div className="space-y-2">
                    {selectedCustomer.customer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.customer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.customer.email}</span>
                      </div>
                    )}
                    {!selectedCustomer.customer.phone && !selectedCustomer.customer.email && (
                      <span className="text-gray-500 dark:text-gray-400">İletişim bilgisi bulunamadı</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visit History */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ziyaret Geçmişi</h3>
                {isHistoryLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Ziyaret geçmişi yükleniyor...</p>
                  </div>
                ) : customerHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-100 dark:bg-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Tarih
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Koltuk
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Sıra
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {customerHistory.map((visit: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {formatDate(visit.date)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {visit.seat?.number || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {visit.seat?.row || 'N/A'}
                              {visit.seat?.row === 'P' && (
                                <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">(VIP)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Ziyaret geçmişi bulunamadı</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleCloseCustomerDetails}
                className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
