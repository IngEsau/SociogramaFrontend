import { createBrowserRouter } from 'react-router-dom';

// Auth views
import { LoginView } from '../features/auth/views/LoginView';
import { ForgotPasswordView } from '../features/auth/views/ForgotPasswordView';
import { ResetPasswordView } from '../features/auth/views/ResetPasswordView';
import { ChangePasswordView } from '../features/auth/views/ChangePasswordView';

// Layout
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';

// Feature views por rol
import { AdminDashboardView } from '../features/admin';
import { TutorDashboardView } from '../features/tutor';
import { StudentDashboardView, StudentFormView } from '../features/student';

// ⚠️ COMITÉ: Rol en revisión - puede fusionarse con ADMIN
// Importar solo si COMMITTEE_ROLE_ENABLED = true en roleRouting.ts
import { CommitteeDashboardView } from '../features/committee';
import { COMMITTEE_ROLE_ENABLED } from '../core/routing';

// Common views
import { NotFoundView } from '../components/common';

// Guards
import {
  RoleProtectedRoute,
  ResetPasswordGuard,
  ChangePasswordGuard,
  GuestGuard,
  RootRedirect,
} from './guards';

export const router = createBrowserRouter([
  // Redirección inteligente en raíz
  {
    path: '/',
    element: <RootRedirect />,
  },

  // ============================================
  // RUTAS PÚBLICAS (Auth)
  // ============================================
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
    // Ruta de cambio de contraseña obligatorio (primer inicio de sesión)
    // Solo accesible si el usuario tiene first_login = true
    path: '/change-password',
    element: (
      <ChangePasswordGuard>
        <ChangePasswordView />
      </ChangePasswordGuard>
    ),
  },

  // ============================================
  // RUTAS PROTEGIDAS POR ROL: ADMIN
  // ============================================
  {
    path: '/admin',
    element: (
      <RoleProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardView /> },
      // Aquí irán más rutas de admin:
      // { path: 'users', element: <UserManagement /> },
      // { path: 'groups', element: <Groups /> },
      // { path: 'import', element: <DatabaseImport /> },
      // { path: 'logs', element: <Logs /> },
    ],
  },

  // ============================================
  // RUTAS PROTEGIDAS POR ROL: TUTOR (DOCENTE)
  // ============================================
  {
    path: '/tutor',
    element: (
      <RoleProtectedRoute allowedRoles={['DOCENTE']}>
        <DashboardLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <TutorDashboardView /> },
      // Aquí irán más rutas de tutor:
      // { path: 'assign', element: <AssignSociogram /> },
      // { path: 'reports', element: <ReportsList /> },
      // { path: 'preview/:id', element: <SociogramPreview /> },
    ],
  },

  // ============================================
  // RUTAS PROTEGIDAS POR ROL: STUDENT (ALUMNO)
  // ============================================
  {
    path: '/student',
    element: (
      <RoleProtectedRoute allowedRoles={['ALUMNO']}>
        <DashboardLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboardView /> },
      // para que tenga su propio diseño a pantalla completa
    ],
  },

  // ============================================
  // RUTAS PROTEGIDAS POR ROL: COMMITTEE (COMITE)
  // ⚠️ Solo habilitado si COMMITTEE_ROLE_ENABLED = true
  // Si está deshabilitado, usuarios COMITE son tratados como ADMIN
  // ============================================
  ...(COMMITTEE_ROLE_ENABLED
    ? [
        {
          path: '/committee',
          element: (
            <RoleProtectedRoute allowedRoles={['COMITE']}>
              <DashboardLayout />
            </RoleProtectedRoute>
          ),
          children: [
            { index: true, element: <CommitteeDashboardView /> },
            // Aquí irán más rutas de comité:
            // { path: 'supervision', element: <GlobalSociograms /> },
          ],
        },
      ]
    : []),

  // ============================================
  // RUTA DIRECTA AL FORMULARIO (Sin DashboardLayout)
  // Para acceso directo con código de grupo
  // ============================================
  {
    // Ruta del formulario del estudiante/sociograma
    // Accesible por ALUMNO, DOCENTE (previsualización) y ADMIN
    path: '/student-form',
    element: (
      <RoleProtectedRoute allowedRoles={['ALUMNO', 'DOCENTE', 'ADMIN']}>
        <StudentFormView />
      </RoleProtectedRoute>
    ),
  },

  // ============================================
  // FALLBACK: 404
  // ============================================
  {
    path: '*',
    element: <NotFoundView />,
  },
]);
