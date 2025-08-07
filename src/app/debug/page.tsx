'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugPage() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
  }>({
    supabaseUrl: false,
    supabaseKey: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    setEnvStatus({
      supabaseUrl: !!supabaseUrl && supabaseUrl !== 'your_supabase_url_here',
      supabaseKey: !!supabaseKey && supabaseKey !== 'your_supabase_anon_key_here',
    });

    // Supabase bağlantı testi
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('seats').select('count').limit(1);
        if (error) {
          setConnectionStatus('error');
          setErrorMessage(error.message);
        } else {
          setConnectionStatus('success');
        }
      } catch (error) {
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Sayfası</h1>
        
        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full mr-3 flex items-center justify-center">
                  {envStatus.supabaseUrl ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </span>
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {envStatus.supabaseUrl ? '✅ Tanımlı' : '❌ Eksik'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full mr-3 flex items-center justify-center">
                  {envStatus.supabaseKey ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </span>
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {envStatus.supabaseKey ? '✅ Tanımlı' : '❌ Eksik'}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Supabase Bağlantısı</h2>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full mr-3 flex items-center justify-center">
                {connectionStatus === 'checking' && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
                {connectionStatus === 'success' && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
                {connectionStatus === 'error' && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </span>
              <span className="font-medium">Bağlantı Durumu:</span>
              <span className="ml-2 text-sm">
                {connectionStatus === 'checking' && '🔄 Kontrol ediliyor...'}
                {connectionStatus === 'success' && '✅ Başarılı'}
                {connectionStatus === 'error' && '❌ Hata'}
              </span>
            </div>
            {connectionStatus === 'error' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Troubleshooting */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Sorun Giderme</h2>
            <div className="space-y-3 text-sm text-blue-700">
              <p><strong>Environment Variables Eksikse:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Supabase projenizi oluşturun</li>
                <li>Settings → API bölümünden URL ve anon key'i alın</li>
                <li>Canlı ortamınızda bu değişkenleri tanımlayın</li>
                <li>Uygulamayı yeniden deploy edin</li>
              </ol>
              
              <p className="mt-4"><strong>Bağlantı Hatası Varsa:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Supabase projenizin aktif olduğundan emin olun</li>
                <li>RLS (Row Level Security) kurallarını kontrol edin</li>
                <li>Veritabanı tablolarının oluşturulduğundan emin olun</li>
                <li>API anahtarlarının doğru olduğunu kontrol edin</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
