/**
 * Utilidades de routing basado en roles
 * 
 * Este módulo centraliza toda la lógica de redirección según el rol del usuario.
 * Permite normalizar roles (ej: ACADEMICO → DOCENTE) y determinar la ruta home de cada rol.
 */

import type { UserResponse } from '../types/api.types';

// ============================================
// CONFIGURACIÓN DE ROLES
// ============================================

/**
 * ⚠️ COMITÉ: Rol en revisión
 *
 * El rol de COMITE está semi-confirmado. Puede que se fusione con ADMIN.
 * Si COMMITTEE_ROLE_ENABLED = false, los usuarios con rol COMITE
 * serán tratados como ADMIN.
 */
export const COMMITTEE_ROLE_ENABLED = false; // Cambiar a true cuando se confirme el rol

// Roles de la aplicación (normalizados)
export type AppRole = 'ADMIN' | 'DOCENTE' | 'ALUMNO' | 'COMITE';

// Roles tal como vienen de la API
export type ApiRole = 'ADMIN' | 'DOCENTE' | 'ALUMNO' | 'ACADEMICO' | 'COMITE';

/**
 * Normaliza el rol de la API al rol de la aplicación
 * - ACADEMICO se considera DOCENTE para efectos de permisos
 * - COMITE se trata como ADMIN si COMMITTEE_ROLE_ENABLED = false
 */
export function normalizeRole(role?: ApiRole | string | null): AppRole | null {
  if (!role) return null;
  
  // ACADEMICO tiene los mismos permisos que DOCENTE
  if (role === 'ACADEMICO') return 'DOCENTE';
  
  // COMITE: Si el rol no está habilitado, tratar como ADMIN
  if (role === 'COMITE') {
    return COMMITTEE_ROLE_ENABLED ? 'COMITE' : 'ADMIN';
  }
  
  // Roles válidos
  if (role === 'ADMIN' || role === 'DOCENTE' || role === 'ALUMNO') {
    return role;
  }
  
  return null;
}

/**
 * Verifica si el usuario tiene información de docente/tutor
 * Útil para determinar si un DOCENTE puede acceder a funciones de tutor
 */
export function isDocenteTutor(user: UserResponse | null): boolean {
  if (!user?.docente) return false;
  
  const docente = user.docente;
  return docente.es_tutor === true;
}

/**
 * Obtiene la ruta home según el rol del usuario
 * Cada rol tiene su propio dashboard
 */
export function getHomePath(user: UserResponse | null): string {
  const role = normalizeRole(user?.rol);
  
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'DOCENTE':
      return '/tutor';
    case 'ALUMNO':
      return '/student';
    case 'COMITE':
      // Solo llega aquí si COMMITTEE_ROLE_ENABLED = true
      return '/committee';
    default:
      return '/login';
  }
}

/**
 * Obtiene todos los roles permitidos para acceder a una ruta
 */
export function getAllowedRolesForPath(path: string): AppRole[] {
  // Rutas de admin (incluye COMITE si está deshabilitado como rol separado)
  if (path.startsWith('/admin')) {
    return COMMITTEE_ROLE_ENABLED ? ['ADMIN'] : ['ADMIN', 'COMITE'];
  }

  // Rutas de tutor/docente
  if (path.startsWith('/tutor')) return ['DOCENTE'];

  // Rutas de estudiante
  if (path.startsWith('/student')) return ['ALUMNO'];

  // Rutas de comité (solo si está habilitado)
  if (path.startsWith('/committee')) {
    return COMMITTEE_ROLE_ENABLED ? ['COMITE'] : ['ADMIN', 'COMITE'];
  }

  // Rutas compartidas
  return ['ADMIN', 'DOCENTE', 'ALUMNO', 'COMITE'];
}

/**
 * Verifica si un usuario puede acceder a una ruta específica
 */
export function canAccessPath(user: UserResponse | null, path: string): boolean {
  const role = normalizeRole(user?.rol);
  if (!role) return false;

  const allowedRoles = getAllowedRolesForPath(path);
  return allowedRoles.includes(role);
}
