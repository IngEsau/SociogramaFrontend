/**
 * Guard para la ruta de restablecimiento de contraseña
 * Valida que el token sea válido antes de permitir el acceso.
 * Si el usuario tiene sesión activa, la cierra primero para que pueda
 * usar el enlace del correo sin importar si está logueado o no.
 */

import { useEffect, useState } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { validateResetTokenService } from '../../features/auth/services';
import { useToastStore } from '../../store';
import { useAuthStore } from '../../store';

interface ResetPasswordGuardProps {
  children: React.ReactNode;
}

export const ResetPasswordGuard = ({ children }: ResetPasswordGuardProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const { showToast, hideToast } = useToastStore();
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const validateToken = async () => {
      // Si no hay token en la URL, mostrar aviso y redirigir al login
      if (!token) {
        showToast({
          message: 'Enlace de recuperación no válido.\nSolicita un nuevo enlace desde la pantalla de olvide mi contraseña.',
          type: 'warning',
          action: {
            label: 'Solicitar nuevo enlace',
            onClick: () => {
              hideToast();
              navigate('/forgot-password');
            },
          },
        });
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      // Si hay sesión activa, cerrarla silenciosamente antes de validar el token.
      // El enlace del correo debe funcionar sin importar el estado de sesión.
      if (isAuthenticated) {
        await logout();
      }

      try {
        const response = await validateResetTokenService(token);

        if (response.valid) {
          setIsValid(true);
        } else {
          showToast({
            message: 'Enlace de recuperación inválido.\nPor favor, solicita un nuevo enlace de recuperación de contraseña.',
            type: 'error',
            action: {
              label: 'Solicitar nuevo enlace',
              onClick: () => {
                hideToast();
                navigate('/forgot-password');
              },
            },
          });
          setIsValid(false);
        }
      } catch {
        showToast({
          message: 'Ocurrió un error al verificar tu solicitud.\nPor favor, intenta solicitar un nuevo enlace.',
          type: 'error',
          action: {
            label: 'Solicitar nuevo enlace',
            onClick: () => {
              hideToast();
              navigate('/forgot-password');
            },
          },
        });
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  // showToast, hideToast y navigate son referencias estables (Zustand + React Router)
  // que no cambian entre renders, por lo que no causan re-ejecuciones inesperadas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Mientras valida, mostrar pantalla de carga
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0F7E3C] mx-auto mb-4"></div>
          <p className="text-[#313131] font-['Roboto']">Verificando enlace de recuperación...</p>
        </div>
      </div>
    );
  }

  // Si el token no es válido, redirigir al login
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // Si el token es válido, mostrar el contenido
  return <>{children}</>;
};
