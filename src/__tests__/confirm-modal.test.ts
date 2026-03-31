import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ConfirmModal System & Form Protection Integration Check', () => {
  // Paths
  const confirmModalPath = path.resolve(__dirname, '../components/ui/ConfirmModal.tsx');
  const membersPath = path.resolve(__dirname, '../app/members/page.tsx');
  const memberFormPath = path.resolve(__dirname, '../components/team/MemberForm.tsx');
  const teamsPath = path.resolve(__dirname, '../app/teams/page.tsx');
  const projectsPath = path.resolve(__dirname, '../app/projects/page.tsx');
  const modalPath = path.resolve(__dirname, '../components/ui/Modal.tsx');

  // Load contents
  const confirmModalContent = fs.readFileSync(confirmModalPath, 'utf-8');
  const membersContent = fs.readFileSync(membersPath, 'utf-8');
  const memberFormContent = fs.readFileSync(memberFormPath, 'utf-8');
  const teamsContent = fs.readFileSync(teamsPath, 'utf-8');
  const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  it('ConfirmModal component should have TRACE-style design and use generic Modal', () => {
    // Check for specific TRACE elements
    expect(confirmModalContent).toContain('<Modal');
    expect(confirmModalContent).toContain('animate-scale-up');
    expect(confirmModalContent).toContain('w-16 h-16 rounded-2xl');
    
    // Variant support
    expect(confirmModalContent).toContain('\'danger\'');
    expect(confirmModalContent).toContain('\'warning\'');
    expect(confirmModalContent).toContain('\'info\'');
  });

  it('Modal component should support showCloseButton prop', () => {
    expect(modalContent).toContain('showCloseButton?: boolean');
    expect(modalContent).toContain('showCloseButton &&');
  });

  it('MembersPage should use ConfirmModal for member deletion', () => {
    expect(membersContent).toContain('setDeletingMemberId(null)');
    expect(membersContent).toContain('<ConfirmModal');
    expect(membersContent).toContain('isOpen={!!deletingMemberId}');
    expect(membersContent).not.toContain('window.confirm(');
  });

  it('MemberForm should have unsaved changes (isDirty) protection', () => {
    expect(memberFormContent).toContain('const isDirty =');
    expect(memberFormContent).toContain('setShowCancelConfirm(true)');
    expect(memberFormContent).toContain('<ConfirmModal');
    expect(memberFormContent).toContain('title="Änderungen verwerfen"');
  });

  it('TeamsPage should have unsaved changes (isDirty) protection', () => {
    expect(teamsContent).toContain('const isDirty =');
    expect(teamsContent).toContain('setShowCancelConfirm(true)');
    expect(teamsContent).toContain('setDeletingTeamId(null)');
    expect(teamsContent).toContain('<ConfirmModal');
  });

  it('ProjectsPage should have unsaved changes (isDirty) protection', () => {
    expect(projectsContent).toContain('const isDirty =');
    expect(projectsContent).toContain('setShowCancelConfirm(true)');
    expect(projectsContent).toContain('setDeletingProjectId(null)');
    expect(projectsContent).toContain('<ConfirmModal');
  });

  it('Deletions in all pages should be migrated from native confirm', () => {
    expect(membersContent).not.toContain('confirm(');
    expect(teamsContent).not.toContain('confirm(');
    expect(projectsContent).not.toContain('confirm(');
  });
});
