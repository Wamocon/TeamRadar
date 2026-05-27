import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sidebar Theme-Awareness Check', () => {
  const sidebarPath = path.resolve(__dirname, '../components/layout/Sidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

  it('should use CSS variables for theme-aware backgrounds', () => {
    expect(sidebarContent).toContain('bg-(--sidebar-bg)');
  });

  it('should use CSS variables for theme-aware text colors', () => {
    expect(sidebarContent).toContain('text-(--sidebar-text)');
    expect(sidebarContent).toContain('text-(--sidebar-text-muted)');
  });

  it('should use CSS variables for theme-aware borders', () => {
    expect(sidebarContent).toContain('border-(--sidebar-border)');
  });

  it('should use theme-adaptive active item classes', () => {
    expect(sidebarContent).toContain('bg-blue-500/10 text-blue-500');
    expect(sidebarContent).toContain('bg-purple-500/10 text-purple-500');
  });

  it('should use theme-adaptive hover item classes', () => {
    expect(sidebarContent).toContain('hover:bg-(--sidebar-item-hover)');
  });

  it('should have alt prop for user avatar for accessibility (lint-fix check)', () => {
    expect(sidebarContent).toContain('alt="User Avatar"');
  });

  it('should use the Image component with fill and cover for the avatar', () => {
    expect(sidebarContent).toContain('<Image');
    expect(sidebarContent).toContain('src={userProfile.avatarUrl}');
    expect(sidebarContent).toContain('fill');
    expect(sidebarContent).toContain('className="object-cover"');
  });
});
