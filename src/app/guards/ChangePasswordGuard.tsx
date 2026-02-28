/**
 * Guard para la ruta de cambio de contraseña obligatorio
 * Solo permite acceso si el usuario está autenticado Y tiene first_login = true.
 * Si el usuario intenta acceder sin cumplir las condiciones, muestra un aviso
 * claro antes de redirigirlo.
 */

import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useToastStore } from '../../store';
import { getHomePath } from '../../core/routing';

interface ChangePasswordGuardProps {
  children: React.ReactNode;
}

export const ChangePasswordGuard = ({ children }: ChangePasswordGuardProps) => {
  const { isAuthenticated, user, requiresPasswordChange } = useAuthStore();
  const { showToast } = useToastStore();
  // Ref para disparar el toast solo una vez y evitar loops por re-renders
  const toastShown = useRef(false);

  const isBlocked =
    !isAuthenticated ||
    !user ||
    !requiresPasswordChange;

  useEffect(() => {
    if (isBlocked && !toastShown.current) {
      toastShown.current = true;

      const isLoggedIn = isAuthenticated && !!user;

      showToast({
        message: isLoggedIn
          ? 'Esta página solo es accesible al iniciar sesión por primera vez.\nPara cambiar tu contraseña accede a la sección Configuración.'
          : 'Esta página solo es accesible la primera vez que inicias sesión.\nSi es tu primer ingreso, inicia sesión con las credenciales que te proporcionaron.',
        type: 'warning',
      });
    }
  }, [isBlocked, isAuthenticated, user, showToast]);

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
