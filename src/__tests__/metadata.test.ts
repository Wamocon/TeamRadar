import { describe, it, expect } from 'vitest';
import { metadata } from '../app/layout';

describe('Root Layout Metadata', () => {
  it('should have the correct application title', () => {
    expect(metadata.title).toBe('TeamRadar – Verfügbarkeit im Blick');
  });

  it('should have common metadata description', () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
  });

  it('should have configured favicon icons', () => {
    expect(metadata.icons).toBeDefined();
    const icons = metadata.icons as any;
    expect(icons.icon).toBeDefined();
    expect(icons.icon[0].url).toBe('/favicon.svg?v=2');
    expect(icons.apple[0].url).toBe('/favicon.png?v=2');
  });
});
