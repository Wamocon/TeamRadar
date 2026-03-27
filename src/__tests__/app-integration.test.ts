import { describe, it, expect } from 'vitest';

describe('App Integration Configuration', () => {
  it('should have NEXT_PUBLIC_AWAY_URL configured', () => {
    expect(process.env.NEXT_PUBLIC_AWAY_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_AWAY_URL).toContain('http');
  });

  it('should have NEXT_PUBLIC_TRACE_URL configured', () => {
    expect(process.env.NEXT_PUBLIC_TRACE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_TRACE_URL).toContain('http');
  });

  it('should use localhost ports by default in test env', () => {
    expect(process.env.NEXT_PUBLIC_AWAY_URL).toBe('http://localhost:3001');
    expect(process.env.NEXT_PUBLIC_TRACE_URL).toBe('http://localhost:3002');
  });
});
