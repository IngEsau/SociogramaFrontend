/**
 * Exportación centralizada de servicios
 */

export { authService } from '../features/auth/services/auth.service';
export { academicService } from './academic.service';
export { adminService } from './admin.service';

// Re-exportar tipos útiles
export type { ImportCSVResponse } from './admin.service';
