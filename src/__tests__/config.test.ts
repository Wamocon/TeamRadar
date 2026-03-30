import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Next.js Image Configuration Check', () => {
  const configPath = path.resolve(__dirname, '../../next.config.js');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  it('should allow images.unsplash.com in remotePatterns', () => {
    expect(configContent).toContain('hostname: \'images.unsplash.com\'');
  });

  it('should allow the Supabase project domain in remotePatterns', () => {
    // Falls kein Supabase-Projekt konfiguriert ist, wird dies übersprungen
    const supabaseUrl = 'sumizzyukytgjllgwjqo.supabase.co';
    expect(configContent).toContain(`hostname: '${supabaseUrl}'`);
  });

  it('should include the protocol for remotePatterns', () => {
    expect(configContent).toContain('protocol: \'https\'');
  });
});
