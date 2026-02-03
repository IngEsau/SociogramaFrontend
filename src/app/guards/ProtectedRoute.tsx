/**
 * Guard para rutas protegidas
 * Verifica que el usuario esté autenticado antes de permitir el acceso
 * También verifica si el usuario necesita cambiar su contraseña (first_login)
 */

import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getHomePath, canAccessPath } from '../../core/routing';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

// Bypass para desarrollo
const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, fetchProfile, requiresPasswordChange } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!bypass);
  const location = useLocation();

  useEffect(() => {
    if (bypass) return;

    const checkAuth = async () => {
      // Si ya tenemos usuario en el estado (persistido), no necesitamos verificar
      if (isAuthenticated && user) {
        setIsChecking(false);
        return;
      }

      // Si hay token en localStorage pero no hay usuario en el estado,
      // intentar recuperar el perfil
      if (localStorage.getItem('access_token') && !user) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [user, fetchProfile, isAuthenticated]);

  // Bypass para desarrollo - permitir acceso sin verificación
  if (bypass) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Mientras verifica, mostrar pantalla de carga minimalista (sin texto)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0F7E3C]"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere cambio de contraseña (primer inicio de sesión), redirigir
  if (requiresPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Verificar si el usuario puede acceder a esta ruta según su rol
  if (!canAccessPath(user, location.pathname)) {
    // Redirigir a su home correspondiente
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Si tiene children, mostrarlos; sino usar Outlet para rutas anidadas
  return children ? <>{children}</> : <Outlet />;
};
