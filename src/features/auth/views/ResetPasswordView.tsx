/**
 * Vista de Restablecimiento de Contraseña - Sociograma UTP
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordFormContent } from '../components/ResetPasswordFormContent';
import { validatePasswordRequirements } from '../../../core/utils/passwordStrength';

export const ResetPasswordView = () => {
  // Estado local para los inputs
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(4);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Token que vendrá en la URL

  // Countdown cuando hay éxito
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
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

    // Validar que exista el token
    if (!token) {
      setError('Token de recuperación no válido o expirado');
      return;
    }

    try {
      setIsLoading(true);
      console.log('✓ Intentando restablecer contraseña...');

      // TODO: Aquí iría la llamada al servicio de restablecimiento de contraseña
      // await resetPasswordService({ token, password });

      // Simulación de envío (temporal)
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('✓ Contraseña restablecida exitosamente');
      setSuccess('Contraseña restablecida exitosamente.');

      // Limpiar campos
      setPassword('');
      setConfirmPassword('');

    } catch (err) {
      console.error('✗ Error al restablecer contraseña:', err);
      setError('Ocurrió un error al restablecer tu contraseña. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col relative bg-[#FEFEFF] overflow-hidden">
      {/* Media Query personalizada para breakpoint en 1660px */}
      <style>
        {`
          @media (min-width: 1660px) {
            .xl-custom\\:block { display: block !important; }
            .xl-custom\\:hidden { display: none !important; }
            .xl-custom\\:flex { display: flex !important; }
            .xl-custom\\:justify-end { justify-content: flex-end !important; }
            .xl-custom\\:pr-\\[400px\\] { padding-right: 400px !important; }
            .xl-custom\\:w-\\[480px\\] { width: 480px !important; }
            .xl-custom\\:w-\\[218px\\] { width: 218px !important; }
            .xl-custom\\:h-\\[218px\\] { height: 218px !important; }
            .xl-custom\\:right-\\[calc\\(50\\%-424px\\)\\] { right: calc(50% - 424px) !important; }
            .xl-custom\\:-top-\\[110px\\] { top: -110px !important; }
            .xl-custom\\:w-\\[430px\\] { width: 430px !important; }
            .xl-custom\\:h-\\[430px\\] { height: 430px !important; }
            .xl-custom\\:-right-\\[120px\\] { right: -120px !important; }
            .xl-custom\\:-bottom-\\[100px\\] { bottom: -100px !important; }
          }
        `}
      </style>

      {/* ========== CÍRCULOS DECORATIVOS ========== */}

      {/* Círculo grande izquierdo - PC */}
      <div
        className="hidden xl-custom:block absolute w-[940px] h-[940px] -left-[187px] -top-[264px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo medio rotado - PC */}
      <div
        className="hidden xl-custom:block absolute w-[748px] h-[757px] left-[100px] top-[248px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(54deg)',
          transformOrigin: 'top left',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo inferior derecho */}
      <div
        className="absolute rounded-full pointer-events-none
          w-[400px] h-[400px] -right-[200px] -bottom-[200px]
          md:w-[500px] md:h-[500px] md:-right-[250px] md:-bottom-[250px]
          xl-custom:w-[430px] xl-custom:h-[430px] xl-custom:-right-[120px] xl-custom:-bottom-[100px]"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(8deg)',
          transformOrigin: 'center',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.50)'
        }}
      />

      {/* Círculo superior derecho */}
      <div
        className="absolute rounded-full pointer-events-none
          w-[180px] h-[180px] right-[calc(50%-280px)] -top-[90px]
          md:w-[200px] md:h-[200px] md:right-[calc(50%-200px)] md:-top-[100px]
          xl-custom:w-[218px] xl-custom:h-[218px] xl-custom:right-[calc(50%-424px)] xl-custom:-top-[110px]"
        style={{
          background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9',
          transform: 'rotate(12deg)',
          transformOrigin: 'center',
          boxShadow: '0px 4px 50px rgba(0, 0, 0, 0.20)'
        }}
      />

      {/* Círculo izquierdo - Tablet y Mobile */}
      <div
        className="block xl-custom:hidden absolute w-[700px] h-[700px] -left-[500px] top-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%), #D9D9D9' }}
      />

      {/* ========== LOGO UTP - PC ========== */}
      <div className="hidden xl-custom:block absolute w-[348px] h-[348px] left-[236px] top-[90px] pointer-events-none z-10">
        <img
          src="/Logo_UTP.png"
          alt="Universidad Tecnológica de Puebla"
          className="w-full h-full object-contain drop-shadow-[0_1px_50px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* ========== CONTENEDOR PRINCIPAL ========== */}
      <div className="flex-1 flex items-center justify-center xl-custom:justify-end pr-0 xl-custom:pr-[400px] relative z-20">
        {/* PC: Contenedor sin tarjeta */}
        <div className="hidden xl-custom:flex xl-custom:w-[480px] flex-col justify-center items-center gap-6">
          <ResetPasswordFormContent
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
          className="hidden md:flex xl-custom:hidden w-full max-w-[600px] px-8 py-16 rounded-xl backdrop-blur-[50px]"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(15, 126, 60, 0.50)',
          }}
        >
          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            <ResetPasswordFormContent
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
          className="flex md:hidden w-full max-w-[400px] px-6 py-20 rounded-2xl backdrop-blur-[50px]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(15, 126, 60, 0.50)',
          }}
        >
          <div className="w-full flex flex-col justify-start items-center gap-5">
            <ResetPasswordFormContent
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

      <div className="absolute bottom-0 left-0 right-0 text-center text-[#313131] font-['Roboto'] font-bold py-3 text-sm md:text-sm lg:text-base z-20 [text-stroke:2px_white] [-webkit-text-stroke:0.2px_white]">
        © 2017 - 2026, Universidad Tecnológica de Puebla
      </div>
    </div>
  );
};
