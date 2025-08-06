-- User profiles tablosu (auth.users ile ilişkili)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seats tablosu
CREATE TABLE seats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row TEXT NOT NULL,
  number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(row, number)
);

-- Customers tablosu
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seat assignments tablosu
CREATE TABLE seat_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seat_id, date)
);

-- Indexes
CREATE INDEX idx_seat_assignments_date ON seat_assignments(date);
CREATE INDEX idx_seat_assignments_seat_id ON seat_assignments(seat_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Row Level Security (RLS) kuralları
-- User profiles için RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Seat assignments için RLS
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
-- Admin tüm kayıtları görebilir
CREATE POLICY "Admin can manage all seat assignments" ON seat_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );
-- Employee sadece kendi atadığı kayıtları görebilir
CREATE POLICY "Employee can manage own assignments" ON seat_assignments
  FOR ALL USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Customers için RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- Seats için RLS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seats" ON seats
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage seats" ON seats
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample seats
INSERT INTO seats (row, number) VALUES
  ('A', 1), ('A', 2), ('A', 3), ('A', 4), ('A', 5), ('A', 6), ('A', 7), ('A', 8), ('A', 9), ('A', 10),
  ('A', 11), ('A', 12), ('A', 13), ('A', 14), ('A', 15), ('A', 16), ('A', 17), ('A', 18), ('A', 19),
  ('B', 1), ('B', 2), ('B', 3), ('B', 4), ('B', 5), ('B', 6), ('B', 7), ('B', 8), ('B', 9), ('B', 10),
  ('B', 11), ('B', 12), ('B', 13), ('B', 14), ('B', 15), ('B', 16), ('B', 17), ('B', 18), ('B', 19),
  ('C', 1), ('C', 2), ('C', 3), ('C', 4), ('C', 5), ('C', 6), ('C', 7), ('C', 8), ('C', 9), ('C', 10),
  ('C', 11), ('C', 12), ('C', 13), ('C', 14), ('C', 15), ('C', 16), ('C', 17), ('C', 18), ('C', 19),
  ('D', 1), ('D', 2), ('D', 3), ('D', 4), ('D', 5), ('D', 6), ('D', 7), ('D', 8), ('D', 9), ('D', 10),
  ('D', 11), ('D', 12), ('D', 13), ('D', 14), ('D', 15), ('D', 16), ('D', 17), ('D', 18), ('D', 19),
  ('E', 1), ('E', 2), ('E', 3), ('E', 4), ('E', 5), ('E', 6), ('E', 7), ('E', 8), ('E', 9), ('E', 10),
  ('E', 11), ('E', 12), ('E', 13), ('E', 14), ('E', 15), ('E', 16), ('E', 17), ('E', 18), ('E', 19),
  ('P', 1), ('P', 2), ('P', 3), ('P', 4), ('P', 5), ('P', 6), ('P', 7), ('P', 8), ('P', 9); 