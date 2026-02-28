/**
 * Componente de clasificacion
 * Muestra el ranking de estudiantes por puntaje
 */

import openEyeIcon from '../../../core/assets/open-eye-icon.svg';
import closeEyeIcon from '../../../core/assets/close-eye-icon.svg';

interface ClassificationItem {
  name: string;
  score: number;
  id?: string;
}

interface ClassificationCardProps {
  className?: string;
  title?: string;
  subtitle?: string;
  items?: ClassificationItem[];
  emptyMessage?: string;
  onFilterClick?: () => void;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
}

export function ClassificationCard({
  className = "",
  title = "Clasificacion",
  subtitle = "1. ¿A quien elegirias para...?",
  items,
  emptyMessage = "Aun no se ha contestado ningun formulario.",
  onFilterClick,
  onToggleVisibility,
  isVisible = true,
}: ClassificationCardProps) {
  const hasItems = items && items.length > 0;

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      {/* header */}
      <div className="shrink-0 flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-lato text-2xl font-extrabold text-(--verde-utp)">
            {title}
          </h3>
          {hasItems && (
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-400 truncate">{subtitle}</p>
              {onFilterClick && (
                <button
                  type="button"
                  onClick={onFilterClick}
                  title="Seleccionar pregunta"
                  className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-(--verde-utp) transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {hasItems && onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? 'Ocultar clasificacion' : 'Mostrar clasificacion'}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 transition-colors ml-2 shrink-0"
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

      {hasItems ? (
        <>
          <div className="mt-4 text-xs flex justify-between shrink-0">
            <span className="font-semibold text-gray-700">Nombre completo</span>
            <span className="font-semibold text-gray-700">Puntaje</span>
          </div>

          <ul
            className="mt-2 space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 transition-all duration-300"
            style={!isVisible ? { filter: 'blur(10px)', userSelect: 'none', pointerEvents: 'none' } : undefined}
          >
            {items.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="truncate max-w-57.5">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>
                  <span className="font-medium text-gray-800">{r.name}</span>
                  {r.id && <div className="text-xs text-gray-400 ml-5">{r.id}</div>}
                </div>
                <span className="text-gray-500 shrink-0">{r.score} pts</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center min-h-0">
          <p className="text-sm text-gray-400 text-center">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
