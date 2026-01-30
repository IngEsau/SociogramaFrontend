/**
 * Guard para la ruta de restablecimiento de contraseña
 * Valida que el token sea válido antes de permitir el acceso
 */

import { useEffect, useState } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { validateResetTokenService } from '../../features/auth/services';
import { useToastStore } from '../../store';

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

  useEffect(() => {
    const validateToken = async () => {
      // Si no hay token en la URL, redirigir al login sin mostrar toast
      // La ruta está bloqueada y solo se desbloquea con un token válido
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
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
      } catch (error) {
        console.error('Error al validar token:', error);
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
  }, [token, showToast, hideToast, navigate]);

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
