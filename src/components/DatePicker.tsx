'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isReadOnly?: boolean;
}

export default function DatePicker({ selectedDate, onDateSelect, isReadOnly = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickDates = [
    { label: 'Bugün', date: new Date() },
    { label: 'Yarın', date: addDays(new Date(), 1) },
    { label: '1 Hafta Sonra', date: addDays(new Date(), 7) },
  ];

  const formatDate = (date: Date) => {
    try {
      // Geçersiz tarih kontrolü
      if (!date || isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }
      return format(date, 'EEEE, d MMMM yyyy', { locale: tr });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Geçersiz tarih';
    }
  };

  const isTodayDate = isToday(selectedDate);

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200" ref={dropdownRef}>
      {/* Selected Date Display */}
      <div 
        onClick={() => !isReadOnly && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 ${isReadOnly ? 'cursor-default' : 'hover:bg-gray-100 transition-colors duration-200 cursor-pointer'}`}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <div className="font-semibold text-gray-800">
              {formatDate(selectedDate)}
            </div>
            {isTodayDate && (
              <div className="text-xs text-blue-600 font-medium">Bugün</div>
            )}
          </div>
        </div>
        {!isReadOnly && (
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !isReadOnly && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Quick Date Options */}
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Hızlı Seçim</h4>
            <div className="grid grid-cols-1 gap-1">
              {quickDates.map(({ label, date }) => (
                <button
                  key={label}
                  onClick={() => {
                    onDateSelect(date);
                    setIsOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded text-sm transition-colors duration-200 ${
                    isSameDay(date, selectedDate)
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          <div className="p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Özel Tarih</h4>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                try {
                  const newDate = new Date(e.target.value);
                  // Geçersiz tarih kontrolü
                  if (!isNaN(newDate.getTime())) {
                    onDateSelect(newDate);
                    setIsOpen(false);
                  }
                } catch (error) {
                  console.error('Date parsing error:', error);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
} 