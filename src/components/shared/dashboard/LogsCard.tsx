/**
 * Componente de Logs del sistema
 * Muestra los registros de actividad del sistema con opciones de copiar y expandir
 */

import { Copy, Maximize2 } from 'lucide-react';

interface LogEntry {
  id: number | string;
  timestamp: string;
  action: string;
  user?: string;
  level?: 'info' | 'warning' | 'error';
  details?: string;
}

interface LogsCardProps {
  logs?: LogEntry[];
  title?: string;
  className?: string;
  onCopy?: () => void;
  onExpand?: () => void;
}

export function LogsCard({
  logs = [],
  title = 'Logs',
  className = '',
  onCopy,
  onExpand,
}: LogsCardProps) {
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      // Copiar logs al portapapeles
      const logText = logs
        .map((log) => `[${log.timestamp}] ${log.action}`)
        .join('\n');
      navigator.clipboard.writeText(logText);
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col h-full ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold text-green-700 mb-3 leading-tight">{title}</h2>

      {/* Área de logs */}
      <div className="flex-1 min-h-[150px] sm:min-h-[200px] lg:min-h-[280px] overflow-auto mb-3">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs sm:text-sm text-gray-400">No hay logs disponibles</p>
          </div>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {logs.map((log) => (
              <li key={log.id} className={`${getLevelColor(log.level)}`}>
                <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                {log.user && <span className="font-medium">{log.user}: </span>}
                {log.action}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controles */}
      <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Copiar logs"
          title="Copiar logs"
        >
          <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <button
          onClick={onExpand}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Expandir"
          title="Expandir"
        >
          <Maximize2 size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>
    </div>
  );
}
