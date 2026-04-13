#!/usr/bin/env node
/**
 * Secrets-Scanner – Pre-Commit Hook
 *
 * Scannt alle staged (git add) Dateien auf Secrets, API-Keys, Passwörter
 * und kritische Konfigurationsdaten bevor ein Commit gespeichert wird.
 *
 * Wird automatisch via scripts/install-hooks.js als pre-commit Hook installiert.
 * Kann auch manuell ausgeführt werden: node scripts/secrets-scan.mjs
 */

import { execSync } from 'child_process';

// ── Konfiguration ────────────────────────────────────────────

/**
 * Regeln: Jede Regel hat einen Namen (für den Fehlerbericht),
 * einen Regex-Pattern der auf Dateiinhalte gematcht wird,
 * und optional eine Entropy-Schwelle.
 */
const SECRET_PATTERNS = [
  // Supabase-spezifisch
  {
    name: 'Supabase Service Role Key (JWT)',
    // service_role JWTs enthalten immer "service_role" im Payload
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/,
  },
  {
    name: 'Supabase Anon Key (JWT)',
    // anon JWTs enthalten "anon" im Payload-Segment
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]*"role":"anon"[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/,
  },
  {
    name: 'JWT Token (generisch)',
    // Alle JWTs: drei Base64url-Segmente durch Punkte getrennt, >100 Zeichen
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },

  // Private Keys / Zertifikate
  {
    name: 'PEM Private Key',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'PEM Certificate',
    pattern: /-----BEGIN CERTIFICATE-----/,
  },

  // Cloud-Provider Keys
  {
    name: 'AWS Access Key ID',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'AWS Secret Access Key',
    pattern: /aws[_\-\s]?secret[_\-\s]?access[_\-\s]?key\s*[=:]\s*["']?[A-Za-z0-9/+]{40}/i,
  },
  {
    name: 'Google API Key',
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/,
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  },
  {
    name: 'Stripe Secret Key',
    pattern: /\bsk_(live|test)_[0-9a-zA-Z]{24,}\b/,
  },

  // Generische Secret-Zuweisung in Code/Config
  {
    name: 'Hardcodiertes Passwort (Zuweisung)',
    // password = "xyz" oder password: 'xyz' — ignoriert leere Strings und Platzhalter
    pattern: /\b(password|passwd|passwort|secret|api[_-]?key|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[=:]\s*["'][^"']{8,}/i,
    // Ausnahmen werden weiter unten per allowlist gefiltert
  },
  {
    name: 'Service Role Key Variable',
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ/,
  },
  {
    name: 'Seed User ID Variable (UUID mit echtem Wert)',
    pattern: /SEED_USER_ID\s*=\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  },
];

/**
 * Dateimuster die NIEMALS committed werden dürfen,
 * unabhängig von ihrem Inhalt.
 */
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.\w+\.local$/,
  /^\.env\.development$/,
  /^\.env\.production$/,
  /^\.env\.staging$/,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /id_rsa$/,
  /id_dsa$/,
  /id_ecdsa$/,
  /id_ed25519$/,
];

/**
 * Erlaubte Ausnahmen: Zeilen die trotz Pattern-Match OK sind.
 * Wird per substring-check auf der Zeile geprüft.
 */
const ALLOWLIST_SUBSTRINGS = [
  // Platzhalter in .env.example
  'dein-',
  'your-',
  'DEIN-',
  'YOUR-',
  'deine-',
  'placeholder',
  'PLACEHOLDER',
  '<',
  // Kommentare
  '# ',
  '//',
  // Testvariablen
  'process.env.',
  'process.env[',
  // Leerwerte
  "= ''",
  '= ""',
  "= `",
  // Test-Fixture-Strings
  'test-key',
  'mock-key',
  'example.com',
  // TypeScript-Typdefinitionen
  ': string',
  ': string |',
  // Regex-Pattern-Definitionen (z.B. in diesem Scanner-Skript selbst)
  'pattern: /',
  'pattern:/',
];

// ── Hilfsfunktionen ──────────────────────────────────────────

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getStagedContent(filePath) {
  try {
    return execSync(`git show :${filePath}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10 MB Limit
    });
  } catch {
    return '';
  }
}

function isLineAllowed(line) {
  return ALLOWLIST_SUBSTRINGS.some((substr) => line.includes(substr));
}

function isBinaryContent(content) {
  // Heuristik: enthält Null-Bytes → Binärdatei
  return content.includes('\0');
}

// ── Scan-Logik ───────────────────────────────────────────────

const findings = [];

const stagedFiles = getStagedFiles();

// Den Scanner selbst nie scannen (er enthält Pattern-Strings die Secrets ähneln)
const SELF = 'scripts/secrets-scan.mjs';

for (const filePath of stagedFiles) {
  if (filePath === SELF || filePath.endsWith('/' + SELF.split('/').pop())) continue;
  const fileName = filePath.split('/').pop();

  // 1. Verbotene Dateitypen
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(filePath)) {
      findings.push({
        file: filePath,
        line: null,
        rule: `Verbotene Datei: ${fileName}`,
        content: null,
      });
      break; // Nur einmal pro Datei melden
    }
  }

  // 2. Inhalts-Scan (nur Textdateien)
  const content = getStagedContent(filePath);
  if (!content || isBinaryContent(content)) continue;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isLineAllowed(line)) continue;

    for (const rule of SECRET_PATTERNS) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: filePath,
          line: i + 1,
          rule: rule.name,
          // Zeige nur die ersten 80 Zeichen, Rest wird maskiert
          content: line.trim().slice(0, 80) + (line.trim().length > 80 ? '…' : ''),
        });
        break; // Nur erste Regel pro Zeile melden
      }
    }
  }
}

// ── Ausgabe & Exit ───────────────────────────────────────────

if (findings.length === 0) {
  console.log('✓ Secrets-Scanner: Keine kritischen Daten gefunden.');
  process.exit(0);
}

console.error('\n🚨 COMMIT ABGEBROCHEN – Potenzielle Secrets gefunden!\n');
console.error('Die folgenden Probleme müssen behoben werden:\n');

for (const finding of findings) {
  if (finding.line !== null) {
    console.error(`  📄 ${finding.file}:${finding.line}`);
  } else {
    console.error(`  📄 ${finding.file}`);
  }
  console.error(`     Regel: ${finding.rule}`);
  if (finding.content) {
    console.error(`     Inhalt: ${finding.content}`);
  }
  console.error('');
}

console.error('Mögliche Lösungen:');
console.error('  • Datei aus dem Staging nehmen:  git reset HEAD <datei>');
console.error('  • Secret aus der Datei entfernen und durch Env-Variable ersetzen');
console.error('  • .env.example nutzen (Platzhalter statt echter Werte)');
console.error('  • Wenn es ein False-Positive ist: git commit --no-verify (NUR in Ausnahmefällen!)\n');

process.exit(1);
