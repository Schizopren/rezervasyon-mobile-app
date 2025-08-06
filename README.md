# Koltuk Atama Sistemi - Web Uygulaması

Bu proje, etkinlik alanlarındaki koltuk atama ve takip sistemi için geliştirilmiş Next.js web uygulamasıdır.

## 🚀 Özellikler

- **Koltuk Yönetimi**: A, B, C, D, E ve P sıralarındaki koltukları görüntüleme ve atama
- **Takvim Entegrasyonu**: Tarih bazlı koltuk atama ve görüntüleme
- **Müşteri Yönetimi**: Müşteri bilgilerini kaydetme ve arama
- **Gerçek Zamanlı Güncelleme**: Supabase ile gerçek zamanlı veri senkronizasyonu
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu arayüz

## 🛠️ Teknolojiler

- **Next.js 14**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Styling
- **Supabase**: Backend ve veritabanı
- **React Query**: Veri yönetimi
- **Lucide React**: İkonlar
- **Date-fns**: Tarih işlemleri

## 📦 Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Environment variables ayarlayın:**
   ```bash
   cp env.example .env.local
   ```
   
   `.env.local` dosyasını düzenleyin:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

4. **Tarayıcıda açın:**
   ```
   http://localhost:3000
   ```

## 🗄️ Veritabanı Yapısı

### Tablolar:
- **users**: Kullanıcı bilgileri
- **seats**: Koltuk bilgileri
- **customers**: Müşteri bilgileri
- **seat_assignments**: Koltuk atamaları

## 🔧 Geliştirme

### Komutlar:
- `npm run dev`: Geliştirme sunucusu
- `npm run build`: Production build
- `npm run start`: Production sunucusu
- `npm run lint`: Kod kontrolü

### Klasör Yapısı:
```
src/
├── app/           # Next.js app router
├── components/    # React componentleri
└── lib/          # Utility fonksiyonları
```

## 🎨 Kullanım

1. **Ana Sayfa**: Koltuk düzeni ve takvim görüntüleme
2. **Koltuk Atama**: Müşteri seçimi ve koltuk atama
3. **Arama**: Müşteri ve koltuk arama
4. **Takvim**: Tarih bazlı görüntüleme

## 🔒 Güvenlik

- Supabase RLS (Row Level Security) aktif
- JWT token tabanlı kimlik doğrulama
- CORS politikaları yapılandırılmış

## 📱 Responsive Tasarım

- Mobil uyumlu arayüz
- Tablet ve masaüstü optimizasyonu
- Touch-friendly koltuk seçimi

## 🚀 Deployment

Vercel ile kolay deployment:
```bash
npm run build
vercel --prod
```
