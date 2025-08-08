'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Sun, Moon, User, LogOut, Settings } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import LoginDropdown from './LoginDropdown';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchResults?: any[];
  isSearching?: boolean;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export default function Header({ 
  onSearch, 
  searchResults = [],
  isSearching = false,
  onNavigate,
  currentPath = '/'
}: HeaderProps) {
  const { theme, toggleTheme } = useThemeContext();
  const { user, isAuthenticated, logout, isLoggingOut, userProfile } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
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
    if (isAuthenticated) {
      setIsUserMenuOpen(!isUserMenuOpen);
      setIsLoginOpen(false);
    } else {
      setIsLoginOpen(!isLoginOpen);
      setIsUserMenuOpen(false);
    }
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  const handleUserMenuClose = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };







  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          handleSearchClose();
        }
        if (isLoginOpen) {
          handleLoginClose();
        }
        if (isUserMenuOpen) {
          handleUserMenuClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchOpen, isLoginOpen, isUserMenuOpen]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        handleUserMenuClose();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Auto focus input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);



  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              KAS
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

                             {/* Search Container */}
               <div className="relative">
                 {/* Search Button */}
                 <button 
                   ref={searchButtonRef}
                   onClick={handleSearchClick}
                   className={`p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-300 ${
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
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                     />
                     <button
                       type="button"
                       onClick={handleSearchClose}
                       className="ml-2 p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </form>
                   
                   {/* Search Results Dropdown */}
                   {isSearchOpen && (searchQuery.trim() || isSearching) && (
                     <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
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
                               className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                             >
                               <div className="font-medium text-gray-900 dark:text-white">
                                 {result.customer.name}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
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

                               {/* Profile Icon */}
                <div className="relative" ref={userMenuRef}>
                                     <button
                     onClick={handleUserClick}
                     className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200"
                     aria-label="Profil"
                   >
                     <User className="w-5 h-5" />
                   </button>
                  
                  {/* Login Dropdown */}
                  <LoginDropdown
                    isOpen={isLoginOpen}
                    onClose={handleLoginClose}
                  />
                  
                  {/* User Menu Dropdown */}
                  {isAuthenticated && isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userProfile?.name || user?.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Giriş yapıldı
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                        </button>
                      </div>
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