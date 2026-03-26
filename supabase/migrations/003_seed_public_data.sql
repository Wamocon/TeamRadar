-- ============================================================
-- TeamRadar – Finales Seed-Skript (public)
-- 
-- 20 Mitarbeiter, 15 Projekte, 5 Teams, Auslastungen & Alerts
-- Inklusive ALLOCATIONS für echte Kapazitätsplanung
--
-- WICHTIG: Führe zuerst 004_add_allocations_table.sql aus!
-- ============================================================

SET search_path TO public;

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

  -- Member IDs
  m1 UUID := gen_random_uuid();  m2 UUID := gen_random_uuid();  m3 UUID := gen_random_uuid();
  m4 UUID := gen_random_uuid();  m5 UUID := gen_random_uuid();  m6 UUID := gen_random_uuid();
  m7 UUID := gen_random_uuid();  m8 UUID := gen_random_uuid();  m9 UUID := gen_random_uuid();
  m10 UUID := gen_random_uuid(); m11 UUID := gen_random_uuid(); m12 UUID := gen_random_uuid();
  m13 UUID := gen_random_uuid(); m14 UUID := gen_random_uuid(); m15 UUID := gen_random_uuid();
  m16 UUID := gen_random_uuid(); m17 UUID := gen_random_uuid(); m18 UUID := gen_random_uuid();
  m19 UUID := gen_random_uuid(); m20 UUID := gen_random_uuid();

  -- Project IDs (5 extern, 10 intern)
  p_ext1 UUID := gen_random_uuid(); p_ext2 UUID := gen_random_uuid();
  p_ext3 UUID := gen_random_uuid(); p_ext4 UUID := gen_random_uuid();
  p_ext5 UUID := gen_random_uuid();
  p_int1 UUID := gen_random_uuid(); p_int2 UUID := gen_random_uuid();
  p_int3 UUID := gen_random_uuid(); p_int4 UUID := gen_random_uuid();
  p_int5 UUID := gen_random_uuid(); p_int6 UUID := gen_random_uuid();
  p_int7 UUID := gen_random_uuid(); p_int8 UUID := gen_random_uuid();
  p_int9 UUID := gen_random_uuid(); p_int10 UUID := gen_random_uuid();

  s DATE; e DATE;

BEGIN
  s := today - 20;
  e := today + 60;

  -- ── 2. MITARBEITER (20 Personen) ───────────────────────────
  INSERT INTO members (id, user_id, name, email, role, department) VALUES
  -- Stark überlastet (m1-m5)
  (m1,  v_user_id, 'Markus Überlast',   'markus@firma.de',   'Senior Dev',      'Software'),
  (m2,  v_user_id, 'Sarah Stress',      'sarah@firma.de',    'UI Designer',     'Design'),
  (m3,  v_user_id, 'Thomas Burnout',    'thomas@firma.de',   'Architect',       'Software'),
  (m4,  v_user_id, 'Julia Vielzuviel',  'julia@firma.de',    'Project Manager', 'PMO'),
  (m5,  v_user_id, 'Kevin Chaos',       'kevin@firma.de',    'Backend Dev',     'Software'),
  -- Leicht überlastet (m6-m10)
  (m6,  v_user_id, 'Lukas Leichtviel',  'lukas@firma.de',    'Frontend Dev',    'Software'),
  (m7,  v_user_id, 'Anna Angespannt',   'anna@firma.de',     'Product Owner',   'Product'),
  (m8,  v_user_id, 'Ben Belastet',      'ben@firma.de',      'QA Engineer',     'QA'),
  (m9,  v_user_id, 'Ina Intensiv',      'ina@firma.de',      'DevOps',          'Infrastructure'),
  (m10, v_user_id, 'Paul Plus',         'paul@firma.de',     'Mobile Dev',      'Software'),
  -- Genau 100% (m11-m15)
  (m11, v_user_id, 'Max Genau',         'max@firma.de',      'Senior Dev',      'Software'),
  (m12, v_user_id, 'Lisa Hundert',      'lisa@firma.de',     'Designer',        'Design'),
  (m13, v_user_id, 'Clara Punkt',       'clara@firma.de',    'Fullstack Dev',   'Software'),
  (m14, v_user_id, 'David Exakt',       'david@firma.de',    'Analyst',         'Strategy'),
  (m15, v_user_id, 'Elena Full',        'elena@firma.de',    'Manager',         'PMO'),
  -- Unter 100% (m16-m20)
  (m16, v_user_id, 'Simon Chill',       'simon@firma.de',    'Junior Dev',      'Software'),
  (m17, v_user_id, 'Tanja Teilzeit',    'tanja@firma.de',    'HR Specialist',   'HR'),
  (m18, v_user_id, 'Oliver Off',        'oliver@firma.de',   'Marketing',       'Sales'),
  (m19, v_user_id, 'Maja Minimum',      'maja@firma.de',     'Intern',          'Software'),
  (m20, v_user_id, 'Felix Frei',        'felix@firma.de',    'Admin',           'Office');

  -- ── 3. PROJEKTE (5 Extern + 10 Intern) ─────────────────────
  INSERT INTO projects (id, user_id, name, type, status, client, description, start_date, end_date) VALUES
  (p_ext1, v_user_id, 'E-Commerce Relaunch', 'external', 'active',  'MegaCorp',   'Neues Shop-Frontend V2',          today-30, today+180),
  (p_ext2, v_user_id, 'Banking App iOS',     'external', 'active',  'Bank24',     'Swift-Migration auf iOS 17',      today-10, today+90),
  (p_ext3, v_user_id, 'Cloud Migration',     'external', 'planned', 'GloboLog',   'AWS-Migration aller Dienste',     today+30, today+240),
  (p_ext4, v_user_id, 'Customer Portal',     'external', 'active',  'SwissInsul', 'React Redesign Kundenportal',     today-60, today+45),
  (p_ext5, v_user_id, 'Data Analytics BI',   'external', 'on_hold', 'DataVent',   'PowerBI Integration',             today-5,  today+120);

  INSERT INTO projects (id, user_id, name, type, status, description, start_date, end_date) VALUES
  (p_int1, v_user_id, 'Internal Admin App',      'internal', 'active',    'App-Entwicklung für interne Prozesse (Next.js)',    today-45, today+365),
  (p_int2, v_user_id, 'TeamRadar Refactoring',   'internal', 'active',    'Code-Qualität & Vite-Migration',                   today-14, today+60),
  (p_int3, v_user_id, 'Infrastructure Upgrade',  'internal', 'active',    'Server, CI/CD Pipeline & Docker Upgrade',           today-20, today+90),
  (p_int4, v_user_id, 'Internal Mobile Chat App','internal', 'planned',   'React Native Mitarbeiter-Messenger',               today+14, today+180),
  (p_int5, v_user_id, 'Design System V2',        'internal', 'active',    'UI/UX Designsystem & Storybook',                   today-30, today+45),
  (p_int6, v_user_id, 'Knowledge Base Wiki',     'internal', 'active',    'Self-Service Dokumentationsportal',                today-10, today+300),
  (p_int7, v_user_id, 'AI Assistant Bot',        'internal', 'active',    'Lokal gehostetes LLM für internen Support',        today-5,  today+180),
  (p_int8, v_user_id, 'Meeting Room Tool',       'internal', 'completed', 'Buchungstool für Meetingräume',                    today-120,today-5),
  (p_int9, v_user_id, 'Cyber Security Audit',    'internal', 'on_hold',   'Audit aller internen APIs & Zugänge',              today-15, today+15),
  (p_int10,v_user_id, 'Onboarding Portal',       'internal', 'active',    'Automatisiertes Onboarding für neue Mitarbeiter',  today-20, today+60);

  -- ── 4. TEAMS (5 Gruppen) ───────────────────────────────────
  INSERT INTO teams (user_id, name, description, member_ids) VALUES
  (v_user_id, 'Core Backend',    'APIs, Datenbanken & Architektur',           ARRAY[m1, m3, m5, m9]),
  (v_user_id, 'UI/UX Avengers',  'Frontend, Design & Mobile',                 ARRAY[m2, m6, m10, m12]),
  (v_user_id, 'Project Titans',  'Projektmanagement & Koordination',          ARRAY[m4, m7, m15]),
  (v_user_id, 'Quality Squad',   'Testing, QA & Code-Review',                 ARRAY[m8, m11, m13]),
  (v_user_id, 'General Support', 'Infrastruktur, HR, Marketing & Office',     ARRAY[m14, m16, m17, m18, m19, m20]);

  -- ── 5. VERFÜGBARKEITEN (Meetings, Urlaub, Krank) ───────────
  INSERT INTO availabilities (user_id, member_id, status, date, start_time, end_time, note) VALUES
  -- Meetings heute
  (v_user_id, m1,  'meeting',  today,     '09:00', '10:00', 'Daily Standup'),
  (v_user_id, m1,  'meeting',  today,     '14:00', '15:30', 'Sprint Review'),
  (v_user_id, m2,  'meeting',  today,     '11:00', '12:00', 'Design Sync'),
  (v_user_id, m3,  'meeting',  today,     '13:00', '14:00', 'Architecture Review'),
  (v_user_id, m4,  'meeting',  today,     '10:00', '11:30', 'Kundencall MegaCorp'),
  (v_user_id, m7,  'meeting',  today,     '15:00', '16:00', 'Product-Planung'),
  (v_user_id, m11, 'meeting',  today,     '09:00', '09:30', 'Team-Daily'),
  -- Abwesenheiten mit Allokations-Konflikt (löst Alerts aus)
  (v_user_id, m16, 'vacation', today,     NULL,    NULL,    'Jahresurlaub – Mallorca'),
  (v_user_id, m16, 'vacation', today+1,   NULL,    NULL,    'Jahresurlaub – Mallorca'),
  (v_user_id, m16, 'vacation', today+2,   NULL,    NULL,    'Jahresurlaub – Mallorca'),
  (v_user_id, m8,  'sick',     today,     NULL,    NULL,    'Krankmeldung'),
  (v_user_id, m8,  'sick',     today+1,   NULL,    NULL,    'Krankmeldung'),
  -- Remote
  (v_user_id, m5,  'remote',   today,     NULL,    NULL,    'Home Office'),
  (v_user_id, m9,  'remote',   today,     NULL,    NULL,    'Home Office'),
  -- Morgen – Meetings für Timeline-Füllung
  (v_user_id, m2,  'meeting',  today+1,   '10:00', '11:00', 'Client Feedback'),
  (v_user_id, m6,  'meeting',  today+1,   '14:00', '15:00', 'Code Review Session');

  -- ── 6. ALLOCATIONS ─────────────────────────────────────────
  -- m1–m5: STARK ÜBERLASTET (~150%)
  INSERT INTO allocations (user_id, member_id, project_id, percentage, start_date, end_date) VALUES
  -- m1: 50+50+50 = 150%
  (v_user_id, m1, p_ext1,  50, s, e),
  (v_user_id, m1, p_int1,  50, s, e),
  (v_user_id, m1, p_int2,  50, s, e),
  -- m2: 60+50+40 = 150%
  (v_user_id, m2, p_ext2,  60, s, e),
  (v_user_id, m2, p_int5,  50, s, e),
  (v_user_id, m2, p_int10, 40, s, e),
  -- m3: 50+60+40 = 150%
  (v_user_id, m3, p_ext1,  50, s, e),
  (v_user_id, m3, p_int3,  60, s, e),
  (v_user_id, m3, p_int7,  40, s, e),
  -- m4: 50+50+50 = 150%
  (v_user_id, m4, p_ext3,  50, s, e),
  (v_user_id, m4, p_ext4,  50, s, e),
  (v_user_id, m4, p_int10, 50, s, e),
  -- m5: 60+50+40 = 150%
  (v_user_id, m5, p_ext2,  60, s, e),
  (v_user_id, m5, p_int1,  50, s, e),
  (v_user_id, m5, p_int3,  40, s, e),

  -- m6–m10: LEICHT ÜBERLASTET (~120%)
  -- m6: 60+60 = 120%
  (v_user_id, m6, p_ext2,  60, s, e),
  (v_user_id, m6, p_int2,  60, s, e),
  -- m7: 70+50 = 120%
  (v_user_id, m7, p_ext4,  70, s, e),
  (v_user_id, m7, p_int10, 50, s, e),
  -- m8: 60+60 = 120% (auch krank – löst Vacation-Konflikt Alert aus!)
  (v_user_id, m8, p_int3,  60, s, e),
  (v_user_id, m8, p_int9,  60, s, e),
  -- m9: 60+60 = 120%
  (v_user_id, m9, p_int1,  60, s, e),
  (v_user_id, m9, p_int3,  60, s, e),
  -- m10: 70+50 = 120%
  (v_user_id, m10, p_ext2, 70, s, e),
  (v_user_id, m10, p_int4, 50, s, e),

  -- m11–m15: GENAU 100%
  -- m11: 50+50 = 100%
  (v_user_id, m11, p_ext1,  50, s, e),
  (v_user_id, m11, p_int2,  50, s, e),
  -- m12: 100%
  (v_user_id, m12, p_int5, 100, s, e),
  -- m13: 50+50 = 100%
  (v_user_id, m13, p_int2,  50, s, e),
  (v_user_id, m13, p_int6,  50, s, e),
  -- m14: 40+60 = 100%
  (v_user_id, m14, p_int7,  40, s, e),
  (v_user_id, m14, p_int9,  60, s, e),
  -- m15: 50+50 = 100%
  (v_user_id, m15, p_ext4,  50, s, e),
  (v_user_id, m15, p_int10, 50, s, e),

  -- m16–m20: UNTER 100% (löst "keine Zuweisung" Alert aus für m20)
  -- m16: 60% (auch im Urlaub – löst Vacation-Konflikt Alert aus!)
  (v_user_id, m16, p_int1,  60, s, e),
  -- m17: 40%
  (v_user_id, m17, p_int10, 40, s, e),
  -- m18: 30%
  (v_user_id, m18, p_ext1,  30, s, e),
  -- m19: 50%
  (v_user_id, m19, p_int2,  50, s, e);
  -- m20: 0% – kein Projekt → löst "Keine Zuweisung"-Alert aus!

  -- ── 7. PROJEKT-MITGLIEDER SYNCHRONISIEREN ──────────────────
  UPDATE projects SET member_ids = ARRAY[m1,m3,m5,m11,m18]     WHERE id = p_ext1;
  UPDATE projects SET member_ids = ARRAY[m2,m5,m6,m10]         WHERE id = p_ext2;
  UPDATE projects SET member_ids = ARRAY[m4]                   WHERE id = p_ext3;
  UPDATE projects SET member_ids = ARRAY[m4,m7,m15]            WHERE id = p_ext4;
  UPDATE projects SET member_ids = ARRAY[m1,m5,m9,m16]         WHERE id = p_int1;
  UPDATE projects SET member_ids = ARRAY[m1,m2,m6,m11,m13,m19] WHERE id = p_int2;
  UPDATE projects SET member_ids = ARRAY[m3,m5,m8,m9]          WHERE id = p_int3;
  UPDATE projects SET member_ids = ARRAY[m10]                  WHERE id = p_int4;
  UPDATE projects SET member_ids = ARRAY[m2,m12]               WHERE id = p_int5;
  UPDATE projects SET member_ids = ARRAY[m13]                  WHERE id = p_int6;
  UPDATE projects SET member_ids = ARRAY[m3,m14]               WHERE id = p_int7;
  UPDATE projects SET member_ids = ARRAY[m8,m14]               WHERE id = p_int9;
  UPDATE projects SET member_ids = ARRAY[m2,m4,m7,m15,m17]     WHERE id = p_int10;

END $$;
