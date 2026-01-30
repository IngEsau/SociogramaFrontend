/**
 * Configuración de rutas de la aplicación
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginView } from '../features/auth/views/LoginView';
import { ForgotPasswordView } from '../features/auth/views/ForgotPasswordView';
import { ResetPasswordView } from '../features/auth/views/ResetPasswordView';
// TEMPORAL: El dashboard oficial está en feat/dashboard
import { DashboardView } from '../features/dashboard/views/DashboardView';
import { StudentFormView } from '../features/studentForm/views';
import { ProtectedRoute, RoleProtectedRoute, ResetPasswordGuard, GuestGuard } from './guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <GuestGuard>
        <LoginView />
      </GuestGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestGuard>
        <ForgotPasswordView />
      </GuestGuard>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestGuard>
        <ResetPasswordGuard>
          <ResetPasswordView />
        </ResetPasswordGuard>
      </GuestGuard>
    ),
  },
  {
    // TEMPORAL: Ruta de prueba para verificar login
    // El dashboard real se implementará en feat/dashboard
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardView />
      </ProtectedRoute>
    ),
  },
  {
    // Ruta del formulario del estudiante/sociograma
    // Solo accesible por ALUMNO, DOCENTE, ACADEMICO o ADMIN
    path: '/student-form',
    element: (
      <RoleProtectedRoute allowedRoles={['ALUMNO', 'DOCENTE', 'ACADEMICO', 'ADMIN']}>
        <StudentFormView />
      </RoleProtectedRoute>
    ),
  },
]);
