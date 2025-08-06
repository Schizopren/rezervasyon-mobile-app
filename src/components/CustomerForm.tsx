'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail } from 'lucide-react';
import { customers, Customer } from '../lib/supabase';
import Drawer from './Drawer';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null; // Düzenleme için mevcut müşteri
  onSuccess: () => void;
}

export default function CustomerForm({ isOpen, onClose, customer, onSuccess }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
    reference: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form başlığını belirle
  const isEditing = !!customer;
  const title = isEditing ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle';

  // Form verilerini sıfırla veya mevcut müşteri verilerini yükle
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        title: customer.title || '',
        phone: customer.phone || '',
        email: customer.email || '',
        reference: customer.reference || ''
      });
    } else {
      setFormData({
        name: '',
        title: '',
        phone: '',
        email: '',
        reference: ''
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Ad Soyad alanı zorunludur');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isEditing && customer) {
        // Müşteri güncelle
        const { error } = await customers.update(customer.id, formData);
        if (error) {
          setError('Müşteri güncellenirken hata oluştu');
        } else {
          onSuccess();
          onClose();
        }
      } else {
        // Yeni müşteri ekle
        const { error } = await customers.create(formData);
        if (error) {
          setError('Müşteri eklenirken hata oluştu');
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      setError('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 bg-gray-50">
          {/* Ünvan */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Ünvan
            </label>
            <input
              type="text"
              placeholder="Dr., Prof., Av., Doç., Yrd. Doç. vb."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Ad Soyad */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ad Soyad"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Telefon (Opsiyonel)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0555 123 45 67"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email (Opsiyonel)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ornek@email.com"
            />
          </div>

          {/* Referans */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Referans (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Kim tarafından geldiği, özel not vb."
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Kaydet')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
} 