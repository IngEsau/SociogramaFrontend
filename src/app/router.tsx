import { createBrowserRouter, Navigate } from 'react-router-dom';

// Auth views
import { LoginView } from '../features/auth/views/LoginView';
import { ForgotPasswordView } from '../features/auth/views/ForgotPasswordView';
import { ResetPasswordView } from '../features/auth/views/ResetPasswordView';

// Dashboard
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';
import DashboardHome from '../features/dashboard/views/DashboardHome';

// Student Form
import { StudentFormView } from '../features/studentForm/views';

// Guards
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
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
        ],
      },
    ],
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
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
