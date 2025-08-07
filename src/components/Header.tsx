'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, User, X, ChevronDown, Settings } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

interface HeaderProps {
  onLogout: () => void;
  onSearch?: (query: string) => void;
  onUserProfile?: () => void;
  onLogin?: (email: string, password: string) => Promise<boolean>;
  currentUser?: User | null;
  searchResults?: any[];
  isSearching?: boolean;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export default function Header({ 
  onLogout, 
  onSearch, 
  onUserProfile, 
  onLogin,
  currentUser,
  searchResults = [],
  isSearching = false,
  onNavigate,
  currentPath = '/'
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      handleSearchClose();
    }
  };

  const handleUserClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };



  const handleLogout = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          handleSearchClose();
        }
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
        }

      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchOpen, isUserMenuOpen]);

  // Auto focus input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              KAS
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Search Container */}
              <div className="relative">
                {/* Search Button */}
                <button 
                  ref={searchButtonRef}
                  onClick={handleSearchClick}
                  className={`p-2 text-gray-600 hover:text-gray-900 transition-all duration-300 ${
                    isSearchOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                  }`}
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Search Input - Slides out from button position */}
                <div className={`absolute right-0 top-0 flex items-center transition-all duration-300 ease-out ${
                  isSearchOpen 
                    ? 'opacity-100 translate-x-0 w-64 sm:w-80' 
                    : 'opacity-0 translate-x-4 w-0'
                }`}>
                  <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Ara..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (onSearch) {
                          onSearch(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSearchClose}
                      className="ml-2 p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {/* Search Results Dropdown */}
                  {isSearchOpen && (searchQuery.trim() || isSearching) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          Aranıyor...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {result.customer.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {result.customer.title || 'Başlık yok'}
                              </div>
                              <div className="text-sm text-blue-600 font-medium">
                                {result.seat} koltuğunda
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.trim() ? (
                        <div className="p-4 text-center text-gray-500">
                          Sonuç bulunamadı
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={handleUserClick}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center space-x-1"
                >
                  <User className="w-5 h-5" />
                  {currentUser && (
                    <>
                      <span className="text-sm font-medium text-gray-700 hidden sm:block">
                        {currentUser.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`} />
                    </>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {currentUser && isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                      <div className="text-xs text-gray-500">{currentUser.email}</div>
                      <div className="text-xs text-blue-600 font-medium capitalize">{currentUser.role}</div>
                    </div>
                    <button
                      onClick={onUserProfile}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profil</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>


    </>
  );
} 