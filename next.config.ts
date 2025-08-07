import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canlı ortam optimizasyonları - standalone'ı kaldırıyoruz
  // output: 'standalone', // Bu satırı kaldırıyoruz
  experimental: {
    // Turbopack'i dev'de kullan, production'da normal build
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Image optimizasyonu
  images: {
    domains: ['localhost'],
    unoptimized: true, // Canlı ortamda image optimizasyonunu devre dışı bırak
  },
  // Compiler optimizasyonları
  compiler: {
    removeConsole: false, // Hataları görmek için console.log'ları kaldırmıyoruz
  },
  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
