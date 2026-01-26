/**
 * Configuración de rutas de la aplicación
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginView } from '../features/auth/views/LoginView';
import { ForgotPasswordView } from '../features/auth/views/ForgotPasswordView';
import { ResetPasswordView } from '../features/auth/views/ResetPasswordView';
// ⚠️ TEMPORAL: El dashboard oficial está en feat/dashboard
import { DashboardView } from '../features/dashboard/views/DashboardView';
import { ProtectedRoute } from './guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginView />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordView />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordView />,
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
]);
