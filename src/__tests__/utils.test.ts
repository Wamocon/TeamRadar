/**
 * Tests für die cn() Utility-Funktion
 */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn() Utility', () => {
  it('merged einzelne Klasse', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merged mehrere Klassen', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('entfernt Duplikate via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handled conditional Klassen (clsx)', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handled undefined und null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handled leere Eingabe', () => {
    expect(cn()).toBe('');
  });

  it('handled Arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('merged Tailwind-Konflikte korrekt', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('mt-2', 'mt-4')).toBe('mt-4');
  });
});
