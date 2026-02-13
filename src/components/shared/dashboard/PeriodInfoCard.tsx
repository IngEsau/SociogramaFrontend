/**
 * Componente de información del periodo
 * Muestra detalles del periodo actual con estadísticas de sociogramas
 */

import { Trash2 } from 'lucide-react';

interface PeriodInfoCardProps {
  periodName?: string;
  totalStudents?: number;
  completedSociograms?: number;
  totalSociograms?: number;
  onConfigure?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PeriodInfoCard({
  periodName = 'septiembre - diciembre',
  totalStudents = 0,
  completedSociograms = 0,
  totalSociograms = 0,
  onConfigure,
  onDelete,
  className = '',
}: PeriodInfoCardProps) {
  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-green-700 mb-3 sm:mb-4 leading-tight">
        Sociogramas del periodo: <span className="text-green-700">{periodName}</span>
      </h2>

      <div className="space-y-2 mb-4 sm:mb-5">
        <p className="text-xs sm:text-sm text-gray-700">
          Número de alumnos por periodo:{' '}
          <span className="font-semibold text-green-600">{totalStudents}</span>
        </p>
        <p className="text-xs sm:text-sm text-gray-700">
          Número de sociogramas contestados:{' '}
          <span className="font-semibold text-green-600">
            {completedSociograms}/{totalSociograms}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={onConfigure}
          className="bg-[#0B5A4A] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium hover:bg-[#0B5A4A]/90 transition-colors"
        >
          Configurar
        </button>
        <button
          onClick={onDelete}
          className="bg-red-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5 sm:gap-2"
        >
          Eliminar <Trash2 size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
