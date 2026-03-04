/**
 * Componente de clasificacion
 * Muestra el ranking de estudiantes por puntaje con selector de preguntas
 */

import { useState, useRef, useEffect } from 'react';
import openEyeIcon from '../../../core/assets/open-eye-icon.svg';
import closeEyeIcon from '../../../core/assets/close-eye-icon.svg';

interface ClassificationItem {
  name: string;
  score: number;
  id?: string;
}

interface PreguntaOption {
  id: number;
  label: string;
}

interface ClassificationCardProps {
  className?: string;
  title?: string;
  subtitle?: string;
  items?: ClassificationItem[];
  emptyMessage?: string;
  /** @deprecated Usa preguntaOptions + onPreguntaChange en su lugar */
  onFilterClick?: () => void;
  preguntaOptions?: PreguntaOption[];
  selectedPreguntaId?: number | null;
  onPreguntaChange?: (preguntaId: number) => void;
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
  preguntaOptions,
  selectedPreguntaId,
  onPreguntaChange,
  onToggleVisibility,
  isVisible = true,
}: ClassificationCardProps) {
  const hasItems = items && items.length > 0;
  const hasPreguntaSelector = preguntaOptions && preguntaOptions.length > 1 && onPreguntaChange;
  const hasLegacyFilter = !hasPreguntaSelector && onFilterClick;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      {/* header: titulo + ojo en la misma fila */}
      <div className="shrink-0 flex items-center justify-between">
        <h3 className="font-lato text-2xl font-extrabold text-(--verde-utp)">
          {title}
        </h3>
        {hasItems && onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? 'Ocultar clasificacion' : 'Mostrar clasificacion'}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 transition-colors shrink-0"
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

      {/* subtitulo de pregunta + icono selector: fila independiente con ancho completo */}
      {hasItems && (
        <div className="shrink-0 flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-400 truncate flex-1 min-w-0" title={subtitle}>{subtitle}</p>
          {hasPreguntaSelector && (
            <div className="relative shrink-0" ref={dropdownRef} style={{ width: '28px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                title="Seleccionar pregunta"
                className="flex h-5 w-5 items-center justify-center rounded text-(--verde-utp) hover:bg-emerald-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-64 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {preguntaOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onPreguntaChange(opt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-emerald-50 ${
                        opt.id === selectedPreguntaId
                          ? 'bg-emerald-50 text-(--verde-utp) font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {hasLegacyFilter && (
            <button
              type="button"
              onClick={onFilterClick}
              title="Cambiar pregunta"
              className="flex h-5 w-5 items-center justify-center rounded text-(--verde-utp) hover:bg-emerald-50 transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          )}
        </div>
      )}

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
