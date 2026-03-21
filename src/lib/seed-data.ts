import type { Member, Availability, Team, Project, AvailabilityStatus, Allocation, Skill as SkillType } from '@/types';

const today = new Date().toISOString().slice(0, 10);

// Hilfsfunktion: Datum ±N Tage
function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const SEED_MEMBERS: Member[] = [
  { id: 'm01', name: 'Anna Schmidt',      email: 'anna.schmidt@firma.de',      role: 'Frontend-Entwicklerin',  department: 'Engineering',  phone: '+49 151 1001001', skills: [{ name: 'React', category: 'Frontend', level: 'expert' }, { name: 'TypeScript', category: 'Frontend', level: 'advanced' }, { name: 'CSS/Tailwind', category: 'Frontend', level: 'expert' }, { name: 'Next.js', category: 'Frontend', level: 'advanced' }], createdAt: '2025-01-10T08:00:00Z' },
  { id: 'm02', name: 'Ben Müller',        email: 'ben.mueller@firma.de',       role: 'Backend-Entwickler',     department: 'Engineering',  phone: '+49 151 1001002', skills: [{ name: 'Node.js', category: 'Backend', level: 'expert' }, { name: 'PostgreSQL', category: 'Backend', level: 'advanced' }, { name: 'Python', category: 'Backend', level: 'intermediate' }, { name: 'Docker', category: 'DevOps', level: 'intermediate' }], createdAt: '2025-01-12T08:00:00Z' },
  { id: 'm03', name: 'Clara Fischer',     email: 'clara.fischer@firma.de',     role: 'UX-Designerin',          department: 'Design',       phone: '+49 151 1001003', skills: [{ name: 'Figma', category: 'Design', level: 'expert' }, { name: 'UX Research', category: 'Design', level: 'advanced' }, { name: 'Prototyping', category: 'Design', level: 'expert' }, { name: 'CSS/Tailwind', category: 'Frontend', level: 'intermediate' }], createdAt: '2025-02-01T08:00:00Z' },
  { id: 'm04', name: 'David Weber',       email: 'david.weber@firma.de',       role: 'Projektmanager',         department: 'Management',   phone: '+49 151 1001004', skills: [{ name: 'Scrum', category: 'Management', level: 'expert' }, { name: 'JIRA', category: 'Management', level: 'advanced' }, { name: 'SAP', category: 'Sonstiges', level: 'intermediate' }], createdAt: '2025-02-05T08:00:00Z' },
  { id: 'm05', name: 'Elena Braun',       email: 'elena.braun@firma.de',       role: 'DevOps-Ingenieurin',     department: 'Engineering',  phone: '+49 151 1001005', skills: [{ name: 'AWS', category: 'Cloud', level: 'expert' }, { name: 'Terraform', category: 'DevOps', level: 'expert' }, { name: 'Kubernetes', category: 'DevOps', level: 'advanced' }, { name: 'Docker', category: 'DevOps', level: 'expert' }], createdAt: '2025-02-10T08:00:00Z' },
  { id: 'm06', name: 'Felix Hartmann',    email: 'felix.hartmann@firma.de',    role: 'QA-Engineer',            department: 'Engineering',  phone: '+49 151 1001006', skills: [{ name: 'Selenium', category: 'Sonstiges', level: 'expert' }, { name: 'Jest', category: 'Frontend', level: 'advanced' }, { name: 'Cypress', category: 'Frontend', level: 'advanced' }, { name: 'Security Testing', category: 'Security', level: 'intermediate' }], createdAt: '2025-03-01T08:00:00Z' },
  { id: 'm07', name: 'Gina Hoffmann',     email: 'gina.hoffmann@firma.de',     role: 'Scrum Master',           department: 'Management',   phone: '+49 151 1001007', skills: [{ name: 'Scrum', category: 'Management', level: 'expert' }, { name: 'Kanban', category: 'Management', level: 'advanced' }, { name: 'Confluence', category: 'Management', level: 'intermediate' }], createdAt: '2025-03-10T08:00:00Z' },
  { id: 'm08', name: 'Hakan Yilmaz',     email: 'hakan.yilmaz@firma.de',      role: 'Fullstack-Entwickler',   department: 'Engineering',  phone: '+49 151 1001008', skills: [{ name: 'React', category: 'Frontend', level: 'advanced' }, { name: 'Node.js', category: 'Backend', level: 'advanced' }, { name: 'TypeScript', category: 'Frontend', level: 'expert' }, { name: 'GraphQL', category: 'Backend', level: 'intermediate' }], createdAt: '2025-03-15T08:00:00Z' },
  { id: 'm09', name: 'Ines Krüger',      email: 'ines.krueger@firma.de',      role: 'UI-Designerin',          department: 'Design',       phone: '+49 151 1001009', skills: [{ name: 'Figma', category: 'Design', level: 'expert' }, { name: 'Adobe XD', category: 'Design', level: 'advanced' }, { name: 'Illustration', category: 'Design', level: 'advanced' }], createdAt: '2025-04-01T08:00:00Z' },
  { id: 'm10', name: 'Jan Becker',        email: 'jan.becker@firma.de',        role: 'Data Engineer',          department: 'Data',         phone: '+49 151 1001010', skills: [{ name: 'Python', category: 'Backend', level: 'expert' }, { name: 'SQL', category: 'Data', level: 'expert' }, { name: 'Spark', category: 'Data', level: 'advanced' }, { name: 'AWS', category: 'Cloud', level: 'intermediate' }], createdAt: '2025-04-10T08:00:00Z' },
  { id: 'm11', name: 'Katrin Wolf',       email: 'katrin.wolf@firma.de',       role: 'Product Ownerin',        department: 'Management',   phone: '+49 151 1001011', skills: [{ name: 'Scrum', category: 'Management', level: 'advanced' }, { name: 'JIRA', category: 'Management', level: 'expert' }, { name: 'Analytics', category: 'Data', level: 'intermediate' }], createdAt: '2025-05-01T08:00:00Z' },
  { id: 'm12', name: 'Lukas Schäfer',     email: 'lukas.schaefer@firma.de',    role: 'iOS-Entwickler',         department: 'Mobile',       phone: '+49 151 1001012', skills: [{ name: 'Swift', category: 'Mobile', level: 'expert' }, { name: 'SwiftUI', category: 'Mobile', level: 'advanced' }, { name: 'Xcode', category: 'Mobile', level: 'expert' }], createdAt: '2025-05-15T08:00:00Z' },
  { id: 'm13', name: 'Mara Neumann',      email: 'mara.neumann@firma.de',      role: 'Android-Entwicklerin',   department: 'Mobile',       phone: '+49 151 1001013', skills: [{ name: 'Kotlin', category: 'Mobile', level: 'expert' }, { name: 'Jetpack Compose', category: 'Mobile', level: 'advanced' }, { name: 'Firebase', category: 'Cloud', level: 'intermediate' }], createdAt: '2025-06-01T08:00:00Z' },
  { id: 'm14', name: 'Nico Zimmermann',   email: 'nico.zimmermann@firma.de',   role: 'Security Engineer',      department: 'Engineering',  phone: '+49 151 1001014', skills: [{ name: 'Penetration Testing', category: 'Security', level: 'expert' }, { name: 'OWASP', category: 'Security', level: 'expert' }, { name: 'AWS', category: 'Cloud', level: 'advanced' }, { name: 'Docker', category: 'DevOps', level: 'intermediate' }], createdAt: '2025-06-10T08:00:00Z' },
  { id: 'm15', name: 'Olivia Richter',    email: 'olivia.richter@firma.de',    role: 'Technical Writer',       department: 'Design',       phone: '+49 151 1001015', skills: [{ name: 'Confluence', category: 'Management', level: 'expert' }, { name: 'Markdown', category: 'Sonstiges', level: 'expert' }, { name: 'API-Dokumentation', category: 'Backend', level: 'advanced' }], createdAt: '2025-07-01T08:00:00Z' },
  { id: 'm16', name: 'Paul Lehmann',      email: 'paul.lehmann@firma.de',      role: 'Cloud Architect',        department: 'Engineering',  phone: '+49 151 1001016', skills: [{ name: 'Azure', category: 'Cloud', level: 'expert' }, { name: 'AWS', category: 'Cloud', level: 'advanced' }, { name: 'Kubernetes', category: 'DevOps', level: 'expert' }, { name: 'Terraform', category: 'DevOps', level: 'advanced' }], createdAt: '2025-07-15T08:00:00Z' },
  { id: 'm17', name: 'Rania El-Amin',     email: 'rania.elamin@firma.de',      role: 'HR-Managerin',           department: 'HR',           phone: '+49 151 1001017', skills: [{ name: 'SAP HR', category: 'Sonstiges', level: 'advanced' }, { name: 'Recruiting', category: 'Management', level: 'expert' }], createdAt: '2025-08-01T08:00:00Z' },
  { id: 'm18', name: 'Stefan Klein',      email: 'stefan.klein@firma.de',      role: 'Teamleiter Engineering', department: 'Engineering',  phone: '+49 151 1001018', skills: [{ name: 'Java', category: 'Backend', level: 'expert' }, { name: 'Architecture', category: 'Backend', level: 'expert' }, { name: 'Scrum', category: 'Management', level: 'advanced' }, { name: 'AWS', category: 'Cloud', level: 'intermediate' }], createdAt: '2025-08-10T08:00:00Z' },
  { id: 'm19', name: 'Tanja Vogel',       email: 'tanja.vogel@firma.de',       role: 'Marketing-Managerin',    department: 'Marketing',    phone: '+49 151 1001019', skills: [{ name: 'Google Analytics', category: 'Data', level: 'advanced' }, { name: 'SEO', category: 'Sonstiges', level: 'expert' }], createdAt: '2025-09-01T08:00:00Z' },
  { id: 'm20', name: 'Urs Meier',         email: 'urs.meier@firma.de',         role: 'CTO',                    department: 'Management',   phone: '+49 151 1001020', skills: [{ name: 'Architecture', category: 'Backend', level: 'expert' }, { name: 'AWS', category: 'Cloud', level: 'expert' }, { name: 'Strategy', category: 'Management', level: 'expert' }], createdAt: '2025-01-05T08:00:00Z' },
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

export const SEED_PROJECTS: Project[] = [
  { id: 'p01', name: 'Cloud-Migration Allianz',        type: 'external', status: 'active',    client: 'Allianz SE',           description: 'Migration der Legacy-Systeme in die Azure Cloud',           memberIds: ['m02', 'm05', 'm16', 'm14'], startDate: '2026-01-15', endDate: '2026-06-30', createdAt: '2026-01-10T08:00:00Z' },
  { id: 'p02', name: 'Interne Toolchain-Modernisierung', type: 'internal', status: 'active',                                    description: 'Upgrade der internen CI/CD-Pipeline und Dev-Tools',         memberIds: ['m01', 'm08', 'm06'],         startDate: '2026-02-01', endDate: '2026-04-30', createdAt: '2026-01-20T08:00:00Z' },
  { id: 'p03', name: 'BMW Connected Drive Portal',       type: 'external', status: 'active',    client: 'BMW AG',               description: 'Neuentwicklung des Kundenportals',                          memberIds: ['m01', 'm03', 'm09', 'm04'], startDate: '2026-02-10', endDate: '2026-08-31', createdAt: '2026-02-05T08:00:00Z' },
  { id: 'p04', name: 'Mitarbeiter-App',                  type: 'internal', status: 'active',                                    description: 'Mobile App für Zeiterfassung und Verfügbarkeit',            memberIds: ['m12', 'm13', 'm03'],         startDate: '2026-03-01', endDate: '2026-05-31', createdAt: '2026-02-20T08:00:00Z' },
  { id: 'p05', name: 'Siemens Data Analytics',            type: 'external', status: 'planned',   client: 'Siemens AG',           description: 'Aufbau einer Data-Analytics-Plattform',                     memberIds: ['m10', 'm02'],                startDate: '2026-04-01', endDate: '2026-09-30', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'p06', name: 'Security Audit 2026',               type: 'internal', status: 'planned',                                    description: 'Jährlicher Sicherheits-Audit aller Systeme',                memberIds: ['m14', 'm06'],                startDate: '2026-04-15', endDate: '2026-05-15', createdAt: '2026-03-10T08:00:00Z' },
  { id: 'p07', name: 'Deutsche Bahn Ticketing-System',    type: 'external', status: 'active',    client: 'Deutsche Bahn AG',     description: 'Redesign des Online-Ticketing mit React & Microservices',   memberIds: ['m08', 'm02', 'm07', 'm11'], startDate: '2025-11-01', endDate: '2026-05-31', createdAt: '2025-10-15T08:00:00Z' },
  { id: 'p08', name: 'Onboarding-Prozess Optimierung',    type: 'internal', status: 'completed',                                  description: 'Verbesserung des Onboarding für neue Berater',              memberIds: ['m17', 'm04'],                startDate: '2025-12-01', endDate: '2026-02-28', createdAt: '2025-11-20T08:00:00Z' },
];

export const SEED_TEAMS: Team[] = [
  { id: 't01', name: 'Frontend-Team',       description: 'Web-Entwicklung & UI',          memberIds: ['m01', 'm08', 'm03', 'm09'] },
  { id: 't02', name: 'Backend-Team',        description: 'API, Services & Infrastruktur', memberIds: ['m02', 'm05', 'm14', 'm16'] },
  { id: 't03', name: 'Mobile-Team',         description: 'iOS & Android',                 memberIds: ['m12', 'm13'] },
  { id: 't04', name: 'Management',          description: 'Projektleitung & Produkt',      memberIds: ['m04', 'm07', 'm11', 'm20'] },
  { id: 't05', name: 'Design',              description: 'UX, UI & Dokumentation',        memberIds: ['m03', 'm09', 'm15'] },
  { id: 't06', name: 'QA & Security',       description: 'Qualität & Sicherheit',         memberIds: ['m06', 'm14'] },
];

/* ── Allocations (Projekt-Zuweisungen mit %) ─────────────── */
export const SEED_ALLOCATIONS: Allocation[] = [
  // Cloud-Migration Allianz (p01): Ben 60%, Elena 80%, Paul 100%, Nico 40%
  { id: 'al01', memberId: 'm02', projectId: 'p01', percentage: 60,  startDate: '2026-01-15', endDate: '2026-06-30' },
  { id: 'al02', memberId: 'm05', projectId: 'p01', percentage: 80,  startDate: '2026-01-15', endDate: '2026-06-30' },
  { id: 'al03', memberId: 'm16', projectId: 'p01', percentage: 100, startDate: '2026-01-15', endDate: '2026-06-30' },
  { id: 'al04', memberId: 'm14', projectId: 'p01', percentage: 40,  startDate: '2026-01-15', endDate: '2026-06-30' },
  // Interne Toolchain (p02): Anna 50%, Hakan 60%, Felix 40%
  { id: 'al05', memberId: 'm01', projectId: 'p02', percentage: 50,  startDate: '2026-02-01', endDate: '2026-04-30' },
  { id: 'al06', memberId: 'm08', projectId: 'p02', percentage: 60,  startDate: '2026-02-01', endDate: '2026-04-30' },
  { id: 'al07', memberId: 'm06', projectId: 'p02', percentage: 40,  startDate: '2026-02-01', endDate: '2026-04-30' },
  // BMW Connected Drive (p03): Anna 60%, Clara 80%, Ines 50%, David 30%
  { id: 'al08', memberId: 'm01', projectId: 'p03', percentage: 60,  startDate: '2026-02-10', endDate: '2026-08-31' },
  { id: 'al09', memberId: 'm03', projectId: 'p03', percentage: 80,  startDate: '2026-02-10', endDate: '2026-08-31' },
  { id: 'al10', memberId: 'm09', projectId: 'p03', percentage: 50,  startDate: '2026-02-10', endDate: '2026-08-31' },
  { id: 'al11', memberId: 'm04', projectId: 'p03', percentage: 30,  startDate: '2026-02-10', endDate: '2026-08-31' },
  // Mitarbeiter-App (p04): Lukas 80%, Mara 80%, Clara 30%
  { id: 'al12', memberId: 'm12', projectId: 'p04', percentage: 80,  startDate: '2026-03-01', endDate: '2026-05-31' },
  { id: 'al13', memberId: 'm13', projectId: 'p04', percentage: 80,  startDate: '2026-03-01', endDate: '2026-05-31' },
  { id: 'al14', memberId: 'm03', projectId: 'p04', percentage: 30,  startDate: '2026-03-01', endDate: '2026-05-31', note: 'UX-Beratung' },
  // Siemens Data Analytics (p05): Jan 70%, Ben 40%
  { id: 'al15', memberId: 'm10', projectId: 'p05', percentage: 70,  startDate: '2026-04-01', endDate: '2026-09-30' },
  { id: 'al16', memberId: 'm02', projectId: 'p05', percentage: 40,  startDate: '2026-04-01', endDate: '2026-09-30' },
  // Security Audit (p06): Nico 60%, Felix 50%
  { id: 'al17', memberId: 'm14', projectId: 'p06', percentage: 60,  startDate: '2026-04-15', endDate: '2026-05-15' },
  { id: 'al18', memberId: 'm06', projectId: 'p06', percentage: 50,  startDate: '2026-04-15', endDate: '2026-05-15' },
  // DB Ticketing (p07): Hakan 50%, Ben 30%, Gina 40%, Katrin 30%
  { id: 'al19', memberId: 'm08', projectId: 'p07', percentage: 50,  startDate: '2025-11-01', endDate: '2026-05-31' },
  { id: 'al20', memberId: 'm02', projectId: 'p07', percentage: 30,  startDate: '2025-11-01', endDate: '2026-05-31' },
  { id: 'al21', memberId: 'm07', projectId: 'p07', percentage: 40,  startDate: '2025-11-01', endDate: '2026-05-31' },
  { id: 'al22', memberId: 'm11', projectId: 'p07', percentage: 30,  startDate: '2025-11-01', endDate: '2026-05-31' },
];
