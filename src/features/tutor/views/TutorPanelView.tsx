/**
 * Vista principal del panel de tutor con representacion visual del sociograma.
 * Consume endpoints de /api/academic/ que requieren autenticacion de tutor/docente.
 *
 * Estados de la vista:
 * 1. Cargando datos iniciales
 * 2. Sin cuestionarios disponibles -> estado vacio con castor
 * 3. Con cuestionario activo -> dashboard completo (grafo, clasificacion, progreso, actividad)
 *
 * Clasificacion por pregunta:
 * - GET /api/academic/cuestionarios/:id/clasificacion-pregunta/?grupo_id=X&pregunta_id=Y
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { ActivityLogCard, ClassificationCard, ResponsesProgressCard } from '../../../components/shared/dashboard';
import { PageLoader } from '../../../components/ui';
import { useTopbarStore, useToastStore } from '../../../store';
import {
  SociogramGraph,
  SociogramLegend,
  mapGrupoEstadisticasToSociogramData,
} from '../../sociogram';
import { tutorService } from '../services';
import type { SociogramGrupoEstadisticas, EstadisticasResponse } from '../../sociogram/types';
import type { RegistroResponse, ClasificacionPreguntaResponse } from '../types';
import type { CuestionarioPregunta } from '../../admin/types';
import { formatNombreDisplay } from '../../../core/utils/nameFormat';
import CastorBN from '../../../core/assets/Castor1-BN.png';

const EMPTY_GROUPS: SociogramGrupoEstadisticas[] = [];

interface GroupOption {
  id: number;
  label: string;
  total: number;
  completed: number;
}

interface CuestionarioOption {
  id: number;
  titulo: string;
  esta_activo: boolean;
}

interface PanelTopbarControlsProps {
  cuestionarios: CuestionarioOption[];
  selectedCuestionarioId: number | null;
  onCuestionarioChange: (value: number) => void;
  groupOptions: GroupOption[];
  selectedGrupoId: number | null;
  onGrupoChange: (value: number) => void;
  onExport: () => void;
  onReload: () => void;
  isDisabled: boolean;
  isReloading: boolean;
}

interface ActivityItem {
  name: string;
  action: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  approxMinutes?: number | null;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatActivityDateTime(value?: string | null): string | null {
  const date = parseDate(value);
  if (!date) return null;

  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year} ${hours}:${minutes}`;
}

function getApproxMinutes(start?: string | null, end?: string | null): number | null {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return null;
  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.round(diffMs / 60000));
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosErr.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.message === 'string') return data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function PanelTopbarControls({
  cuestionarios,
  selectedCuestionarioId,
  onCuestionarioChange,
  groupOptions,
  selectedGrupoId,
  onGrupoChange,
  onExport,
  onReload,
  isDisabled,
  isReloading,
}: PanelTopbarControlsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 sm:text-sm">GRUPO:</span>
        <select
          className="min-w-42.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs sm:text-sm"
          value={selectedGrupoId ?? ''}
          disabled={isDisabled || groupOptions.length === 0}
          onChange={(event) => onGrupoChange(Number(event.target.value))}
        >
          {groupOptions.length === 0 && <option value="">No hay grupos</option>}
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      <select
        className="min-w-60 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm"
        value={selectedCuestionarioId ?? ''}
        disabled={isDisabled || cuestionarios.length === 0}
        onChange={(event) => onCuestionarioChange(Number(event.target.value))}
      >
        {cuestionarios.length === 0 && <option value="">No hay sociogramas activos</option>}
        {cuestionarios.map((cuestionario) => (
          <option key={cuestionario.id} value={cuestionario.id}>
            {cuestionario.titulo}
            {cuestionario.esta_activo ? ' (activo)' : ''}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReload}
          disabled={isReloading}
          className="shrink-0 flex items-center justify-center rounded-md border border-[#0F7E3C]/50 bg-white p-2 text-[#0B5A4A] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          title="Recargar datos"
        >
          <RefreshCw size={16} className={isReloading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={isDisabled}
          className="hidden shrink-0 items-center justify-center gap-2 rounded-md bg-[#0B5A4A] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
        >
          Exportar <Download size={15} />
        </button>
      </div>
    </div>
  );
}

export function TutorPanelView() {
  const [cuestionarios, setCuestionarios] = useState<CuestionarioOption[]>([]);
  const [tutorGroups, setTutorGroups] = useState<Array<{
    id: number;
    clave: string;
    grado?: string;
    grupo?: string;
    programa_codigo?: string;
    periodo_codigo?: string;
    periodo_nombre?: string;
    total_alumnos: number;
  }>>([]);
  const [selectedCuestionarioId, setSelectedCuestionarioId] = useState<number | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasResponse | null>(null);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [isLoadingCuestionarios, setIsLoadingCuestionarios] = useState(true);
  const [isLoadingTutorGroups, setIsLoadingTutorGroups] = useState(true);
  const [isLoadingEstadisticas, setIsLoadingEstadisticas] = useState(false);
  const [errorEstadisticas, setErrorEstadisticas] = useState<string | null>(null);

  // Registro de actividades del endpoint /registro/
  const [registroData, setRegistroData] = useState<RegistroResponse | null>(null);

  // Clasificacion por pregunta
  const [preguntasDisponibles, setPreguntasDisponibles] = useState<CuestionarioPregunta[]>([]);
  const [selectedPreguntaId, setSelectedPreguntaId] = useState<number | null>(null);
  const [clasificacionData, setClasificacionData] = useState<ClasificacionPreguntaResponse | null>(null);
  const [isLoadingClasificacion, setIsLoadingClasificacion] = useState(false);

  // Controles de visibilidad (blur) por seccion
  const [isGraphBlurred, setIsGraphBlurred] = useState(false);
  const [isProgressVisible, setIsProgressVisible] = useState(true);
  const [isClassificationVisible, setIsClassificationVisible] = useState(true);
  // Toggle de nombres en el sociograma
  const [showNodeNames, setShowNodeNames] = useState(false);

  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  const selectedCuestionario = useMemo(
    () => cuestionarios.find((item) => item.id === selectedCuestionarioId) ?? null,
    [cuestionarios, selectedCuestionarioId]
  );

  const gruposDisponibles = useMemo(
    () => estadisticas?.grupos ?? EMPTY_GROUPS,
    [estadisticas]
  );

  const selectedGrupo = useMemo(
    () => gruposDisponibles.find((group) => group.grupo_id === selectedGrupoId) ?? null,
    [gruposDisponibles, selectedGrupoId]
  );

  const groupOptions = useMemo<GroupOption[]>(() => {
    const statsByGroupId = new Map(
      gruposDisponibles.map((group) => [group.grupo_id, group] as const)
    );

    if (tutorGroups.length > 0) {
      return tutorGroups.map((group) => {
        const stats = statsByGroupId.get(group.id);
        const total = stats?.total_alumnos ?? group.total_alumnos ?? 0;
        const completed = stats?.respuestas_completas ?? 0;

        // Formato: TSUDSM - 2°B
        let label = group.clave;
        if (group.programa_codigo && group.grado && group.grupo) {
          label = `${group.programa_codigo} - ${group.grado}°${group.grupo}`;
        }

        return {
          id: group.id,
          label,
          total,
          completed,
        };
      });
    }

    return gruposDisponibles.map((group) => ({
      id: group.grupo_id,
      label: group.grupo_clave,
      total: group.total_alumnos,
      completed: group.respuestas_completas,
    }));
  }, [tutorGroups, gruposDisponibles]);

  const graphData = useMemo(() => {
    if (!selectedGrupo || !selectedCuestionario) return null;
    return mapGrupoEstadisticasToSociogramData(selectedGrupo, {
      id: selectedCuestionario.id,
      titulo: selectedCuestionario.titulo,
      grupo: selectedGrupo.grupo_clave,
      total_alumnos: selectedGrupo.total_alumnos,
      total_respuestas: selectedGrupo.respuestas_completas,
    });
  }, [selectedGrupo, selectedCuestionario]);

  const classificationItems = useMemo(() => {
    // Prioridad: datos de clasificacion por pregunta
    if (clasificacionData) {
      return clasificacionData.ranking.map((item) => ({
        name: formatNombreDisplay(item.nombre),
        score: item.puntaje_recibido,
        id: item.matricula,
      }));
    }
    // Fallback: impacto total general
    if (!selectedGrupo) return undefined;
    return [...selectedGrupo.nodos]
      .sort((a, b) => b.impacto_total - a.impacto_total)
      .slice(0, 18)
      .map((nodo) => ({
        name: formatNombreDisplay(nodo.nombre),
        score: nodo.impacto_total,
        id: nodo.matricula,
      }));
  }, [clasificacionData, selectedGrupo]);

  const activityItems = useMemo<ActivityItem[] | undefined>(() => {
    // Prioridad: datos del endpoint /registro/ si están disponibles
    if (registroData) {
      const items = registroData.alumnos
        .filter((alumno) => alumno.fecha_inicio !== null || alumno.fecha_completado !== null)
        .map((alumno) => {
          const startDate = formatActivityDateTime(alumno.fecha_inicio);
          const endDate = formatActivityDateTime(alumno.fecha_completado);
          return {
            name: formatNombreDisplay(alumno.nombre),
            action: alumno.estado === 'COMPLETADO'
              ? 'ha finalizado el formulario.'
              : 'ha comenzado a realizar el formulario.',
            time: endDate || startDate || 'Fecha no disponible',
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
            approxMinutes: getApproxMinutes(alumno.fecha_inicio, alumno.fecha_completado),
          };
        })
        // Ordenar: completados primero, luego por fecha de inicio más reciente
        .sort((a, b) => {
          const aCompleto = a.action.includes('finalizado') ? 1 : 0;
          const bCompleto = b.action.includes('finalizado') ? 1 : 0;
          if (bCompleto !== aCompleto) return bCompleto - aCompleto;
          return (b.endDate || b.startDate || '').localeCompare(a.endDate || a.startDate || '');
        })
        .slice(0, 10);

      return items;
    }

    // Fallback: datos del endpoint /estadisticas/ (sin fechas exactas)
    if (!selectedGrupo) return [];
    const mapped = [...selectedGrupo.nodos]
      .filter((nodo) => nodo.completo || nodo.elecciones_realizadas > 0)
      .sort((a, b) => Number(b.completo) - Number(a.completo) || b.elecciones_realizadas - a.elecciones_realizadas)
      .slice(0, 10)
      .map((nodo) => {
        const startDate = formatActivityDateTime(nodo.fecha_inicio);
        const endDate = formatActivityDateTime(nodo.fecha_completado);

        return {
          name: formatNombreDisplay(nodo.nombre),
          action: nodo.completo ? 'ha finalizado el formulario.' : 'ha comenzado a realizar el formulario.',
          time: startDate || endDate || 'Fecha no disponible',
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          approxMinutes: getApproxMinutes(nodo.fecha_inicio, nodo.fecha_completado),
        };
      });

    return mapped;
  }, [registroData, selectedGrupo]);

  const handleExport = useCallback(() => {
    if (!selectedGrupo || !selectedCuestionario) return;

    const exportPayload = {
      generado_en: new Date().toISOString(),
      cuestionario: {
        id: selectedCuestionario.id,
        titulo: selectedCuestionario.titulo,
      },
      grupo: selectedGrupo,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sociograma_${selectedGrupo.grupo_clave}_${selectedCuestionario.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedCuestionario, selectedGrupo]);

  // Cargar cuestionarios disponibles para el tutor
  const fetchCuestionarios = useCallback(async () => {
    setIsLoadingCuestionarios(true);
    try {
      const response = await tutorService.getCuestionarios();
      const items = (response.cuestionarios || []).map((c: { id: number; titulo: string; esta_activo: boolean }) => ({
        id: c.id,
        titulo: c.titulo,
        esta_activo: c.esta_activo,
      }));
      setCuestionarios(items);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'No fue posible cargar los sociogramas.');
      showToast({ message, type: 'error' });
      setCuestionarios([]);
    } finally {
      setIsLoadingCuestionarios(false);
    }
  }, [showToast]);

  // Cargar grupos asignados al tutor
  const fetchTutorGroups = useCallback(async () => {
    setIsLoadingTutorGroups(true);
    try {
      const response = await tutorService.getMyGroupsSummary();
      setTutorGroups(response || []);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'No fue posible cargar los grupos.');
      showToast({ message, type: 'error' });
      setTutorGroups([]);
    } finally {
      setIsLoadingTutorGroups(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCuestionarios();
    fetchTutorGroups();
  }, [fetchCuestionarios, fetchTutorGroups]);

  // Seleccionar cuestionario inicial
  useEffect(() => {
    if (cuestionarios.length === 0) {
      setSelectedCuestionarioId(null);
      return;
    }
    setSelectedCuestionarioId((current) => {
      if (current && cuestionarios.some((item) => item.id === current)) return current;
      return cuestionarios.find((item) => item.esta_activo)?.id ?? cuestionarios[0].id;
    });
  }, [cuestionarios]);

  // Cargar estadísticas al cambiar cuestionario
  useEffect(() => {
    if (!selectedCuestionarioId) {
      setEstadisticas(null);
      setErrorEstadisticas(null);
      return;
    }

    let isCancelled = false;

    const fetchEstadisticas = async () => {
      setIsLoadingEstadisticas(true);
      setErrorEstadisticas(null);
      try {
        const response = await tutorService.getCuestionarioEstadisticas(selectedCuestionarioId);
        if (!isCancelled) {
          setEstadisticas(response);
          if (response.grupos.length === 0) {
            setErrorEstadisticas('No hay datos disponibles para este cuestionario.');
          }
        }
      } catch (error: unknown) {
        if (isCancelled) return;
        const message = extractErrorMessage(error, 'No se pudo obtener la data del sociograma.');
        setEstadisticas(null);
        setErrorEstadisticas(message);
      } finally {
        if (!isCancelled) setIsLoadingEstadisticas(false);
      }
    };

    fetchEstadisticas();
    return () => { isCancelled = true; };
  }, [selectedCuestionarioId, selectedCuestionario?.titulo, showToast]);

  // Cargar registro de actividades al cambiar cuestionario o grupo
  useEffect(() => {
    if (!selectedCuestionarioId || !selectedGrupoId) {
      setRegistroData(null);
      return;
    }

    let isCancelled = false;

    const fetchRegistro = async () => {
      try {
        const response = await tutorService.getCuestionarioRegistro(selectedCuestionarioId, selectedGrupoId);
        if (!isCancelled) setRegistroData(response);
      } catch {
        // El registro es complementario: si falla, simplemente no se muestran fechas exactas
        if (!isCancelled) setRegistroData(null);
      }
    };

    fetchRegistro();
    return () => { isCancelled = true; };
  }, [selectedCuestionarioId, selectedGrupoId]);

  // Cargar preguntas del cuestionario seleccionado para el selector de clasificacion.
  // Se usa getCuestionarioDetalle (por ID) en lugar de getCuestionarioActivo para que
  // las preguntas sigan disponibles aunque la fecha limite del cuestionario ya haya pasado.
  useEffect(() => {
    if (!selectedCuestionarioId) {
      setPreguntasDisponibles([]);
      setSelectedPreguntaId(null);
      return;
    }

    let isCancelled = false;

    const fetchPreguntas = async () => {
      try {
        const cuestionario = await tutorService.getCuestionarioDetalle(selectedCuestionarioId);
        if (!isCancelled && cuestionario?.preguntas) {
          setPreguntasDisponibles(cuestionario.preguntas);
          // Seleccionar la primera pregunta automaticamente
          setSelectedPreguntaId((current) => {
            if (current && cuestionario.preguntas!.some((cp) => cp.pregunta.id === current)) return current;
            return cuestionario.preguntas![0]?.pregunta.id ?? null;
          });
        }
      } catch {
        if (!isCancelled) {
          setPreguntasDisponibles([]);
          setSelectedPreguntaId(null);
        }
      }
    };

    fetchPreguntas();
    return () => { isCancelled = true; };
  }, [selectedCuestionarioId]);

  // Cargar clasificacion por pregunta al cambiar cuestionario, grupo o pregunta
  useEffect(() => {
    if (!selectedCuestionarioId || !selectedGrupoId || !selectedPreguntaId) {
      setClasificacionData(null);
      return;
    }

    let isCancelled = false;

    const fetchClasificacion = async () => {
      setIsLoadingClasificacion(true);
      try {
        const response = await tutorService.getClasificacionPregunta(
          selectedCuestionarioId,
          selectedGrupoId,
          selectedPreguntaId
        );
        if (!isCancelled) setClasificacionData(response);
      } catch {
        // Si falla (ej: pregunta no es SELECCION_ALUMNO), se cae al fallback de impacto total
        if (!isCancelled) setClasificacionData(null);
      } finally {
        if (!isCancelled) setIsLoadingClasificacion(false);
      }
    };

    fetchClasificacion();
    return () => { isCancelled = true; };
  }, [selectedCuestionarioId, selectedGrupoId, selectedPreguntaId]);

  // Seleccionar grupo inicial
  useEffect(() => {
    if (groupOptions.length === 0) {
      setSelectedGrupoId(null);
      return;
    }
    setSelectedGrupoId((current) => {
      if (current && groupOptions.some((group) => group.id === current)) return current;
      return groupOptions[0].id;
    });
  }, [groupOptions]);

  // Seleccionar pregunta desde el dropdown de la clasificacion
  const handlePreguntaChange = useCallback((preguntaId: number) => {
    setSelectedPreguntaId(preguntaId);
  }, []);

  // Opciones de preguntas para el selector de clasificacion
  const preguntaOptions = useMemo(() => {
    return preguntasDisponibles.map((cp) => {
      const polaridadLabel = cp.pregunta.polaridad === 'NEGATIVA' ? '(-) ' : '(+) ';
      return {
        id: cp.pregunta.id,
        label: `${polaridadLabel}${cp.pregunta.texto}`,
      };
    });
  }, [preguntasDisponibles]);

  const classificationSubtitle = useMemo(() => {
    if (!selectedPreguntaId || preguntasDisponibles.length === 0) {
      return selectedCuestionario?.titulo ?? 'Sin sociograma seleccionado';
    }
    const cp = preguntasDisponibles.find((p) => p.pregunta.id === selectedPreguntaId);
    if (!cp) return selectedCuestionario?.titulo ?? '';
    const polaridadLabel = cp.pregunta.polaridad === 'NEGATIVA' ? '(-) ' : '(+) ';
    return `${polaridadLabel}${cp.pregunta.texto}`;
  }, [selectedPreguntaId, preguntasDisponibles, selectedCuestionario]);

  // Funcion para recargar todos los datos
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = useCallback(async () => {
    setIsReloading(true);
    try {
      await Promise.all([fetchCuestionarios(), fetchTutorGroups()]);
      showToast({ message: 'Datos actualizados correctamente.', type: 'success' });
    } catch {
      showToast({ message: 'Error al recargar los datos.', type: 'error' });
    } finally {
      setIsReloading(false);
    }
  }, [fetchCuestionarios, fetchTutorGroups, showToast]);

  // Configurar topbar - siempre muestra controles
  const topbarContent = useMemo(
    () => (
      <PanelTopbarControls
        cuestionarios={cuestionarios}
        selectedCuestionarioId={selectedCuestionarioId}
        onCuestionarioChange={setSelectedCuestionarioId}
        groupOptions={groupOptions}
        selectedGrupoId={selectedGrupoId}
        onGrupoChange={setSelectedGrupoId}
        onExport={handleExport}
        onReload={handleReload}
        isDisabled={isLoadingCuestionarios || isLoadingTutorGroups || isLoadingEstadisticas}
        isReloading={isReloading}
      />
    ),
    [cuestionarios, selectedCuestionarioId, groupOptions, selectedGrupoId, handleExport, handleReload, isLoadingCuestionarios, isLoadingTutorGroups, isLoadingEstadisticas, isReloading]
  );

  const hasCuestionarios = cuestionarios.length > 0;

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: topbarContent,
      mobileAction: hasCuestionarios ? {
        id: 'export-sociogram-panel',
        label: 'Exportar',
        icon: 'download',
        variant: 'primary',
        onClick: handleExport,
        disabled: !selectedGrupo || isLoadingCuestionarios || isLoadingTutorGroups || isLoadingEstadisticas,
      } : null,
    });
  }, [topbarContent, hasCuestionarios, handleExport, selectedGrupo, isLoadingCuestionarios, isLoadingTutorGroups, isLoadingEstadisticas, setTopbarConfig]);

  useEffect(() => {
    return () => resetTopbar();
  }, [resetTopbar]);

  if (isLoadingCuestionarios && cuestionarios.length === 0) {
    return <PageLoader message="Cargando panel del sociograma..." />;
  }

  if (!isLoadingCuestionarios && cuestionarios.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 sm:gap-8 max-w-md w-full">
          <img
            src={CastorBN}
            alt="Sin cuestionarios disponibles"
            className="w-48 h-auto sm:w-64 md:w-72 lg:w-80 opacity-25 select-none pointer-events-none"
            draggable={false}
          />
          <p className="text-center text-base sm:text-lg md:text-xl font-bold text-[#245C52]/50 leading-relaxed">
            Aun no hay cuestionarios asignados por el momento.
          </p>
        </div>
      </div>
    );
  }

  const noResponses = !isLoadingEstadisticas && selectedGrupo && selectedGrupo.respuestas_completas === 0;
  const emptyMessage = 'Aun no se ha contestado ningun formulario.';

  return (
    <div className="h-full overflow-hidden flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Columna izquierda: sociograma + leyenda + actividad */}
      <section className="flex min-w-0 flex-1 flex-col gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Sociograma + Leyenda: toma ~70% del espacio vertical disponible */}
        <div className="flex flex-col xl:flex-row gap-4 lg:flex-7 min-h-0">
          {/* Card del sociograma */}
          <div className="relative flex-1 min-h-0">
            {noResponses ? (
              <div className="flex h-full min-h-72 items-center justify-center rounded-xl border border-emerald-600/35 bg-white p-6 shadow-sm">
                <p className="text-center text-sm text-gray-400 sm:text-base">{emptyMessage}</p>
              </div>
            ) : (
              <SociogramGraph
                data={graphData}
                isLoading={isLoadingEstadisticas}
                error={errorEstadisticas}
                className="h-full min-h-72"
                isBlurred={isGraphBlurred}
                onToggleBlur={() => setIsGraphBlurred((prev) => !prev)}
                showNodeNames={showNodeNames}
                onToggleNodeNames={graphData ? () => setShowNodeNames((prev) => !prev) : undefined}
              />
            )}
          </div>

          {/* Leyenda - desktop xl */}
          <div className="hidden xl:flex xl:flex-col rounded-xl border border-emerald-600/35 bg-white p-4 shadow-sm shrink-0">
            <SociogramLegend />
          </div>
        </div>

        {/* Leyenda - mobile/tablet */}
        <div className="rounded-xl border border-emerald-600/35 bg-white p-4 shadow-sm xl:hidden shrink-0">
          <SociogramLegend />
        </div>

        {/* Cards mobile: respuestas + clasificacion */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden shrink-0">
          <ResponsesProgressCard
            total={selectedGrupo?.total_alumnos ?? 0}
            completed={selectedGrupo?.respuestas_completas ?? 0}
            onToggleVisibility={noResponses ? undefined : () => setIsProgressVisible((prev) => !prev)}
            isVisible={isProgressVisible}
          />
          <ClassificationCard
            className="min-h-64"
            items={noResponses || isLoadingClasificacion ? undefined : classificationItems}
            subtitle={classificationSubtitle}
            emptyMessage={isLoadingClasificacion ? 'Cargando clasificacion...' : emptyMessage}
            preguntaOptions={noResponses || preguntasDisponibles.length <= 1 ? undefined : preguntaOptions}
            selectedPreguntaId={selectedPreguntaId}
            onPreguntaChange={handlePreguntaChange}
            onToggleVisibility={noResponses ? undefined : () => setIsClassificationVisible((prev) => !prev)}
            isVisible={isClassificationVisible}
          />
        </div>

        {/* Registro de actividades: proporcion fija, scroll interno si hay muchos items */}
        <ActivityLogCard
          className="shrink-0 lg:shrink-0 lg:flex-3 lg:min-h-0 lg:max-h-none max-h-40"
          items={noResponses ? undefined : activityItems}
          emptyMessage={emptyMessage}
        />
      </section>

      {/* Columna derecha: respuestas + clasificacion - desktop */}
      <aside className="hidden lg:flex flex-col gap-4 w-85 shrink-0 min-h-0 overflow-hidden">
        <ResponsesProgressCard
          total={selectedGrupo?.total_alumnos ?? 0}
          completed={selectedGrupo?.respuestas_completas ?? 0}
          onToggleVisibility={noResponses ? undefined : () => setIsProgressVisible((prev) => !prev)}
          isVisible={isProgressVisible}
        />
        <ClassificationCard
          className="flex-1 min-h-0"
          items={noResponses || isLoadingClasificacion ? undefined : classificationItems}
          subtitle={classificationSubtitle}
          emptyMessage={isLoadingClasificacion ? 'Cargando clasificacion...' : emptyMessage}
          preguntaOptions={noResponses || preguntasDisponibles.length <= 1 ? undefined : preguntaOptions}
          selectedPreguntaId={selectedPreguntaId}
          onPreguntaChange={handlePreguntaChange}
          onToggleVisibility={noResponses ? undefined : () => setIsClassificationVisible((prev) => !prev)}
          isVisible={isClassificationVisible}
        />
      </aside>
    </div>
  );
}

export default TutorPanelView;
