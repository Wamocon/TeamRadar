/**
 * Installiert Git-Hooks automatisch nach npm install (prepare-Script)
 * Idempotent — überschreibt nur wenn nötig
 *
 * Installierte Hooks:
 *  - pre-commit  → Secrets-Scanner (blockiert Commits mit Passwörtern/Keys)
 *  - pre-push    → Lint + TypeCheck + Tests
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
} catch {
  // Kein Git-Repo — nichts tun (z. B. CI ohne .git)
  process.exit(0);
}

const hooksDir = path.join(__dirname, '..', '.git', 'hooks');
fs.mkdirSync(hooksDir, { recursive: true });

// ── pre-commit: Secrets-Scanner ─────────────────────────────
const preCommit = path.join(hooksDir, 'pre-commit');
const preCommitHook = `#!/bin/sh
# Automatisch installierter Pre-Commit Hook
# Scannt staged Dateien auf Secrets, Passwörter und kritische Daten.
node "$(git rev-parse --show-toplevel)/scripts/secrets-scan.mjs"
`;
fs.writeFileSync(preCommit, preCommitHook);
fs.chmodSync(preCommit, 0o755);
console.log('✓ Git pre-commit Hook (Secrets-Scanner) installiert');

// ── pre-push: Validierung ────────────────────────────────────
const prePush = path.join(hooksDir, 'pre-push');
const prePushHook = `#!/bin/sh
# Automatisch installierter Pre-Push Hook
# Führt Lint, TypeCheck und Tests vor jedem Push aus
echo "\\n🔍 Pre-Push Validierung läuft...\\n"
npm run validate
`;
fs.writeFileSync(prePush, prePushHook);
fs.chmodSync(prePush, 0o755);
console.log('✓ Git pre-push Hook installiert');
