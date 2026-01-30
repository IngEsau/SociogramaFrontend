import type { MeResponse, UserRole } from '../types/api.types';

export type AppRole = 'ADMIN' | 'DOCENTE' | 'ALUMNO' | 'COMITE';

export function normalizeRole(role?: UserRole | string | null): AppRole | null {
  if (!role) return null;
  if (role === 'ACADEMICO') return 'DOCENTE';
  if (role === 'ADMIN' || role === 'DOCENTE' || role === 'ALUMNO' || role === 'COMITE') return role;
  return null;
}

export function isDocenteTutor(me: MeResponse | null): boolean {
  const d = me?.docente as any;
  return d?.es_tutor === true || d?.is_tutor === true || d?.tutor === true;
}

export function getHomePath(me: MeResponse | null): string {
  const role = normalizeRole(me?.user?.rol);
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'DOCENTE':
      return '/tutor';
    case 'ALUMNO':
      return '/alumno';
    case 'COMITE':
      return '/comite';
    default:
      return '/login';
  }
}
