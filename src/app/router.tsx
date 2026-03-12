import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';

// Guards (síncronos, son ligeros y se usan en toda la app)
import {
  RoleProtectedRoute,
  ResetPasswordGuard,
  ChangePasswordGuard,
  GuestGuard,
  RootRedirect,
} from './guards';

// Layout (síncrono, es el contenedor compartido de todas las rutas protegidas)
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';
import { LazyRoute } from './LazyRoute';

import { COMMITTEE_ROLE_ENABLED } from '../core/routing';

// ============================================
// Auth (lazy) - vistas públicas de bajo tráfico
// ============================================
const LoginView = lazy(() =>
  import('../features/auth/views/LoginView').then((m) => ({ default: m.LoginView }))
);
const ForgotPasswordView = lazy(() =>
  import('../features/auth/views/ForgotPasswordView').then((m) => ({ default: m.ForgotPasswordView }))
);
const ResetPasswordView = lazy(() =>
  import('../features/auth/views/ResetPasswordView').then((m) => ({ default: m.ResetPasswordView }))
);
const ChangePasswordView = lazy(() =>
  import('../features/auth/views/ChangePasswordView').then((m) => ({ default: m.ChangePasswordView }))
);

// ============================================
// Admin (lazy)
// ============================================
const AdminPanelView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminPanelView }))
);
const AdminDashboardView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminDashboardView }))
);
const AdminDatabaseImportView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminDatabaseImportView }))
);
const AdminImportHubView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminImportHubView }))
);
const AdminExcelImportView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminExcelImportView }))
);
const AdminCsvImportView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminCsvImportView }))
);
const AdminLogsView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminLogsView }))
);
const AdminArchivosView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminArchivosView }))
);
const AdminCuestionariosView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminCuestionariosView }))
);
const AdminBancoPreguntasView = lazy(() =>
  import('../features/admin/views').then((m) => ({ default: m.AdminBancoPreguntasView }))
);

// ============================================
// Tutor (lazy)
// ============================================
const TutorPanelView = lazy(() =>
  import('../features/tutor/views').then((m) => ({ default: m.TutorPanelView }))
);
const TutorDashboardView = lazy(() =>
  import('../features/tutor/views').then((m) => ({ default: m.TutorDashboardView }))
);
const TutorArchivosView = lazy(() =>
  import('../features/tutor/views').then((m) => ({ default: m.TutorArchivosView }))
);
const TutorActivityView = lazy(() =>
  import('../features/tutor/views').then((m) => ({ default: m.TutorActivityView }))
);

// ============================================
// Student (lazy)
// ============================================
const StudentDashboardView = lazy(() =>
  import('../features/student/views').then((m) => ({ default: m.StudentDashboardView }))
);
const StudentFormView = lazy(() =>
  import('../features/student/form/views').then((m) => ({ default: m.StudentFormView }))
);

// ============================================
// Committee (lazy)
// ============================================
const CommitteePanelView = lazy(() =>
  import('../features/committee/views').then((m) => ({ default: m.CommitteePanelView }))
);
const CommitteeQuestionnairesView = lazy(() =>
  import('../features/committee/views').then((m) => ({ default: m.CommitteeQuestionnairesView }))
);
const CommitteeGlobalGraphView = lazy(() =>
  import('../features/committee/views').then((m) => ({ default: m.CommitteeGlobalGraphView }))
);

// ============================================
// Settings y 404 (lazy)
// ============================================
const SettingsView = lazy(() =>
  import('../features/settings/views').then((m) => ({ default: m.SettingsView }))
);
const NotFoundView = lazy(() =>
  import('../components/common/views').then((m) => ({ default: m.NotFoundView }))
);

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
        <LazyRoute><LoginView /></LazyRoute>
      </GuestGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestGuard>
        <LazyRoute><ForgotPasswordView /></LazyRoute>
      </GuestGuard>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ResetPasswordGuard>
        <LazyRoute><ResetPasswordView /></LazyRoute>
      </ResetPasswordGuard>
    ),
  },
  {
    // Ruta de cambio de contraseña obligatorio (primer inicio de sesión)
    // Solo accesible si el usuario tiene first_login = true
    path: '/change-password',
    element: (
      <ChangePasswordGuard>
        <LazyRoute><ChangePasswordView /></LazyRoute>
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
      { index: true, element: <LazyRoute><AdminPanelView /></LazyRoute> },
      { path: 'settings', element: <LazyRoute><SettingsView /></LazyRoute> },
      { path: 'panel-legacy', element: <LazyRoute><AdminDashboardView /></LazyRoute> },
      { path: 'import', element: <LazyRoute><AdminImportHubView /></LazyRoute> },
      { path: 'import/excel', element: <LazyRoute><AdminExcelImportView /></LazyRoute> },
      { path: 'import/:type', element: <LazyRoute><AdminCsvImportView /></LazyRoute> },
      { path: 'import/legacy', element: <LazyRoute><AdminDatabaseImportView /></LazyRoute> },
      { path: 'logs', element: <LazyRoute><AdminLogsView /></LazyRoute> },
      { path: 'archivos', element: <LazyRoute><AdminArchivosView /></LazyRoute> },
      { path: 'cuestionarios', element: <LazyRoute><AdminCuestionariosView /></LazyRoute> },
      { path: 'cuestionarios/banco', element: <LazyRoute><AdminBancoPreguntasView /></LazyRoute> },
      // Aquí irán más rutas de admin:
      // { path: 'users', element: <UserManagement /> },
      // { path: 'groups', element: <Groups /> },
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
      { index: true, element: <LazyRoute><TutorPanelView /></LazyRoute> },
      { path: 'dashboard', element: <LazyRoute><TutorDashboardView /></LazyRoute> },
      { path: 'archivos', element: <LazyRoute><TutorArchivosView /></LazyRoute> },
      { path: 'activity', element: <LazyRoute><TutorActivityView /></LazyRoute> },
      { path: 'settings', element: <LazyRoute><SettingsView /></LazyRoute> },
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
      { index: true, element: <LazyRoute><StudentDashboardView /></LazyRoute> },
      { path: 'settings', element: <LazyRoute><SettingsView /></LazyRoute> },
      // para que tenga su propio diseño a pantalla completa
    ],
  },

  // ============================================
  // RUTAS PROTEGIDAS POR ROL: COMMITTEE (COMITE)
  // Solo habilitado si COMMITTEE_ROLE_ENABLED = true
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
            { index: true, element: <LazyRoute><CommitteePanelView /></LazyRoute> },
            { path: 'cuestionarios', element: <LazyRoute><CommitteeQuestionnairesView /></LazyRoute> },
            { path: 'grafo-global', element: <LazyRoute><CommitteeGlobalGraphView /></LazyRoute> },
            { path: 'settings', element: <LazyRoute><SettingsView /></LazyRoute> },
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
        <LazyRoute><StudentFormView /></LazyRoute>
      </RoleProtectedRoute>
    ),
  },
  {
    // Ruta con ID de cuestionario para responder una encuesta concreta
    path: '/student-form/:cuestionarioId',
    element: (
      <RoleProtectedRoute allowedRoles={['ALUMNO', 'DOCENTE', 'ADMIN']}>
        <LazyRoute><StudentFormView /></LazyRoute>
      </RoleProtectedRoute>
    ),
  },
  // ============================================
  // FALLBACK: 404
  // ============================================
  {
    path: '*',
    element: <LazyRoute><NotFoundView /></LazyRoute>,
  },
]);
