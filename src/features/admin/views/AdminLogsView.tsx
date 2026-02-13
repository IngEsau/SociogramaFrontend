/**
 * Vista de Registro del Sistema - Admin
 *
 * Muestra el historial de actividad del sistema con filtros por división,
 * carrera y grupo. Permite exportar los logs en formato .log.
 * Incluye toggle de modo oscuro solo para la sección de logs.
 *
 * Configura el Topbar dinámicamente: muestra "Último registro" y "Exportar .log"
 * en lugar de los selectores por defecto.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Loader2, Moon, Sun } from 'lucide-react';
import { useTopbarStore } from '../../../store';
// TODO: Descomentar cuando el endpoint /admin/logs/ esté disponible
// import { adminService } from '../services';
import type { SystemLog } from '../types';

/** Estructura de los filtros jerárquicos */
interface FilterState {
  division: string;
  carrera: string;
  grupo: string;
}

/** Opciones mock para los selectores (se reemplazarán por datos del backend) */
const DIVISIONES = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Electromecánica',
  'Ciencias Económico Administrativas',
];

/** Formato de fecha legible para logs */
function formatLogDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} a ${day} del ${month} del ${year}`;
  } catch {
    return timestamp;
  }
}

/** Formato corto de fecha para el botón de último registro */
function formatShortDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return timestamp;
  }
}

/** Extrae la palabra clave de acción del log para resaltarla en negrita */
function parseLogAction(action: string): { before: string; keyword: string; after: string } | null {
  const keywords = ['inicio sesion', 'comenzado', 'finalizado', 'cerrado sesion', 'creado', 'eliminado', 'modificado', 'importado'];
  for (const kw of keywords) {
    const idx = action.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      return {
        before: action.slice(0, idx),
        keyword: action.slice(idx, idx + kw.length),
        after: action.slice(idx + kw.length),
      };
    }
  }
  return null;
}

export function AdminLogsView() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    division: '',
    carrera: '',
    grupo: '',
  });

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  // Exportar logs como archivo .log
  const handleExport = useCallback(() => {
    if (logs.length === 0) return;

    const content = logs
      .map((log) => `[${log.timestamp}] ${log.user}: ${log.action}${log.details ? ` | ${log.details}` : ''}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro_sistema_${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [logs]);

  // Cargar logs del sistema
  // NOTA: El endpoint GET /admin/logs/ aún no está disponible en el backend.
  // Se usan datos mock mientras tanto. Cuando el endpoint esté listo,
  // descomentar la petición real y eliminar el fallback.
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Descomentar cuando el endpoint /admin/logs/ esté disponible
      // const data = await adminService.getSystemLogs();
      // setLogs(data);

      // Mock temporal: simular carga con un pequeño delay
      await new Promise((r) => setTimeout(r, 400));
      setLogs(generateMockLogs());
    } catch {
      setLogs(generateMockLogs());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Configurar el Topbar dinámico al montar, restaurar al desmontar
  const lastLogDate = logs.length > 0 ? formatShortDate(logs[0].timestamp) : '--/--/----';

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      infoText: `Último registro: ${lastLogDate}`,
      actions: [
        {
          id: 'export-log',
          label: 'Exportar .log',
          icon: 'download',
          variant: 'primary',
          onClick: handleExport,
          disabled: logs.length === 0,
        },
      ],
      mobileAction: {
        id: 'export-log-mobile',
        label: 'Exportar .log',
        icon: 'download',
        variant: 'primary',
        onClick: handleExport,
        disabled: logs.length === 0,
      },
    });
  }, [lastLogDate, logs.length, handleExport, setTopbarConfig]);

  // Restaurar topbar al desmontar
  useEffect(() => {
    return () => resetTopbar();
  }, [resetTopbar]);

  // Manejar cambio de filtro con dependencia jerárquica
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'division') {
        next.carrera = '';
        next.grupo = '';
      }
      if (field === 'carrera') {
        next.grupo = '';
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 h-full">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <FilterSelect
          label="División"
          placeholder="Elige el nombre de una división"
          value={filters.division}
          options={DIVISIONES}
          onChange={(v) => handleFilterChange('division', v)}
        />
        <FilterSelect
          label="CARRERA:"
          placeholder="Elige la carrera"
          value={filters.carrera}
          options={[]}
          disabled={!filters.division}
          onChange={(v) => handleFilterChange('carrera', v)}
        />
        <FilterSelect
          label="GRUPO"
          placeholder="Elige el grupo"
          value={filters.grupo}
          options={[]}
          disabled={!filters.carrera}
          onChange={(v) => handleFilterChange('grupo', v)}
        />
      </div>

      {/* Card principal de logs */}
      <div
        className={`flex-1 min-h-0 border rounded-2xl shadow-md flex flex-col overflow-hidden transition-colors duration-300
          ${darkMode
            ? 'bg-[#0F3B2E] border-[#0F7E3C]/60'
            : 'bg-white border-[#0F7E3C]/50'
          }`}
      >
        {/* Título + toggle modo oscuro */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-2">
          <div className="flex-1" />
          <h2
            className={`text-xl sm:text-2xl md:text-[28px] font-extrabold text-center font-[Lato] transition-colors duration-300
              ${darkMode ? 'text-[#FEFEFF]' : 'text-[#0F7E3C]'}`}
          >
            Registro del Sistema
          </h2>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`p-2 rounded-full transition-colors duration-300
                ${darkMode
                  ? 'text-[#0F7E3C] hover:bg-white/10'
                  : 'text-[#245C52] hover:bg-[#245C52]/10'
                }`}
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </div>

        {/* Lista de logs con scroll */}
        <div
          ref={logsContainerRef}
          className={`flex-1 min-h-0 overflow-y-auto mx-3 sm:mx-4 mb-3 sm:mb-4 border rounded-2xl p-3 sm:p-4 transition-colors duration-300
            ${darkMode
              ? 'bg-[#06322B] border-[#0F7E3C]/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
              : 'bg-white/40 border-[#0F7E3C]/50 shadow-inner'
            }`}
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-[#0F7E3C]' : 'text-[#0F7E3C]'}`} />
            </div>
          ) : logs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className={`text-sm ${darkMode ? 'text-[#FEFEFF]/50' : 'text-gray-400'}`}>
                No hay registros disponibles
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5 sm:space-y-2">
              {logs.map((log) => (
                <LogItem key={log.id} log={log} darkMode={darkMode} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Componente de cada entrada de log */
function LogItem({ log, darkMode }: { log: SystemLog; darkMode: boolean }) {
  const parsed = parseLogAction(log.action);
  const formattedDate = formatLogDate(log.timestamp);

  return (
    <li className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 text-sm">
      <div className="flex items-start gap-0 min-w-0">
        <span className={`shrink-0 mr-1 select-none ${darkMode ? 'text-[#0F7E3C]' : 'text-black'}`}>
          &bull;
        </span>
        <span className={darkMode ? 'text-[#FEFEFF]' : 'text-black'}>
          {log.user && <span>{log.user} ha </span>}
          {parsed ? (
            <>
              <span>{parsed.before}</span>
              <span className="font-bold">{parsed.keyword}</span>
              <span>{parsed.after}</span>
            </>
          ) : (
            <span>{log.action}</span>
          )}
        </span>
      </div>
      <span
        className={`text-xs sm:text-sm whitespace-nowrap shrink-0 pl-3 sm:pl-0
          ${darkMode ? 'text-[#FEFEFF]/50' : 'text-black/40'}`}
      >
        {formattedDate}
      </span>
    </li>
  );
}

/** Selector de filtro reutilizable */
function FilterSelect({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
      <span className="text-sm font-medium text-black whitespace-nowrap">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none bg-white border border-[#0F7E3C]/50 rounded-lg px-3 py-2 pr-8 text-sm shadow-sm
            text-black/60 disabled:cursor-not-allowed min-w-35 sm:min-w-45"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"
        />
      </div>
    </div>
  );
}

/** Datos de ejemplo mientras el endpoint no está disponible */
function generateMockLogs(): SystemLog[] {
  const names = [
    'Carlos Rodríguez Sánchez',
    'Juan Hernández López',
    'Isabel Jiménez Soto',
    'Elena Vargas Reyes',
    'Patricia Serrano Delgado',
    'Laura Mendoza Silva',
  ];

  const actions: { text: string; level: SystemLog['level'] }[] = [
    { text: 'inicio sesion a realizar el formulario.', level: 'info' },
    { text: 'comenzado a realizar el formulario.', level: 'info' },
    { text: 'finalizado el formulario.', level: 'info' },
    { text: 'comenzado a realizar el formulario.', level: 'info' },
    { text: 'finalizado el formulario.', level: 'info' },
    { text: 'comenzado a realizar el formulario.', level: 'info' },
  ];

  const baseTime = new Date('2025-08-28T17:02:00');
  const timeOffsets = [0, 25, 52, 63, 123, 142];

  const entries: SystemLog[] = [];
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < names.length; i++) {
      const time = new Date(baseTime.getTime() + (timeOffsets[i] + round * 180) * 1000);
      entries.push({
        id: round * names.length + i + 1,
        user: names[i],
        action: actions[i % actions.length].text,
        level: actions[i % actions.length].level,
        timestamp: time.toISOString(),
      });
    }
  }

  return entries;
}

export default AdminLogsView;
