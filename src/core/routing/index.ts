/**
 * Módulo de routing
 * 
 * Exporta utilidades para manejo de rutas basadas en roles
 */

export {
  // Configuración
  COMMITTEE_ROLE_ENABLED,
  // Funciones
  normalizeRole,
  isDocenteTutor,
  getHomePath,
  getAllowedRolesForPath,
  canAccessPath,
  // Tipos
  type AppRole,
  type ApiRole,
} from './roleRouting';
