-- Auth Trigger'ını Ekle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Function oluştur (eğer yoksa)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger oluştur (eğer yoksa)
DO $$
BEGIN
    -- Eğer trigger varsa sil
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Yeni trigger oluştur
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- 3. Test: Trigger'ın oluşturulduğunu kontrol et
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_name = 'on_auth_user_created';
