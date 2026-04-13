/**
 * Vitest Setup – globale Mocks für Browser/Next.js APIs
 */
import { vi } from 'vitest';

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Reset counter between tests
beforeEach(() => {
  uuidCounter = 0;
});

// Mock localStorage (vollständig für zustand persist middleware)
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
});

// Zustand persist middleware: suppress expected storage-warnings in test env
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('[zustand persist middleware]')) return;
  originalConsoleError.apply(console, args);
};

// Mock process.env
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
process.env.NEXT_PUBLIC_DB_SCHEMA = 'teamradar-dev';
process.env.NEXT_PUBLIC_AWAY_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_TRACE_URL = 'http://localhost:3002';
