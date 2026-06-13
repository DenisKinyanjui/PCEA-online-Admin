import type { UserRole } from '../types';

export const ROLES = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  CHURCH_ADMIN: 'church_admin' as UserRole,
  TRANSCRIPTIONIST: 'transcriptionist' as UserRole,
} as const;

const ALL_ROLES: UserRole[] = ['super_admin', 'church_admin', 'transcriptionist'];

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: ALL_ROLES,
  sermons:   ALL_ROLES,
  uploads:   ALL_ROLES,
  profile:   ALL_ROLES,
  churches:  ['super_admin'],
  users:     ['super_admin'],
};
