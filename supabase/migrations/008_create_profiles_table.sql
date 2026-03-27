-- ============================================================
-- TeamRadar – Profiles Tabelle für ALLE Schemas (public, test, prod)
-- ============================================================

-- SCHEMA: public
SET search_path TO public;
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  role         TEXT DEFAULT 'user',
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles sind für alle Lesbar" ON profiles;
CREATE POLICY "Profiles sind für alle Lesbar" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Eigene Profiles ändern" ON profiles;
CREATE POLICY "Eigene Profiles ändern" ON profiles FOR UPDATE USING (auth.uid() = id);

-- SCHEMA: test
SET search_path TO test;
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  role         TEXT DEFAULT 'user',
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles sind für alle Lesbar" ON profiles;
CREATE POLICY "Profiles sind für alle Lesbar" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Eigene Profiles ändern" ON profiles;
CREATE POLICY "Eigene Profiles ändern" ON profiles FOR UPDATE USING (auth.uid() = id);

-- SCHEMA: prod
SET search_path TO prod;
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  role         TEXT DEFAULT 'user',
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles sind für alle Lesbar" ON profiles;
CREATE POLICY "Profiles sind für alle Lesbar" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Eigene Profiles ändern" ON profiles;
CREATE POLICY "Eigene Profiles ändern" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── TRIGGER: Automatisches Profil bei Sign-up ──────────────────
-- Diese Funktion erstellt ein Profil in allen Schemas, wenn ein neuer
-- User in auth.users angelegt wird.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- In public einfügen
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  
  -- In test einfügen (falls Schema existiert)
  INSERT INTO test.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  
  -- In prod einfügen (falls Schema existiert)
  INSERT INTO prod.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf auth.users setzen (muss im public Schema oder global sein)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
