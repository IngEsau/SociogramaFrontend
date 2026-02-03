/**
 * Feature Student
 * 
 * Módulo para alumnos/estudiantes
 */

// Views
export { StudentDashboardView } from './views';
export { StudentFormView, StudentFormAccessView } from './form/views';

// Services
export { studentService, studentFormService } from './services';

// Store
export { useStudentFormStore } from './store';

// Types
export type * from './types';
