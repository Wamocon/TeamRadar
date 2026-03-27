-- ============================================================
-- TeamRadar – Rollenbasiertes Zugriffskonzept (RBAC) (FIXED)
-- 
-- Führe dieses Skript im Supabase SQL Editor aus.
-- Dieses Skript ist idempotent und erweitert bestehende Tabellen sicher.
-- ============================================================

-- ── 1. PROFILES TABELLE & TRIGGER (GLOBAL) ─────────────────
SET search_path TO public;

-- Tabelle sicherstellen
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fehlende Spalten sicher hinzufügen (Robustheit gegen bestehende Tabellen)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- CHECK-Constraint für Rollen (falls noch nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('admin', 'cio', 'department_lead', 'employee'));
    END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Nutzer können eigene Profile lesen" ON profiles;
CREATE POLICY "Nutzer können eigene Profile lesen" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Nutzer können eigene Profile ändern" ON profiles;
CREATE POLICY "Nutzer können eigene Profile ändern" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins können alle Profile lesen" ON profiles;
CREATE POLICY "Admins können alle Profile lesen" ON profiles FOR SELECT USING (
  public.get_user_role() = 'admin'
);

-- Trigger-Funktion: Erstellt automatisch ein Profil bei Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''), 
    'employee'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger an auth.users binden
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. RLS FUNKTIONEN ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS TEXT AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ── 3. SCHEMA-ÜBERGREIFENDE RLS-POLICIES ────────────────────
DO $$
DECLARE
    schema_name TEXT;
    schemas TEXT[] := ARRAY['public', 'test', 'prod'];
BEGIN
    FOREACH schema_name IN ARRAY schemas LOOP
        EXECUTE format('SET search_path TO %I', schema_name);

        -- Check if tables exist before applying policies
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'members') THEN
            EXECUTE 'DROP POLICY IF EXISTS "RBAC Members" ON members';
            EXECUTE 'CREATE POLICY "RBAC Members" ON members FOR ALL USING (
                public.get_user_role() IN (''admin'', ''cio'') OR 
                (public.get_user_role() = ''department_lead'' AND department = public.get_user_department()) OR
                (auth.uid() = user_id)
            )';
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'availabilities') THEN
            EXECUTE 'DROP POLICY IF EXISTS "RBAC Availabilities" ON availabilities';
            EXECUTE 'CREATE POLICY "RBAC Availabilities" ON availabilities FOR ALL USING (
                public.get_user_role() IN (''admin'', ''cio'') OR 
                (public.get_user_role() = ''department_lead'') OR
                (auth.uid() = user_id)
            )';
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'projects') THEN
            EXECUTE 'DROP POLICY IF EXISTS "RBAC Projects" ON projects';
            EXECUTE 'CREATE POLICY "RBAC Projects" ON projects FOR ALL USING (
                public.get_user_role() IN (''admin'', ''cio'', ''department_lead'') OR
                (auth.uid() = user_id)
            )';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'allocations') THEN
            EXECUTE 'DROP POLICY IF EXISTS "RBAC Allocations" ON allocations';
            EXECUTE 'CREATE POLICY "RBAC Allocations" ON allocations FOR ALL USING (
                public.get_user_role() IN (''admin'', ''cio'', ''department_lead'') OR
                (auth.uid() = user_id)
            )';
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'teams') THEN
            EXECUTE 'DROP POLICY IF EXISTS "RBAC Teams" ON teams';
            EXECUTE 'CREATE POLICY "RBAC Teams" ON teams FOR ALL USING (
                public.get_user_role() IN (''admin'', ''cio'', ''department_lead'') OR
                (auth.uid() = user_id)
            )';
        END IF;
        
        -- Berechtigungen für alle Schemas korrigieren (MASTER-FIX)
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, authenticator, service_role', schema_name);
        EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO authenticated, service_role', schema_name);
        EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO authenticated, service_role', schema_name);
        
        -- Zukünftige Tabellen automatisch freigeben
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated, service_role', schema_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO authenticated, service_role', schema_name);
    END LOOP;
END $$;

-- ── 4. SPEZIAL-FIX: TABELLENRECHTE (Kollektive Prüfung) ───────
-- Dies stellt sicher, dass auch anonyme Verbindungen initial nicht blockiert werden
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;


-- ── 4. INITIALEN ADMIN SETZEN ─────────────────────────────────
-- ERSETZE 'deine-user-uuid' durch deine tatsächliche Auth-ID (siehe Supabase Auth -> Users),
-- um dich zum Admin zu machen.
--
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'deine-user-uuid';
