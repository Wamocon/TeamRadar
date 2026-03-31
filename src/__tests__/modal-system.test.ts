import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Modal System Integration Check', () => {
  // Paths
  const sidebarPath = path.resolve(__dirname, '../components/layout/Sidebar.tsx');
  const membersPath = path.resolve(__dirname, '../app/members/page.tsx');
  const dashboardPath = path.resolve(__dirname, '../app/page.tsx');
  const modalPath = path.resolve(__dirname, '../components/ui/Modal.tsx');
  const legacyPath = path.resolve(__dirname, '../app/members/new/page.tsx');

  // Load contents
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
  const membersContent = fs.readFileSync(membersPath, 'utf-8');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');
  const legacyContent = fs.readFileSync(legacyPath, 'utf-8');

  it('Sidebar should use the query parameter for member invitations', () => {
    expect(sidebarContent).toContain('href: \'/members?action=invite\'');
  });

  it('MembersPage should handle the action=invite search parameter', () => {
    expect(membersContent).toContain('const action = searchParams.get(\'action\')');
    expect(membersContent).toContain('if (action === \'invite\')');
    expect(membersContent).toContain('setShowMemberModal(true)');
  });

  it('DashboardPage should use the Modal component for status entry', () => {
    expect(dashboardContent).toContain('<Modal');
    expect(dashboardContent).toContain('isOpen={showForm}');
    expect(dashboardContent).toContain('<AvailabilityForm');
  });

  it('Modal component should have TRACE-style design elements', () => {
    // Backdrop blur
    expect(modalContent).toContain('backdrop-blur-md');
    // Centered container
    expect(modalContent).toContain('items-center justify-center');
    // TRACE colors (Slate 950 or custom dark)
    expect(modalContent).toContain('bg-[#0f172a]'); // Container background
    // Close button
    expect(modalContent).toContain('Schließen');
    // Animations
    expect(modalContent).toContain('animate-scale-up');
  });

  it('Legacy New Member page should redirect to the modal version', () => {
    expect(legacyContent).toContain('router.replace(\'/members?action=invite\')');
  });
});
