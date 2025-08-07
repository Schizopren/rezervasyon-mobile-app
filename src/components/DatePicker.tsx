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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700" ref={dropdownRef}>
      {/* Selected Date Display */}
      <div 
        onClick={() => !isReadOnly && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${isReadOnly ? 'cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer'}`}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="text-left">
            <div className="font-semibold text-gray-800 dark:text-gray-200">
              {formatDate(selectedDate)}
            </div>
            {isTodayDate && (
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Bugün</div>
            )}
          </div>
        </div>
        {!isReadOnly && (
          <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !isReadOnly && (
        <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Quick Date Options */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hızlı Seçim</h4>
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
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          <div className="p-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Özel Tarih</h4>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
} 