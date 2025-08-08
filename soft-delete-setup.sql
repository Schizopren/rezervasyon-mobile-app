-- Soft Delete Sistemi Kurulumu - Customers Tablosu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. customers tablosuna deleted_at alanı ekle
ALTER TABLE customers 
ADD COLUMN deleted_at TIMESTAMP NULL;

-- 2. Index ekle (performans için)
CREATE INDEX idx_customers_deleted_at 
ON customers(deleted_at);

-- 3. Mevcut kayıtlar için deleted_at'i NULL yap
UPDATE customers 
SET deleted_at = NULL 
WHERE deleted_at IS NULL;

-- 4. Test: Mevcut aktif müşterileri listele
SELECT 
  id,
  name,
  title,
  phone,
  email,
  reference,
  deleted_at,
  CASE 
    WHEN deleted_at IS NULL THEN 'Aktif'
    ELSE 'Silindi'
  END as status
FROM customers
ORDER BY deleted_at NULLS FIRST, name;

-- 5. Test: Sadece aktif müşterileri getir
SELECT 
  id,
  name,
  title,
  phone,
  email,
  reference
FROM customers
WHERE deleted_at IS NULL
ORDER BY name;

-- 6. Soft delete fonksiyonu (opsiyonel)
CREATE OR REPLACE FUNCTION soft_delete_customer(customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers 
  SET deleted_at = NOW() 
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Restore fonksiyonu (opsiyonel)
CREATE OR REPLACE FUNCTION restore_customer(customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers 
  SET deleted_at = NULL 
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;
