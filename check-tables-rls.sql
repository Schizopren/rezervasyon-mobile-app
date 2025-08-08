-- RLS ve Tablo Durumu Kontrol Sorguları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut tabloları listele
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- 2. user_profiles tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Foreign key ilişkisini kontrol et
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_profiles';

-- 4. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 5. RLS policy'lerini listele
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Trigger'ları kontrol et
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- 7. Mevcut kullanıcıları ve role'lerini listele
SELECT 
  up.id,
  up.name,
  up.role,
  up.created_at,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- 8. Test: Yeni kullanıcı kaydolduğunda trigger çalışıyor mu?
-- Bu sorgu sadece bilgi amaçlı, çalıştırmayın
-- INSERT INTO auth.users (email, encrypted_password) VALUES ('test@test.com', 'password');
-- Sonra user_profiles tablosunda kayıt oluşup oluşmadığını kontrol edin
