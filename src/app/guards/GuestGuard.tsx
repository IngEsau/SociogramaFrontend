/**
 * Guard para rutas de invitados (login, forgot-password, reset-password)
 * Bloquea el acceso a estas rutas si el usuario YA tiene sesión activa
 * Redirige al dashboard según el rol si el usuario está autenticado
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getHomePath } from '../../core/routing';

interface GuestGuardProps {
  children: React.ReactNode;
}

// Bypass para desarrollo
const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!bypass);

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
          // Token inválido, el usuario puede acceder a las rutas de auth
          console.error('Token inválido:', error);
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [fetchProfile, isAuthenticated, user]);

  // Bypass para desarrollo - permitir acceso sin verificación
  if (bypass) {
    return <>{children}</>;
  }

  // Mientras verifica, mostrar pantalla de carga minimalista
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0F7E3C]"></div>
      </div>
    );
  }

  // Si está autenticado, redirigir al dashboard según su rol
  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Si NO está autenticado, mostrar el contenido (login, forgot-password, etc.)
  return <>{children}</>;
};
