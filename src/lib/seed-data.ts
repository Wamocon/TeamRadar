import type { Member, Availability, Team, AvailabilityStatus } from '@/types';

const today = new Date().toISOString().slice(0, 10);

// Hilfsfunktion: Datum ±N Tage
function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const SEED_MEMBERS: Member[] = [
  { id: 'm01', name: 'Anna Schmidt',      email: 'anna.schmidt@firma.de',      role: 'Frontend-Entwicklerin',  department: 'Engineering',  phone: '+49 151 1001001', createdAt: '2025-01-10T08:00:00Z' },
  { id: 'm02', name: 'Ben Müller',        email: 'ben.mueller@firma.de',       role: 'Backend-Entwickler',     department: 'Engineering',  phone: '+49 151 1001002', createdAt: '2025-01-12T08:00:00Z' },
  { id: 'm03', name: 'Clara Fischer',     email: 'clara.fischer@firma.de',     role: 'UX-Designerin',          department: 'Design',       phone: '+49 151 1001003', createdAt: '2025-02-01T08:00:00Z' },
  { id: 'm04', name: 'David Weber',       email: 'david.weber@firma.de',       role: 'Projektmanager',         department: 'Management',   phone: '+49 151 1001004', createdAt: '2025-02-05T08:00:00Z' },
  { id: 'm05', name: 'Elena Braun',       email: 'elena.braun@firma.de',       role: 'DevOps-Ingenieurin',     department: 'Engineering',  phone: '+49 151 1001005', createdAt: '2025-02-10T08:00:00Z' },
  { id: 'm06', name: 'Felix Hartmann',    email: 'felix.hartmann@firma.de',    role: 'QA-Engineer',            department: 'Engineering',  phone: '+49 151 1001006', createdAt: '2025-03-01T08:00:00Z' },
  { id: 'm07', name: 'Gina Hoffmann',     email: 'gina.hoffmann@firma.de',     role: 'Scrum Master',           department: 'Management',   phone: '+49 151 1001007', createdAt: '2025-03-10T08:00:00Z' },
  { id: 'm08', name: 'Hakan Yilmaz',     email: 'hakan.yilmaz@firma.de',      role: 'Fullstack-Entwickler',   department: 'Engineering',  phone: '+49 151 1001008', createdAt: '2025-03-15T08:00:00Z' },
  { id: 'm09', name: 'Ines Krüger',      email: 'ines.krueger@firma.de',      role: 'UI-Designerin',          department: 'Design',       phone: '+49 151 1001009', createdAt: '2025-04-01T08:00:00Z' },
  { id: 'm10', name: 'Jan Becker',        email: 'jan.becker@firma.de',        role: 'Data Engineer',          department: 'Data',         phone: '+49 151 1001010', createdAt: '2025-04-10T08:00:00Z' },
  { id: 'm11', name: 'Katrin Wolf',       email: 'katrin.wolf@firma.de',       role: 'Product Ownerin',        department: 'Management',   phone: '+49 151 1001011', createdAt: '2025-05-01T08:00:00Z' },
  { id: 'm12', name: 'Lukas Schäfer',     email: 'lukas.schaefer@firma.de',    role: 'iOS-Entwickler',         department: 'Mobile',       phone: '+49 151 1001012', createdAt: '2025-05-15T08:00:00Z' },
  { id: 'm13', name: 'Mara Neumann',      email: 'mara.neumann@firma.de',      role: 'Android-Entwicklerin',   department: 'Mobile',       phone: '+49 151 1001013', createdAt: '2025-06-01T08:00:00Z' },
  { id: 'm14', name: 'Nico Zimmermann',   email: 'nico.zimmermann@firma.de',   role: 'Security Engineer',      department: 'Engineering',  phone: '+49 151 1001014', createdAt: '2025-06-10T08:00:00Z' },
  { id: 'm15', name: 'Olivia Richter',    email: 'olivia.richter@firma.de',    role: 'Technical Writer',       department: 'Design',       phone: '+49 151 1001015', createdAt: '2025-07-01T08:00:00Z' },
  { id: 'm16', name: 'Paul Lehmann',      email: 'paul.lehmann@firma.de',      role: 'Cloud Architect',        department: 'Engineering',  phone: '+49 151 1001016', createdAt: '2025-07-15T08:00:00Z' },
  { id: 'm17', name: 'Rania El-Amin',     email: 'rania.elamin@firma.de',      role: 'HR-Managerin',           department: 'HR',           phone: '+49 151 1001017', createdAt: '2025-08-01T08:00:00Z' },
  { id: 'm18', name: 'Stefan Klein',      email: 'stefan.klein@firma.de',      role: 'Teamleiter Engineering', department: 'Engineering',  phone: '+49 151 1001018', createdAt: '2025-08-10T08:00:00Z' },
  { id: 'm19', name: 'Tanja Vogel',       email: 'tanja.vogel@firma.de',       role: 'Marketing-Managerin',    department: 'Marketing',    phone: '+49 151 1001019', createdAt: '2025-09-01T08:00:00Z' },
  { id: 'm20', name: 'Urs Meier',         email: 'urs.meier@firma.de',         role: 'CTO',                    department: 'Management',   phone: '+49 151 1001020', createdAt: '2025-01-05T08:00:00Z' },
];

export const SEED_AVAILABILITIES: Availability[] = [
  // ── Heute ──────────────────────────────────────────
  { id: 'a01', memberId: 'm01', status: 'available',  date: today, startTime: '09:00', endTime: '17:00' },
  { id: 'a02', memberId: 'm02', status: 'remote',     date: today, startTime: '08:00', endTime: '16:00', note: 'Home-Office' },
  { id: 'a03', memberId: 'm03', status: 'meeting',    date: today, startTime: '10:00', endTime: '12:00', note: 'Design-Review Sprint 14' },
  { id: 'a04', memberId: 'm04', status: 'busy',       date: today, startTime: '09:00', endTime: '18:00', note: 'Sprint Planning' },
  { id: 'a05', memberId: 'm05', status: 'vacation',   date: today, note: 'Urlaub bis 28.03.' },
  { id: 'a06', memberId: 'm06', status: 'available',  date: today, startTime: '09:00', endTime: '17:00' },
  { id: 'a07', memberId: 'm07', status: 'meeting',    date: today, startTime: '09:00', endTime: '10:30', note: 'Daily & Retro' },
  { id: 'a08', memberId: 'm08', status: 'available',  date: today, startTime: '10:00', endTime: '18:00' },
  { id: 'a09', memberId: 'm09', status: 'sick',       date: today, note: 'Erkältet' },
  { id: 'a10', memberId: 'm10', status: 'remote',     date: today, startTime: '08:30', endTime: '16:30', note: 'Remote aus München' },
  { id: 'a11', memberId: 'm11', status: 'busy',       date: today, startTime: '09:00', endTime: '17:00', note: 'Stakeholder-Meetings' },
  { id: 'a12', memberId: 'm12', status: 'available',  date: today, startTime: '09:00', endTime: '17:00' },
  { id: 'a13', memberId: 'm13', status: 'remote',     date: today, startTime: '09:00', endTime: '17:00', note: 'Home-Office' },
  { id: 'a14', memberId: 'm14', status: 'available',  date: today, startTime: '08:00', endTime: '16:00' },
  { id: 'a15', memberId: 'm15', status: 'meeting',    date: today, startTime: '14:00', endTime: '16:00', note: 'Doku-Review' },
  { id: 'a16', memberId: 'm16', status: 'busy',       date: today, startTime: '09:00', endTime: '18:00', note: 'Cloud-Migration' },
  { id: 'a17', memberId: 'm17', status: 'available',  date: today, startTime: '09:00', endTime: '17:00' },
  { id: 'a18', memberId: 'm18', status: 'meeting',    date: today, startTime: '09:00', endTime: '12:00', note: 'Architektur-Review' },
  { id: 'a19', memberId: 'm19', status: 'vacation',   date: today, note: 'Urlaub bis 24.03.' },
  { id: 'a20', memberId: 'm20', status: 'busy',       date: today, startTime: '08:00', endTime: '19:00', note: 'Board-Meeting & Strategie' },

  // ── Morgen ─────────────────────────────────────────
  { id: 'a21', memberId: 'm01', status: 'available',  date: offsetDate(1), startTime: '09:00', endTime: '17:00' },
  { id: 'a22', memberId: 'm02', status: 'available',  date: offsetDate(1), startTime: '09:00', endTime: '17:00' },
  { id: 'a23', memberId: 'm03', status: 'available',  date: offsetDate(1), startTime: '09:00', endTime: '17:00' },
  { id: 'a24', memberId: 'm04', status: 'meeting',    date: offsetDate(1), startTime: '10:00', endTime: '15:00', note: 'Sprint Review' },
  { id: 'a25', memberId: 'm05', status: 'vacation',   date: offsetDate(1), note: 'Urlaub' },
  { id: 'a26', memberId: 'm06', status: 'remote',     date: offsetDate(1), startTime: '09:00', endTime: '17:00' },
  { id: 'a27', memberId: 'm09', status: 'sick',       date: offsetDate(1), note: 'Erkältet' },
  { id: 'a28', memberId: 'm19', status: 'vacation',   date: offsetDate(1), note: 'Urlaub' },

  // ── Übermorgen ─────────────────────────────────────
  { id: 'a29', memberId: 'm05', status: 'vacation',   date: offsetDate(2), note: 'Urlaub' },
  { id: 'a30', memberId: 'm08', status: 'remote',     date: offsetDate(2), startTime: '10:00', endTime: '18:00' },
  { id: 'a31', memberId: 'm09', status: 'sick',       date: offsetDate(2), note: 'Erkältet' },
  { id: 'a32', memberId: 'm12', status: 'meeting',    date: offsetDate(2), startTime: '09:00', endTime: '11:00', note: 'iOS Release Review' },
  { id: 'a33', memberId: 'm19', status: 'vacation',   date: offsetDate(2), note: 'Urlaub' },
];

export const SEED_TEAMS: Team[] = [
  { id: 't01', name: 'Frontend-Team',       description: 'Web-Entwicklung & UI',          memberIds: ['m01', 'm08', 'm03', 'm09'] },
  { id: 't02', name: 'Backend-Team',        description: 'API, Services & Infrastruktur', memberIds: ['m02', 'm05', 'm14', 'm16'] },
  { id: 't03', name: 'Mobile-Team',         description: 'iOS & Android',                 memberIds: ['m12', 'm13'] },
  { id: 't04', name: 'Management',          description: 'Projektleitung & Produkt',      memberIds: ['m04', 'm07', 'm11', 'm20'] },
  { id: 't05', name: 'Design',              description: 'UX, UI & Dokumentation',        memberIds: ['m03', 'm09', 'm15'] },
  { id: 't06', name: 'QA & Security',       description: 'Qualität & Sicherheit',         memberIds: ['m06', 'm14'] },
];
