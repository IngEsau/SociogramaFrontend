/**
 * Contenido del formulario de Recuperación de Contraseña
 * Componente específico para solicitar recuperación de contraseña
 */

import { Link } from 'react-router-dom';
import { AccountIcon } from '../../../components/ui';

interface ForgotPasswordFormContentProps {
  email: string;
  setEmail: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  variant: 'desktop' | 'tablet' | 'mobile';
  recaptchaError?: string | null;
  recaptchaFailed?: boolean;
  allowSkip?: boolean;
  onSkipRecaptcha?: () => void;
}

export const ForgotPasswordFormContent = ({
  email,
  setEmail,
  handleSubmit,
  isLoading,
  error,
  success,
  variant,
  recaptchaError,
  recaptchaFailed,
  allowSkip,
  onSkipRecaptcha,
}: ForgotPasswordFormContentProps) => {
  const isMobile = variant === 'mobile';
  const isDesktop = variant === 'desktop';

  return (
    <>
      {/* Logo - Tablet y Mobile */}
      {!isDesktop && (
        <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-40 h-40'}`}>
          <img
            src="/Logo_UTP.png"
            alt="Universidad Tecnológica de Puebla"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Título */}
      <h1
        className={`text-center text-[#0F7E3C] font-['Lato'] font-bold leading-tight
          ${isMobile ? 'text-2xl' : 'text-5xl'}`}
      >
        Recuperar Contraseña
      </h1>

      {/* Subtítulo */}
      <p
        className={`text-center text-[#313131] font-['Roboto'] leading-relaxed
          ${isMobile ? 'text-sm' : 'text-lg'}`}
      >
        Ingresa tu correo académico y te enviaremos un enlace de recuperación si existe una cuenta asociada.
      </p>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {/* Campo Email */}
        <div className="flex flex-col gap-1">
          <label className={`text-[#0F7E3C] text-base font-['Roboto']
            ${isMobile ? 'text-3xl' : 'text-xl'}`}>
            Correo Académico
          </label>
          <div className="w-full h-11 px-4 bg-[#245C52] rounded-full flex items-center gap-2">
            <AccountIcon />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="utpxxxxxxx@utpuebla.edu.mx"
              className={`flex-1 bg-transparent text-white placeholder:text-white/50 outline-none font-['Roboto']
                ${isMobile ? 'text-xs' : 'text-base'}`}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-[#7A1501] text-sm font-['Roboto'] text-center bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="text-[#0F7E3C] text-sm font-['Roboto'] text-center bg-green-50 p-2 rounded-lg">
            {success}
          </div>
        )}

        {/* Link volver a login */}
        <Link
          to="/login"
          className="text-center text-[#7A1501] text-sm md:text-lg font-['Roboto'] font-bold underline hover:text-[#5a1001] transition-colors"
        >
          Volver al inicio de sesión
        </Link>

        {/* reCAPTCHA */}
        <div className="flex flex-col justify-center w-full gap-2">
          <div className="g-recaptcha flex justify-center"></div>

          {/* Mensaje de reCAPTCHA fallido */}
          {(recaptchaFailed || recaptchaError) && !allowSkip && (
            <div className="flex flex-col gap-2">
              <div className="text-orange-600 text-xs font-['Roboto'] text-center bg-orange-50 p-2 rounded-lg border border-orange-200">
                {recaptchaError || 'El reCAPTCHA presenta problemas'}
              </div>
              {onSkipRecaptcha && (
                <button
                  type="button"
                  onClick={onSkipRecaptcha}
                  className="text-xs text-[#0F7E3C] font-['Roboto'] font-bold underline hover:text-[#0a6630] transition-colors"
                >
                  Continuar sin reCAPTCHA (solo desarrollo)
                </button>
              )}
            </div>
          )}

          {/* Mensaje de validación saltada */}
          {allowSkip && (
            <div className="text-green-600 text-xs font-['Roboto'] text-center bg-green-50 p-2 rounded-lg border border-green-200">
              ✓ Validación de reCAPTCHA omitida
            </div>
          )}
        </div>

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={isLoading}
          className="mx-auto w-auto max-w-[280px] min-h-[44px] px-6 py-2 bg-[#0F7E3C] rounded-lg flex justify-center items-center hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-center text-[#FEFEFF] text-base font-['Roboto'] font-medium">
            {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </span>
        </button>
      </form>

      {/* Logo Comité de Tutorías */}
      <div className={`relative ${isMobile ? 'w-32 h-auto' : 'w-52 h-auto'}`}>
        <img
          src="/Logo_Comite.png"
          alt="Comité de Tutorías UTP"
          className="w-full h-auto object-contain"
        />
      </div>
    </>
  );
};
