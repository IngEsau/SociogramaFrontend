/**
 * Vista de Login - Sociograma UTP
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store';
import { useRecaptcha } from '../../../core/hooks';
import { LoginFormContent, AuthBackground, AuthFooter } from '../components';

export const LoginView = () => {
  const navigate = useNavigate();

  // Estado local para los inputs
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado global de autenticación (Zustand)
  const { login, isLoading, error, clearError, user, isAuthenticated } = useAuthStore();

  // Hook personalizado para reCAPTCHA con fallback
  const { recaptchaLoaded, recaptchaFailed, recaptchaError, allowSkip, getRecaptchaResponse, canProceedWithoutRecaptcha, skipRecaptcha, resetRecaptcha } = useRecaptcha();

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Obtiene la respuesta de reCAPTCHA
    const recaptchaResponse = getRecaptchaResponse();

    // Validar reCAPTCHA
    if (!recaptchaResponse) {
      // Si reCAPTCHA se cargó correctamente, es requerido
      if (recaptchaLoaded) {
        console.error('Por favor completa el reCAPTCHA');
        alert('Por favor completa el reCAPTCHA');
        return;
      }

      // Si reCAPTCHA falló, permitir continuar solo si se ha omitido explícitamente
      if (!canProceedWithoutRecaptcha()) {
        console.error('reCAPTCHA no se ha completado');
        alert('Por favor completa el reCAPTCHA o espera a que se cargue');
        return;
      }
    }

    try {
      console.log('✓ Intentando login...');
      await login({
        username: matricula,
        password: password,
        recaptcha_token: recaptchaResponse,
      });
      console.log('✓ Login exitoso!');
      // La navegación se hace en el useEffect cuando cambie isAuthenticated
    } catch (err) {
      console.error('✗ Error de login:', err);
      resetRecaptcha();
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
          <LoginFormContent
            matricula={matricula}
            setMatricula={setMatricula}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            variant="desktop"
            recaptchaFailed={recaptchaFailed}
            recaptchaError={recaptchaError}
            allowSkip={allowSkip}
            onSkipRecaptcha={skipRecaptcha}
            showRecaptchaContainer={true}
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
            <LoginFormContent
              matricula={matricula}
              setMatricula={setMatricula}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              variant="tablet"
              recaptchaFailed={recaptchaFailed}
              recaptchaError={recaptchaError}
              allowSkip={allowSkip}
              onSkipRecaptcha={skipRecaptcha}
              showRecaptchaContainer={true}
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
            <LoginFormContent
              matricula={matricula}
              setMatricula={setMatricula}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              variant="mobile"
              recaptchaFailed={recaptchaFailed}
              recaptchaError={recaptchaError}
              allowSkip={allowSkip}
              onSkipRecaptcha={skipRecaptcha}
              showRecaptchaContainer={true}
            />
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <AuthFooter />
    </div>
  );
};

export default LoginView;
