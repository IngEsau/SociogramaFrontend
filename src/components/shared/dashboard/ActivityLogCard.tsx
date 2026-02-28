/**
 * Componente de registro de actividades
 * Muestra las actividades recientes de los usuarios
 */

import { useState } from 'react';
import openEyeIcon from '../../../core/assets/open-eye-icon.svg';
import closeEyeIcon from '../../../core/assets/close-eye-icon.svg';

interface ActivityItem {
  name: string;
  action: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  approxMinutes?: number | null;
}

interface ActivityLogCardProps {
  items?: ActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export function ActivityLogCard({
  items,
  emptyMessage = 'Aun no se ha contestado ningun formulario.',
  className = '',
}: ActivityLogCardProps) {
  const hasItems = items && items.length > 0;
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      <div className="shrink-0 flex items-center justify-between mb-3">
        <h2 className="font-lato text-2xl font-extrabold text-(--verde-utp)">
          Registro de actividades
        </h2>
        {hasItems && (
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            title={isVisible ? 'Ocultar registro' : 'Mostrar registro'}
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

      {hasItems ? (
        <ul
          className="space-y-2 text-sm text-gray-700 overflow-y-auto flex-1 min-h-0 pr-1 transition-all duration-300"
          style={!isVisible ? { filter: 'blur(8px)', userSelect: 'none', pointerEvents: 'none' } : undefined}
        >
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-gray-400 shrink-0">•</span>
              <div className="min-w-0">
                <span className="font-semibold">{it.name}</span> {it.action}{' '}
                {it.time && <span className="text-black/48">{it.time}</span>}

                {(it.startDate || it.endDate || typeof it.approxMinutes === 'number') && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {it.startDate && (
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                        Fecha inicio: {it.startDate}
                      </span>
                    )}
                    {it.endDate && (
                      <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5">
                        Fecha fin: {it.endDate}
                      </span>
                    )}
                    {typeof it.approxMinutes === 'number' && (
                      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5">
                        ~{it.approxMinutes} min aprox
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center min-h-0">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
