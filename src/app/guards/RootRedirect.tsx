/**
 * Componente para redirección inteligente en la ruta raíz
 * Redirige al dashboard según el rol si está autenticado, sino al login
 * Si requiere cambio de contraseña, redirige a /change-password
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getHomePath } from '../../core/routing';

// Bypass para desarrollo
const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const RootRedirect = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const requiresPasswordChange = useAuthStore((s) => s.requiresPasswordChange);

  // En modo bypass, ir directo al dashboard de admin
  if (bypass) {
    return <Navigate to="/admin" replace />;
  }

  // Si está autenticado
  if (isAuthenticated && user) {
    // Si requiere cambio de contraseña, redirigir a change-password
    if (requiresPasswordChange) {
      return <Navigate to="/change-password" replace />;
    }
    // Redirigir según el rol del usuario
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Si no está autenticado, ir al login
  return <Navigate to="/login" replace />;
};
