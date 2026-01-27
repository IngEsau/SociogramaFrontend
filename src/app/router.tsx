import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginView from "../features/auth/views/LoginView";

import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { RootRedirect } from "./RootRedirect";

import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";
import DashboardHome from "../features/dashboard/views/DashboardHome";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginView />
      </PublicRoute>
    ),
  },
  {
    path: "/dashboard",
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
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
