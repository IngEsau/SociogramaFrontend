/**
 * Vista de Recuperación de Contraseña - Sociograma UTP
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useState } from 'react';
import { useRecaptcha } from '../../../core/hooks';
import { ForgotPasswordFormContent, AuthBackground, AuthFooter } from '../components';

export const ForgotPasswordView = () => {
  // Estado local para el input
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hook personalizado para reCAPTCHA con fallback
  const { recaptchaLoaded, recaptchaFailed, recaptchaError, allowSkip, getRecaptchaResponse, canProceedWithoutRecaptcha, skipRecaptcha, resetRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Obtiene la respuesta de reCAPTCHA
    const recaptchaResponse = getRecaptchaResponse();

    // Validar reCAPTCHA
    if (!recaptchaResponse) {
      // Si reCAPTCHA se cargó correctamente, es requerido
      if (recaptchaLoaded) {
        setError('Por favor completa el reCAPTCHA');
        return;
      }

      // Si reCAPTCHA falló, permitir continuar solo si se ha omitido explícitamente
      if (!canProceedWithoutRecaptcha()) {
        setError('Por favor completa el reCAPTCHA o espera a que se cargue');
        return;
      }
    }

    try {
      setIsLoading(true);
      console.log('✓ Intentando solicitud de recuperación...');

      // TODO: Aquí iría la llamada al servicio de recuperación de contraseña
      // await forgotPasswordService({ email, recaptcha_token: recaptchaResponse });

      // Simulación de envío (temporal)
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('✓ Solicitud de recuperación enviada para:', email);
      setSuccess('Si existe una cuenta con el correo proporcionado, recibirás un enlace de recuperación.');
      setEmail('');
      resetRecaptcha();

    } catch (err) {
      console.error('✗ Error al solicitar recuperación:', err);
      setError('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.');
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col relative bg-[#FEFEFF] overflow-hidden">
      {/* Fondo decorativo (círculos y logo UTP) */}
      <AuthBackground breakpoint={1500} />

      {/* ========== CONTENEDOR PRINCIPAL ========== */}
      <div className="flex-1 flex items-center justify-center xl-custom:justify-end pr-0 xl-custom:pr-[300px] relative z-20">
        {/* PC: Contenedor sin tarjeta */}
        <div className="hidden xl-custom:flex xl-custom:w-[380px] flex-col justify-center items-center gap-5">
          <ForgotPasswordFormContent
            email={email}
            setEmail={setEmail}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            success={success}
            variant="desktop"
            recaptchaFailed={recaptchaFailed}
            recaptchaError={recaptchaError}
            allowSkip={allowSkip}
            onSkipRecaptcha={skipRecaptcha}
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
            <ForgotPasswordFormContent
              email={email}
              setEmail={setEmail}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              success={success}
              variant="tablet"
              recaptchaFailed={recaptchaFailed}
              recaptchaError={recaptchaError}
              allowSkip={allowSkip}
              onSkipRecaptcha={skipRecaptcha}
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
            <ForgotPasswordFormContent
              email={email}
              setEmail={setEmail}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              success={success}
              variant="mobile"
              recaptchaFailed={recaptchaFailed}
              recaptchaError={recaptchaError}
              allowSkip={allowSkip}
              onSkipRecaptcha={skipRecaptcha}
            />
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <AuthFooter />
    </div>
  );
};

export default ForgotPasswordView;
