/**
 * Vista de Cambio de Contraseña Obligatorio - Sociograma UTP
 * Para usuarios con first_login = true
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordFormContent } from '../components/ChangePasswordFormContent';
import { AuthBackground, AuthFooter } from '../components';
import { validatePasswordRequirements } from '../../../core/utils/passwordStrength';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../store';

export const ChangePasswordView = () => {
  // Estado local para los inputs
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const navigate = useNavigate();
  const { completeFirstLoginPasswordChange } = useAuthStore();

  // Countdown cuando hay éxito
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/dashboard');
    }
  }, [success, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validar requisitos obligatorios
    const requirements = validatePasswordRequirements(password);
    if (!requirements.allMet) {
      const missingRequirements = [];
      if (!requirements.hasMinLength) missingRequirements.push('Mínimo 8 caracteres');
      if (!requirements.hasUpperCase) missingRequirements.push('Agrega mayúsculas (A-Z)');
      if (!requirements.hasNumber) missingRequirements.push('Agrega números (0-9)');

      setError(`Falta completar los siguientes requisitos:\n• ${missingRequirements.join('\n• ')}`);
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Intentando cambiar contraseña de primer inicio de sesión...');

      // Llamar al servicio de cambio de contraseña de primer login
      await authService.firstLoginChangePassword({
        new_password: password,
        new_password2: confirmPassword,
      });

      // Actualizar el estado del store
      await completeFirstLoginPasswordChange();

      console.log('✓ Contraseña cambiada exitosamente');
      setSuccess('Contraseña actualizada exitosamente.');

      // Limpiar campos
      setPassword('');
      setConfirmPassword('');

    } catch (err) {
      console.error('✗ Error al cambiar contraseña:', err);
      
      // Manejar errores de la API
      const error = err as { response?: { data?: { error?: string; detail?: string; new_password?: string[] } } };
      
      let errorMessage = 'Ocurrió un error al cambiar tu contraseña. Por favor, intenta nuevamente.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.new_password) {
        errorMessage = error.response.data.new_password.join('\n');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col relative bg-[#FEFEFF] overflow-hidden">
      {/* Fondo decorativo (círculos y logo UTP) */}
      <AuthBackground breakpoint={1400} />

      {/* ========== CONTENEDOR PRINCIPAL ========== */}
      <div className="flex-1 flex items-center justify-center xl-custom:justify-end pr-0 xl-custom:pr-[300px] relative z-20">
        {/* PC: Contenedor sin tarjeta */}
        <div className="hidden xl-custom:flex xl-custom:w-[380px] flex-col justify-center items-center gap-5">
          <ChangePasswordFormContent
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            success={success}
            variant="desktop"
            countdown={countdown}
          />
        </div>

        {/* Tablet: Contenedor con tarjeta */}
        <div
          className="hidden md:flex xl-custom:hidden w-full max-w-[500px] px-8 py-12 rounded-xl backdrop-blur-[50px]"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(15, 126, 60, 0.50)',
          }}
        >
          <div className="flex-1 flex flex-col justify-center items-center gap-5">
            <ChangePasswordFormContent
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              success={success}
              variant="tablet"
              countdown={countdown}
            />
          </div>
        </div>

        {/* Mobile: Contenedor con tarjeta */}
        <div
          className="flex md:hidden w-full max-w-[340px] px-6 py-12 rounded-2xl backdrop-blur-[50px]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(15, 126, 60, 0.50)',
          }}
        >
          <div className="w-full flex flex-col justify-start items-center gap-4">
            <ChangePasswordFormContent
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              success={success}
              variant="mobile"
              countdown={countdown}
            />
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <AuthFooter />
    </div>
  );
};
