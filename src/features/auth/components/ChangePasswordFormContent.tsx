/**
 * Contenido del formulario de Cambio de Contraseña Obligatorio
 * Componente para el primer inicio de sesión
 */

import { LockIcon } from '../../../components/ui';
import { evaluatePasswordStrength, validatePasswordRequirements } from '../../../core/utils/passwordStrength';
import { useState } from 'react';

interface ChangePasswordFormContentProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  variant: 'desktop' | 'tablet' | 'mobile';
  countdown?: number;
}

export const ChangePasswordFormContent = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleSubmit,
  isLoading,
  error,
  success,
  variant,
  countdown,
}: ChangePasswordFormContentProps) => {
  const isMobile = variant === 'mobile';
  const isDesktop = variant === 'desktop';

  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      {/* Logo - Tablet y Mobile */}
      {!isDesktop && (
        <div className={`relative ${isMobile ? 'w-20 h-20' : 'w-28 h-28'}`}>
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
        Cambiar Contraseña
      </h1>

      {/* Subtítulo - Se oculta cuando hay éxito */}
      {!success && (
        <>
          {/* Alerta de primer inicio de sesión */}
          <div className={`w-full p-3 bg-amber-50 border border-amber-300 rounded-lg
            ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <p className="text-amber-800 font-['Roboto'] font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
            </p>
          </div>

          <p
            className={`text-center text-[#313131] font-['Roboto'] leading-relaxed font-medium
              ${isMobile ? 'text-xs' : 'text-base'}`}
          >
            Crea una contraseña segura con al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales.
          </p>
        </>
      )}

      {/* Formulario */}
      {!success ? (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Campo Nueva Contraseña */}
          <div className="flex flex-col gap-1">
            <label className={`text-[#0F7E3C] font-['Roboto'] font-medium
              ${isMobile ? 'text-sm' : 'text-base'}`}>
              Nueva Contraseña
            </label>
            <div className="w-full h-10 px-3 bg-[#245C52] rounded-full flex items-center gap-2">
              <LockIcon />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className={`flex-1 bg-transparent text-white placeholder:text-white/50 outline-none font-['Roboto']
                  ${isMobile ? 'text-xs' : 'text-sm'}`}
                required
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Medidor de Seguridad de Contraseña */}
            {password && (
              <div className="w-full mt-3">
                {(() => {
                  const strength = evaluatePasswordStrength(password);
                  return (
                    <>
                      {/* Barra de progreso */}
                      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
                        <div
                          style={{
                            width: `${strength.score}%`,
                            background: strength.color,
                            height: '100%',
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                          }}
                        />
                      </div>

                      {/* Etiqueta y puntuación */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs md:text-sm text-[#0F7E3C] font-['Roboto']">
                          Seguridad: <strong style={{ color: strength.color }}>{strength.label}</strong>
                        </span>
                        <span className="text-xs md:text-sm text-[#313131] font-['Roboto']">
                          {strength.score}%
                        </span>
                      </div>

                      {/* Sugerencias de mejora */}
                      {strength.feedback.length > 0 && (
                        <div className="text-xs text-[#7A1501] bg-red-50 p-2 rounded border border-red-200">
                          <ul className="list-disc pl-4 space-y-1">
                            {strength.feedback.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Campo Confirmar Contraseña */}
          <div className="flex flex-col gap-1">
            <label className={`text-[#0F7E3C] font-['Roboto'] font-medium
              ${isMobile ? 'text-sm' : 'text-base'}`}>
              Confirmar Contraseña
            </label>
            <div className="w-full h-10 px-3 bg-[#245C52] rounded-full flex items-center gap-2">
              <LockIcon />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className={`flex-1 bg-transparent text-white placeholder:text-white/50 outline-none font-['Roboto']
                  ${isMobile ? 'text-xs' : 'text-sm'}`}
                required
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-[#7A1501] text-sm font-['Roboto'] bg-red-50 p-3 rounded-lg border border-red-300 whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Botón Cambiar Contraseña */}
          <button
            type="submit"
            disabled={isLoading || !validatePasswordRequirements(password).allMet}
            className="mx-auto w-auto max-w-[220px] min-h-[40px] px-4 py-2 bg-[#0F7E3C] rounded-lg flex justify-center items-center hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-center text-[#FEFEFF] text-sm font-['Roboto'] font-medium">
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </span>
          </button>
        </form>
      ) : (
        <div className="w-full flex flex-col items-center gap-6">
          {/* Success Message */}
          <div className="text-[#0F7E3C] text-sm md:text-base font-['Roboto'] text-center bg-green-50 p-4 rounded-lg border-2 border-[#0F7E3C]">
            <p className="font-bold mb-2">✓ ¡Éxito!</p>
            <p>Tu contraseña ha sido actualizada correctamente.</p>
            <p className="mt-3 text-lg font-bold">Redirigiendo al dashboard en {countdown} segundos...</p>
          </div>
        </div>
      )}

      {/* Logo Comité de Tutorías */}
      <div className={`relative ${isMobile ? 'w-24 h-auto' : 'w-36 h-auto'}`}>
        <img
          src="/Logo_Comite.png"
          alt="Comité de Tutorías UTP"
          className="w-full h-auto object-contain"
        />
      </div>
    </>
  );
};
