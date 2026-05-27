/**
 * Visueller Kontrast – Validierungstests
 * Prüft, dass die CSS-Designtokens in globals.css die Mindestanforderungen
 * für sichtbare Elementtrennung erfüllen (WCAG-inspiriert, interne Standards).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const globalsCss = fs.readFileSync(
  path.resolve(__dirname, '../app/globals.css'),
  'utf-8',
);

/** Extrahiert den Inhalt eines CSS-Blocks anhand eines Start-Selektors */
function extractBlock(selector: string): string {
  const idx = globalsCss.indexOf(selector);
  if (idx === -1) return '';
  const start = globalsCss.indexOf('{', idx);
  if (start === -1) return '';
  let depth = 0;
  let end = start;
  for (let i = start; i < globalsCss.length; i++) {
    if (globalsCss[i] === '{') depth++;
    else if (globalsCss[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  return globalsCss.slice(start + 1, end);
}

const darkBlock  = extractBlock(':root');
const lightBlock = extractBlock('html:not(.dark)');

/** Extrahiert den rgba-Alpha-Wert einer CSS-Variable aus einem Block */
function extractOpacity(varName: string, block: string): number | null {
  const pattern = new RegExp(
    varName.replace('--', '--') +
    ':\\s*rgba\\([^,]+,[^,]+,[^,]+,\\s*([0-9.]+)\\)',
  );
  const match = block.match(pattern);
  return match ? parseFloat(match[1]) : null;
}

/** Extrahiert eine Hex-Farbe für eine CSS-Variable aus einem Block */
function extractHex(varName: string, block: string): string | null {
  const pattern = new RegExp(varName + ':\\s*(#[0-9a-fA-F]{3,8})');
  const match = block.match(pattern);
  return match ? match[1] : null;
}

describe('CSS Kontrast-Tokens: Dunkelmodus', () => {
  it('--border Opazität ≥ 0.10 (sichtbare Trennlinie)', () => {
    const opacity = extractOpacity('--border', darkBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.10);
  });

  it('--glass-border Opazität ≥ 0.08', () => {
    const opacity = extractOpacity('--glass-border', darkBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.08);
  });

  it('--sidebar-border Opazität ≥ 0.08', () => {
    const opacity = extractOpacity('--sidebar-border', darkBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.08);
  });

  it('--glass Opazität ≥ 0.50 (Karten klar von Hintergrund trennbar)', () => {
    const opacity = extractOpacity('--glass', darkBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.50);
  });
});

describe('CSS Kontrast-Tokens: Hellmodus', () => {
  it('--border Opazität ≥ 0.08 (sichtbare Trennlinie)', () => {
    const opacity = extractOpacity('--border', lightBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.08);
  });

  it('--glass-border Opazität ≥ 0.08', () => {
    const opacity = extractOpacity('--glass-border', lightBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.08);
  });

  it('--sidebar-border Opazität ≥ 0.08', () => {
    const opacity = extractOpacity('--sidebar-border', lightBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.08);
  });

  it('--glass ist nahezu opak (≥ 0.90) für klare Kartentrennung im Hellmodus', () => {
    const opacity = extractOpacity('--glass', lightBlock);
    expect(opacity).not.toBeNull();
    expect(opacity!).toBeGreaterThanOrEqual(0.90);
  });

  it('--bg-surface ist weiß (#ffffff) – klare Abgrenzung zum grauen bg-base', () => {
    const hex = extractHex('--bg-surface', lightBlock);
    expect(hex).not.toBeNull();
    expect(hex!.toLowerCase()).toBe('#ffffff');
  });
});

describe('CSS Schatten-Tokens vorhanden', () => {
  it('--shadow-sm ist definiert', () => {
    expect(globalsCss).toContain('--shadow-sm:');
  });

  it('--shadow-md ist definiert', () => {
    expect(globalsCss).toContain('--shadow-md:');
  });

  it('--shadow-lg ist definiert', () => {
    expect(globalsCss).toContain('--shadow-lg:');
  });

  it('card-shimmer nutzt var(--shadow-sm) als Basis-Schatten', () => {
    expect(globalsCss).toContain('box-shadow: var(--shadow-sm)');
  });

  it('html:not(.dark) .card-shimmer nutzt var(--shadow-md)', () => {
    expect(globalsCss).toContain('box-shadow: var(--shadow-md)');
  });
});

describe('CSS Design-Tokens: Vollständigkeit', () => {
  const REQUIRED_TOKENS = [
    '--bg-base', '--bg-surface', '--bg-elevated', '--bg-input',
    '--text-base', '--text-muted', '--text-subtle',
    '--border', '--border-subtle',
    '--glass', '--glass-border',
    '--primary', '--primary-hover', '--primary-light',
    '--sidebar-bg', '--sidebar-border', '--sidebar-text',
    '--shadow-sm', '--shadow-md', '--shadow-lg',
  ];

  REQUIRED_TOKENS.forEach((token) => {
    it(`${token} ist im Dark-Root definiert`, () => {
      expect(darkBlock).toContain(token);
    });
  });
});
