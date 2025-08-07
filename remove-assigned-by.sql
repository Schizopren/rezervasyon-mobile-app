-- assigned_by alanını kaldır
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce foreign key constraint'i kaldır
ALTER TABLE seat_assignments
DROP CONSTRAINT IF EXISTS seat_assignments_assigned_by_fkey;

-- Sonra kolonu kaldır
ALTER TABLE seat_assignments
DROP COLUMN IF EXISTS assigned_by;
