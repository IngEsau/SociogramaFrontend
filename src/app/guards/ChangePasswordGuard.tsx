/**
 * Guard para la ruta de cambio de contraseña obligatorio
 * Solo permite acceso si el usuario está autenticado Y tiene first_login = true
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getHomePath } from '../../core/routing';

interface ChangePasswordGuardProps {
  children: React.ReactNode;
}

export const ChangePasswordGuard = ({ children }: ChangePasswordGuardProps) => {
  const { isAuthenticated, user, requiresPasswordChange } = useAuthStore();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero NO requiere cambio de contraseña, redirigir a su home
  if (!requiresPasswordChange) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Si está autenticado Y requiere cambio de contraseña, permitir acceso
  return <>{children}</>;
};
