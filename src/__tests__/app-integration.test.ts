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

  it('should have correct sandbox permissions in AppPortal', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const portalPath = path.resolve(__dirname, '../components/layout/AppPortal.tsx');
    const content = fs.readFileSync(portalPath, 'utf-8');
    
    expect(content).toContain('allow-same-origin');
    expect(content).toContain('allow-scripts');
    expect(content).toContain('allow-forms');
    expect(content).toContain('allow-popups');
    expect(content).toContain('allow-modals');
    expect(content).toContain('allow-popups-to-escape-sandbox');
    expect(content).toContain('allow-downloads');
  });
});
