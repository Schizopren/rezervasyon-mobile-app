'use client';

import { useAuth } from '../hooks/useAuth';
import { Lock, AlertCircle } from 'lucide-react';

interface ProtectedActionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoginPrompt?: boolean;
  permission?: string;
  message?: string;
  variant?: 'default' | 'warning' | 'error';
}

export default function ProtectedAction({ 
  children, 
  fallback,
  showLoginPrompt = true,
  permission,
  message,
  variant = 'default'
}: ProtectedActionProps) {
  const { isAuthenticated, checkPermission } = useAuth();

  // Eğer giriş yapmamışsa
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showLoginPrompt) {
      return (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          variant === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
          variant === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
          'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {message || 'Bu işlem için giriş yapmanız gerekiyor'}
          </span>
        </div>
      );
    }
    
    return null;
  }

  // Eğer permission belirtilmişse ve kullanıcının yetkisi yoksa
  if (permission && !checkPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">
          {message || 'Bu işlem için yetkiniz bulunmuyor'}
        </span>
      </div>
    );
  }

  // Her şey yolunda, children'ı render et
  return <>{children}</>;
}

// HOC (Higher Order Component) versiyonu
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission?: string,
  fallback?: React.ReactNode
) {
  return function WithPermissionComponent(props: P) {
    return (
      <ProtectedAction permission={permission} fallback={fallback}>
        <WrappedComponent {...props} />
      </ProtectedAction>
    );
  };
}

// Kullanım örnekleri için export edilen component'ler
export const ProtectedSeatGrid = withPermission(
  (props: any) => <div {...props} />, 
  'edit_seats',
  <div className="text-center p-4 text-gray-500">Koltuk işlemleri için giriş yapın</div>
);

export const ProtectedDatePicker = withPermission(
  (props: any) => <div {...props} />, 
  'change_date',
  <div className="text-center p-4 text-gray-500">Tarih değiştirmek için giriş yapın</div>
);

export const ProtectedCustomerForm = withPermission(
  (props: any) => <div {...props} />, 
  'edit_customers',
  <div className="text-center p-4 text-gray-500">Müşteri işlemleri için giriş yapın</div>
);
