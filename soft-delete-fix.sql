-- Soft delete düzeltmeleri
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. customers tablosuna is_deleted ve deleted_at kolonlarını ekle (eğer yoksa)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Mevcut kayıtları güncelle (is_deleted = false)
UPDATE customers 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);

-- 4. seat_assignments tablosundaki foreign key constraint'i kontrol et
-- Eğer CASCADE DELETE varsa, bunu kaldırıp NO ACTION yap
-- (Bu komut sadece gerekirse çalıştırılmalı)

-- 5. RLS policy'leri güncelle
-- customers tablosu için
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
CREATE POLICY "Anyone can view non-deleted customers" ON customers
  FOR SELECT USING (is_deleted = FALSE);

-- Admin'lerin tüm müşterileri görebilmesi için
CREATE POLICY "Admin can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Müşteri yönetimi için
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Authenticated users can manage non-deleted customers" ON customers
  FOR ALL USING (
    is_deleted = FALSE AND 
    auth.role() = 'authenticated'
  );

-- 6. seat_assignments tablosu için RLS policy'yi güncelle
-- Silinmiş müşterilerin atamalarını da görebilmek için
DROP POLICY IF EXISTS "Anyone can view seat assignments" ON seat_assignments;
CREATE POLICY "Anyone can view seat assignments" ON seat_assignments
  FOR SELECT USING (true);

-- 7. Test verisi ekle (opsiyonel)
-- INSERT INTO customers (name, title, phone, email) VALUES 
-- ('Test Müşteri 1', 'Dr.', '555-0001', 'test1@example.com'),
-- ('Test Müşteri 2', 'Prof.', '555-0002', 'test2@example.com');

-- 8. Mevcut atamaları kontrol et
-- SELECT sa.date, s.row || s.number as seat, c.name as customer, c.is_deleted
-- FROM seat_assignments sa 
-- JOIN seats s ON sa.seat_id = s.id 
-- JOIN customers c ON sa.customer_id = c.id 
-- ORDER BY sa.date DESC, s.row, s.number; 