import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Branding Assets', () => {
  const publicDir = path.resolve(__dirname, '../../public');

  it('should have the favicon.png in the public directory', () => {
    const faviconPath = path.join(publicDir, 'favicon.png');
    expect(fs.existsSync(faviconPath)).toBe(true);
  });

  it('should have the logo.png in the public directory', () => {
    const logoPath = path.join(publicDir, 'logo.png');
    expect(fs.existsSync(logoPath)).toBe(true);
  });
});
