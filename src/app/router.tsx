import { createBrowserRouter } from 'react-router-dom';

import RootRedirect from './RootRedirect';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { RoleGate } from './RoleGate';
import { TutorGate } from './TutorGate';

import LoginView from '../features/auth/views/LoginView';

import AdminDashboardView from '../features/admin/views/AdminDashboardView';
import TutorDashboardView from '../features/tutor/views/TutorDashboardView';
import AlumnoDashboardView from '../features/alumno/views/AlumnoDashboardView';
import NotFoundView from '../features/shared/views/NotFoundView';
import DashboardHome from '../features/admin/views/DashboardContent';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },

  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginView /> }],
  },

  {

    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleGate allow={['ADMIN']} />,
        children: [
          {
            path: "/dashboard",
            element: <AdminDashboardView />,
            children: [
              { index: true, element: <DashboardHome /> },
            ],
          },
        ],
      },
      {
        element: <TutorGate />,
        children: [{ path: '/tutor', element: <TutorDashboardView /> }],
      },
      {
        element: <RoleGate allow={['ALUMNO']} />,
        children: [{ path: '/alumno', element: <AlumnoDashboardView /> }],
      },
    ],
  },

  { path: '*', element: <NotFoundView /> },
]);
