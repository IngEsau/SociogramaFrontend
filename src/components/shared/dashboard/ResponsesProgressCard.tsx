/**
 * Card de progreso de respuestas.
 * Colores del medidor segun porcentaje:
 * - 0%: gris
 * - 1-25%: rojo oscuro
 * - 26-50%: naranja/marron
 * - 51-75%: amarillo/oliva
 * - 76-99%: verde
 * - 100%: verde con efecto neon
 */

import openEyeIcon from '../../../core/assets/open-eye-icon.svg';
import closeEyeIcon from '../../../core/assets/close-eye-icon.svg';

interface ResponsesProgressCardProps {
  total?: number;
  completed?: number;
  className?: string;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getProgressColors(percentage: number): {
  active: string;
  track: string;
  bg: string;
  border: string;
  glow: boolean;
} {
  if (percentage === 0) {
    return { active: '#B0B0B0', track: '#E0DEDE', bg: '#F0EDED', border: '#E0DEDE', glow: false };
  }
  if (percentage <= 25) {
    return { active: '#7A1501', track: '#EAD9D7', bg: '#F7F3F2', border: '#EAD9D7', glow: false };
  }
  if (percentage <= 50) {
    return { active: '#8B6914', track: '#EDE5D3', bg: '#F7F5EE', border: '#EDE5D3', glow: false };
  }
  if (percentage <= 75) {
    return { active: '#9B8A1A', track: '#ECE9D5', bg: '#F6F5EE', border: '#ECE9D5', glow: false };
  }
  if (percentage < 100) {
    return { active: '#0F7E3C', track: '#D4EDE0', bg: '#EEF8F2', border: '#D4EDE0', glow: false };
  }
  // 100% - verde con efecto neon
  return { active: '#0F7E3C', track: '#D4EDE0', bg: '#EEF8F2', border: '#D4EDE0', glow: true };
}

export function ResponsesProgressCard({
  total = 0,
  completed = 0,
  className = '',
  onToggleVisibility,
  isVisible = true,
}: ResponsesProgressCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  // Cuando no es visible, mostramos 0 para no inferir el porcentaje real
  const displayPercentage = isVisible ? clamp(percentage, 0, 100) : 0;
  const safePercentage = clamp(percentage, 0, 100);
  const progressAngle = displayPercentage * 3.6;
  const colors = getProgressColors(isVisible ? safePercentage : 0);

  const noResponses = completed === 0;
  const hasData = total > 0 && completed > 0;

  return (
    <div className={`rounded-xl border border-emerald-600/35 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <h3 className="font-lato text-2xl leading-tight font-extrabold text-(--verde-utp)">
          Total de respuestas
        </h3>
        {hasData && onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? 'Ocultar progreso' : 'Mostrar progreso'}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 transition-colors shrink-0 ml-2"
          >
            <img
              src={isVisible ? openEyeIcon : closeEyeIcon}
              alt=""
              width={18}
              height={18}
              aria-hidden
            />
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center pb-2">
        <div
          className="relative h-36 w-36 rounded-full p-3 transition-all duration-300"
          style={{
            background: `conic-gradient(${colors.active} ${progressAngle}deg, ${colors.track} ${progressAngle}deg 360deg)`,
            ...(colors.glow && isVisible ? {
              boxShadow: `0 0 18px 4px rgba(15, 126, 60, 0.35), 0 0 40px 8px rgba(15, 126, 60, 0.15)`,
            } : {}),
            ...(!isVisible ? { filter: 'blur(7px)', userSelect: 'none', pointerEvents: 'none' } : {}),
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="text-center">
              <p className="font-lato text-2xl font-extrabold text-[#222]">{displayPercentage}%</p>
              <p className="font-lato text-sm text-gray-600">Progreso</p>
            </div>
          </div>
        </div>
      </div>

      {noResponses && (
        <p className="mt-2 text-center text-sm text-gray-400">
          Aun no se han registrado respuestas.
        </p>
      )}
    </div>
  );
}

