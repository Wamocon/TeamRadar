-- ============================================================
-- TeamRadar – Seed-Skript für TEST-Schema (Massen-Daten)
-- 
-- Generiert proportional:
-- 100 Mitarbeiter, 75 Projekte (25 Ext, 50 Int), 25 Teams
-- Auslastungen: 25x 150%, 25x 120%, 25x 100%, 25x <100%
-- Mit realistischen Namen und Bezeichnungen!
-- ============================================================

SET search_path TO test;

-- ── 1. CLEANUP ───────────────────────────────────────────────
DELETE FROM allocations;
DELETE FROM availabilities;
DELETE FROM teams;
DELETE FROM projects;
DELETE FROM members;

DO $$
DECLARE
  v_user_id UUID := 'd3529c12-6065-46af-9967-7c66a0e7385e';
  today DATE := current_date;
  
  m_ids UUID[] := '{}';
  p_ext_ids UUID[] := '{}';
  p_int_ids UUID[] := '{}';
  t_ids UUID[] := '{}';
  
  i INT;
  new_id UUID;
  s DATE := today - 20;
  e DATE := today + 60;
  
  -- Arrays für realistische Namensgenerierung
  first_names text[] := ARRAY['Anna', 'Ben', 'Clara', 'David', 'Elena', 'Felix', 'Greta', 'Hans', 'Ina', 'Jan', 'Klara', 'Lukas', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Sara', 'Tom', 'Ute'];
  last_names text[] := ARRAY['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'];
  
  ext_clients text[] := ARRAY['MegaCorp', 'Bank24', 'GloboLog', 'SwissInsul', 'DataVent', 'TechNova AI', 'BioHealth Systems', 'AeroSpace Inc.', 'Quantum Solutions', 'Nexus Dynamics', 'Alpha Banking', 'Beta Logistics', 'Gamma Commerce', 'Delta Healthcare', 'Epsilon Tech'];
  ext_projects text[] := ARRAY['E-Commerce Relaunch', 'Banking App iOS', 'Cloud Migration', 'Customer Portal V2', 'Data Analytics BI', 'CRM Integration', 'Payment Gateway Update', 'Mobile App Android', 'Web Frontend Redesign', 'Legacy Backend API'];
  
  int_projects text[] := ARRAY['Internal Admin App', 'TeamRadar Refactoring', 'Infrastructure Upgrade', 'Mobile Chat App', 'Design System V2', 'Knowledge Base Wiki', 'AI Assistant Bot', 'Onboarding Portal', 'HR Dashboard', 'Time Tracking V3', 'Serverless Migration', 'Docker Containerization', 'Automated Testing Setup', 'Security Audit Fixes', 'Performance Optimization'];
  
  team_first text[] := ARRAY['Core', 'UI/UX', 'Project', 'Quality', 'General', 'Mobile', 'Data', 'Cloud', 'Security', 'Platform', 'Backend', 'Frontend', 'Analytics', 'DevOps', 'Agile'];
  team_second text[] := ARRAY['Backend', 'Avengers', 'Titans', 'Squad', 'Support', 'Ninjas', 'Science', 'Operations', 'Team', 'Engineering', 'Innovators', 'Masters', 'Force', 'Gurus', 'Heroes'];
  
  roles text[] := ARRAY['Senior Dev', 'Junior Dev', 'UI Designer', 'Project Manager', 'QA Engineer', 'Product Owner', 'DevOps', 'Architect', 'Fullstack Dev', 'Backend Dev'];
  departments text[] := ARRAY['Software', 'Design', 'PMO', 'QA', 'Infrastructure', 'Product', 'Strategy', 'Sales'];
  
  f_name text;
  l_name text;
BEGIN

  -- ── 2. MITARBEITER (100 Personen) ──────────────────────────
  FOR i IN 1..100 LOOP
    new_id := gen_random_uuid();
    m_ids := array_append(m_ids, new_id);
    
    f_name := first_names[1 + floor(random() * array_length(first_names, 1))];
    l_name := last_names[1 + floor(random() * array_length(last_names, 1))];
    
    INSERT INTO members (id, user_id, name, email, role, department)
    VALUES (
      new_id, 
      v_user_id, 
      f_name || ' ' || l_name, 
      lower(f_name) || '.' || lower(l_name) || i || '@firma.de', 
      roles[1 + floor(random() * array_length(roles, 1))],
      departments[1 + floor(random() * array_length(departments, 1))]
    );
  END LOOP;

  -- ── 3. PROJEKTE (75 Gesamt) ────────────────────────────────
  -- 25 Externe
  FOR i IN 1..25 LOOP
    new_id := gen_random_uuid();
    p_ext_ids := array_append(p_ext_ids, new_id);
    
    INSERT INTO projects (id, user_id, name, type, status, client, description, start_date, end_date)
    VALUES (
      new_id, v_user_id, 
      ext_projects[1 + floor(random() * array_length(ext_projects, 1))] || ' ' || i, 
      'external', 'active', 
      ext_clients[1 + floor(random() * array_length(ext_clients, 1))], 
      'Externes Entwicklungsprojekt zur Digitalisierung', today - (floor(random() * 60))::int, today + (60 + floor(random() * 180))::int
    );
  END LOOP;

  -- 50 Interne (mit Fokus App-Entwicklung)
  FOR i IN 1..50 LOOP
    new_id := gen_random_uuid();
    p_int_ids := array_append(p_int_ids, new_id);
    
    INSERT INTO projects (id, user_id, name, type, status, description, start_date, end_date)
    VALUES (
      new_id, v_user_id, 
      int_projects[1 + floor(random() * array_length(int_projects, 1))] || ' P' || i, 
      'internal', 'active', 'Internes Infrastruktur- oder Software-Projekt', today - (floor(random() * 45))::int, today + (45 + floor(random() * 90))::int
    );
  END LOOP;

  -- ── 4. TEAMS (25 Gruppen) ──────────────────────────────────
  FOR i IN 1..25 LOOP
    new_id := gen_random_uuid();
    t_ids := array_append(t_ids, new_id);
    
    INSERT INTO teams (id, user_id, name, description, member_ids)
    VALUES (
      new_id, v_user_id, 
      team_first[1 + floor(random() * array_length(team_first, 1))] || ' ' || team_second[1 + floor(random() * array_length(team_second, 1))], 
      'Interdisziplinäres Team für Software- und Produktentwicklung', 
      ARRAY[m_ids[(i-1)*4 + 1], m_ids[(i-1)*4 + 2], m_ids[(i-1)*4 + 3], m_ids[(i-1)*4 + 4]]
    );
  END LOOP;

  -- ── 5. VERFÜGBARKEITEN (Meetings & Urlaub) ─────────────────
  FOR i IN 1..100 LOOP
    -- Standard-Meeting für alle
    INSERT INTO availabilities (user_id, member_id, status, date, start_time, end_time, note)
    VALUES (v_user_id, m_ids[i], 'meeting', today, '10:00', '11:00', 'Daily Sync & Standup');
    
    -- Urlaub bei jedem 10. Mitarbeiter (produziert Vacation-Conflicts!)
    IF i % 10 = 0 THEN
       INSERT INTO availabilities (user_id, member_id, status, date, note)
       VALUES (v_user_id, m_ids[i], 'vacation', today, 'Jahresurlaub auf Mallorca');
    END IF;
  END LOOP;

  -- ── 6. ALLOCATIONS & PROJECT MEMBER SYNC ───────────────────
  
  -- 25 extrem überlastet (150%) - IDs 1 bis 25
  -- Arbeiten an 3 Projekten je 50%
  FOR i IN 1..25 LOOP
    INSERT INTO allocations (user_id, member_id, project_id, percentage, start_date, end_date) VALUES 
    (v_user_id, m_ids[i], p_ext_ids[i], 50, s, e),
    (v_user_id, m_ids[i], p_int_ids[i], 50, s, e),
    (v_user_id, m_ids[i], p_int_ids[i+25], 50, s, e);
    
    -- Sync Arrays
    UPDATE projects SET member_ids = array_append(member_ids, m_ids[i]) WHERE id IN (p_ext_ids[i], p_int_ids[i], p_int_ids[i+25]);
  END LOOP;

  -- 25 leicht überlastet (120%) - IDs 26 bis 50
  -- Arbeiten an 2 Projekten je 60%
  FOR i IN 26..50 LOOP
    INSERT INTO allocations (user_id, member_id, project_id, percentage, start_date, end_date) VALUES 
    (v_user_id, m_ids[i], p_ext_ids[i-25], 60, s, e),
    (v_user_id, m_ids[i], p_int_ids[i], 60, s, e);
    
    UPDATE projects SET member_ids = array_append(member_ids, m_ids[i]) WHERE id IN (p_ext_ids[i-25], p_int_ids[i]);
  END LOOP;

  -- 25 genau 100% - IDs 51 bis 75
  -- Arbeiten an 2 Projekten je 50%
  FOR i IN 51..75 LOOP
    INSERT INTO allocations (user_id, member_id, project_id, percentage, start_date, end_date) VALUES 
    (v_user_id, m_ids[i], p_ext_ids[i-50], 50, s, e),
    (v_user_id, m_ids[i], p_int_ids[i-25], 50, s, e);
    
    UPDATE projects SET member_ids = array_append(member_ids, m_ids[i]) WHERE id IN (p_ext_ids[i-50], p_int_ids[i-25]);
  END LOOP;

  -- Letzte 25 unter 100% - IDs 76 bis 100
  -- 20 Teilnehmer auf 60%
  FOR i IN 76..95 LOOP
    INSERT INTO allocations (user_id, member_id, project_id, percentage, start_date, end_date) VALUES 
    (v_user_id, m_ids[i], p_int_ids[i-50], 60, s, e);
    
    UPDATE projects SET member_ids = array_append(member_ids, m_ids[i]) WHERE id = p_int_ids[i-50];
  END LOOP;
  -- Die restlichen (96-100) erhalten keine Zuweisung! Das triggert den passenden Warning-Alert in der App.

END $$;
