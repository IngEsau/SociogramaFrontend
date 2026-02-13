/**
 * Componente de vista previa de datos
 * Muestra un placeholder cuando no hay datos, o una tabla cuando sí los hay
 */

import { Database, Settings } from 'lucide-react';

interface DataItem {
  id: string | number;
  [key: string]: unknown;
}

interface DataPreviewCardProps {
  data?: DataItem[];
  emptyMessage?: string;
  title?: string;
  className?: string;
}

export function DataPreviewCard({
  data = [],
  emptyMessage = 'Aún no hay nada que mostrar',
  title,
  className = '',
}: DataPreviewCardProps) {
  const hasData = data.length > 0;

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-4 leading-tight">{title}</h3>
      )}

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
          {/* Ilustración de base de datos vacía */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <Database 
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-300" 
                strokeWidth={1.5}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0">
              <div className="bg-gray-200 rounded-full p-1.5 sm:p-2">
                <Settings 
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" 
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Aquí iría una tabla con los datos - por ahora solo placeholder */}
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-xs sm:text-sm text-gray-500">{data.length} registros cargados</p>
          </div>
        </div>
      )}
    </div>
  );
}
