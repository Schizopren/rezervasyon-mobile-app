-- Login kontrollerini kaldır
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Customers tablosu için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Anyone can view non-deleted customers" ON customers;
DROP POLICY IF EXISTS "Admin can view all customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage non-deleted customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;

-- Yeni politika: Herkes tüm işlemleri yapabilir
CREATE POLICY "Anyone can do anything" ON customers FOR ALL USING (true);

-- Seats tablosu için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Anyone can view seats" ON seats;
DROP POLICY IF EXISTS "Authenticated users can manage seats" ON seats;

-- Yeni politika: Herkes tüm işlemleri yapabilir
CREATE POLICY "Anyone can do anything" ON seats FOR ALL USING (true);

-- Seat assignments tablosu için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Admin can manage all seat assignments" ON seat_assignments;
DROP POLICY IF EXISTS "Employee can manage own assignments" ON seat_assignments;
DROP POLICY IF EXISTS "Anyone can view seat assignments" ON seat_assignments;

-- Yeni politika: Herkes tüm işlemleri yapabilir
CREATE POLICY "Anyone can do anything" ON seat_assignments FOR ALL USING (true);
