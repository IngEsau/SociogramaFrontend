/**
 * Vista de Login - Sociograma UTP
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store';
import { LoginFormContent } from '../components';

// Declaración global para recaptcha
declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, params: { sitekey: string; theme?: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

export const LoginView = () => {
  // Estado local para los inputs
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  // Estado global de autenticación (Zustand)
  const { login, isLoading, error, clearError, user } = useAuthStore();

  // Renderizar reCAPTCHA cuando el script se cargue
  useEffect(() => {
    const renderRecaptcha = () => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function' && !recaptchaLoaded) {
        try {
          const containers = document.querySelectorAll('.g-recaptcha');
          containers.forEach((container) => {
            if (container.children.length === 0) {
              window.grecaptcha.render(container as HTMLElement, {
                sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc4Kv0qAAAAABXjYcI59V4hgRCGeos-m9q-dwq1',
                theme: 'light',
              });
            }
          });
          setRecaptchaLoaded(true);
        } catch (error) {
          console.error('Error renderizando reCAPTCHA:', error);
        }
      }
    };

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      renderRecaptcha();
    }

    const interval = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function' && !recaptchaLoaded) {
        renderRecaptcha();
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!recaptchaLoaded) {
        console.error('reCAPTCHA no se pudo cargar después de 10 segundos');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [recaptchaLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const recaptchaResponse = window.grecaptcha?.getResponse();

    if (!recaptchaResponse) {
      console.error('Por favor completa el reCAPTCHA');
      alert('Por favor completa el reCAPTCHA');
      return;
    }

    try {
      console.log('✓ reCAPTCHA token obtenido exitosamente');
      await login({
        username: matricula,
        password: password,
        recaptcha_token: recaptchaResponse,
      });
      console.log('✓ Login exitoso!');
    } catch (err) {
      console.error('✗ Error de login:', err);
      window.grecaptcha?.reset();
    }
  };

  // Si ya está autenticado, mostrar mensaje temporal
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center border border-[#0F7E3C]/20">
          <h2 className="text-2xl font-bold text-[#0F7E3C] mb-4 font-['Lato']">
            ¡Bienvenido, {user.first_name}!
          </h2>
          <p className="text-[#313131] mb-2 font-['Roboto']">Rol: {user.rol}</p>
          <p className="text-[#313131] mb-4 font-['Roboto']">Email: {user.email}</p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="bg-[#7A1501] text-white px-6 py-2 rounded-lg hover:bg-[#5a1001] transition-colors font-['Roboto'] font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

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
            />
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-[#313131] font-['Roboto'] font-bold py-3 text-sm md:text-sm lg:text-base z-20 [text-stroke:2px_white] [-webkit-text-stroke:0.2px_white]">
        © 2017 - 2026, Universidad Tecnológica de Puebla
      </div>
    </div>
  );
};

export default LoginView;
