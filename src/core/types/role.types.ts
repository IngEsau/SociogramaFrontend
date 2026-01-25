/**
 * Tipos relacionados con roles del sistema
 */

export const UserRole = {
  TUTOR: 'tutor',
  COMITE: 'comite',
  ALUMNO: 'alumno',
} as const;

export type Role = typeof UserRole.TUTOR | typeof UserRole.COMITE | typeof UserRole.ALUMNO;

export interface RolePermissions {
  canViewSociogram: boolean;
  canEditGroups: boolean;
  canManageUsers: boolean;
  canViewDashboard: boolean;
}
