/**
 * Installiert Git-Hooks automatisch nach npm install (prepare-Script)
 * Idempotent — überschreibt nur wenn nötig
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

const prePush = path.join(hooksDir, 'pre-push');
const hook = `#!/bin/sh
# Automatisch installierter Pre-Push Hook
# Führt Lint, Typecheck und Tests vor jedem Push aus
echo "\\n🔍 Pre-Push Validierung läuft...\\n"
npm run validate
`;

fs.writeFileSync(prePush, hook);
fs.chmodSync(prePush, 0o755);
console.log('✓ Git pre-push Hook installiert');
