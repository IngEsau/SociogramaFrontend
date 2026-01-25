/**
 * Contenido del formulario de Login
 * Componente específico para la autenticación
 */

import { AccountIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../../components/ui';

interface LoginFormContentProps {
  matricula: string;
  setMatricula: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  variant: 'desktop' | 'tablet' | 'mobile';
}

export const LoginFormContent = ({
  matricula,
  setMatricula,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleSubmit,
  isLoading,
  error,
  variant,
}: LoginFormContentProps) => {
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
          ${isMobile ? 'text-3xl' : 'text-6xl'}`}
      >
        Sociograma UTP
      </h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {/* Campo Matrícula */}
        <div className="flex flex-col gap-1">
          <label className={`text-[#0F7E3C] text-base font-['Roboto']
            ${isMobile ? 'text-3xl' : 'text-xl'}`}>
            Matrícula
          </label>
          <div className="w-full h-11 px-4 bg-[#245C52] rounded-full flex items-center gap-2">
            <AccountIcon />
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="UTP0000000"
              className={`flex-1 bg-transparent text-white placeholder:text-white/50 outline-none font-['Roboto']
                ${isMobile ? 'text-xs' : 'text-base'}`}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div className="flex flex-col gap-1">
          <label className={`text-[#0F7E3C] text-base font-['Roboto']
            ${isMobile ? 'text-3xl' : 'text-xl'}`}>
            Contraseña
          </label>
          <div className="w-full h-11 px-4 bg-[#245C52] rounded-full flex items-center gap-2 relative">
            <LockIcon />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="*************"
              className={`flex-1 bg-transparent text-white placeholder:text-white/50 outline-none font-['Roboto'] pr-8
                ${isMobile ? 'text-xs' : 'text-base'}`}
              required
              disabled={isLoading}
            />
            <div className="absolute right-4">
              {showPassword ? (
                <EyeIcon onClick={() => setShowPassword(false)} />
              ) : (
                <EyeOffIcon onClick={() => setShowPassword(true)} />
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-[#7A1501] text-sm font-['Roboto'] text-center bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Link olvidaste contraseña */}
        <a
          href="#"
          className="text-center text-[#7A1501] text-sm md:text-lg font-['Roboto'] font-bold underline hover:text-[#5a1001] transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          ¿Olvidaste tu contraseña?
        </a>

        {/* reCAPTCHA */}
        <div className="flex justify-center w-full">
          <div className="g-recaptcha"></div>
        </div>

        {/* Botón Acceder */}
        <button
          type="submit"
          disabled={isLoading}
          className="mx-auto w-36 max-w-[216px] min-h-[44px] px-4 py-2 bg-[#0F7E3C] rounded-lg flex justify-center items-center hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-center text-[#FEFEFF] text-base font-['Roboto'] font-medium">
            {isLoading ? 'Cargando...' : 'Acceder'}
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
