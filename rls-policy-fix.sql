-- RLS Policy düzeltmeleri
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut policy'leri temizle
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can view non-deleted customers" ON customers;
DROP POLICY IF EXISTS "Admin can view all customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage non-deleted customers" ON customers;

-- 2. Yeni policy'leri oluştur

-- Herkes silinmemiş müşterileri görebilir
CREATE POLICY "Anyone can view non-deleted customers" ON customers
  FOR SELECT USING (is_deleted = FALSE);

-- Giriş yapmış kullanıcılar silinmemiş müşterileri yönetebilir (CREATE, UPDATE, DELETE)
CREATE POLICY "Authenticated users can manage non-deleted customers" ON customers
  FOR ALL USING (
    is_deleted = FALSE AND 
    auth.role() = 'authenticated'
  );

-- Admin'ler tüm müşterileri görebilir (silinmiş olanlar dahil)
CREATE POLICY "Admin can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Admin'ler tüm müşterileri yönetebilir (silinmiş olanlar dahil)
CREATE POLICY "Admin can manage all customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- 3. customers tablosunda RLS'yi etkinleştir (eğer etkin değilse)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Test için mevcut policy'leri kontrol et
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'customers'; 