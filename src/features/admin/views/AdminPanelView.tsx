/**
 * Nueva vista principal del panel admin con representacion visual del sociograma.
 * Mantiene la pantalla legacy intacta en otro archivo.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { ActivityLogCard, ClassificationCard, ResponsesProgressCard } from '../../../components/shared/dashboard';
import { useTopbarStore, useToastStore } from '../../../store';
import {
  SociogramGraph,
  SociogramLegend,
  mapGrupoEstadisticasToSociogramData,
  createDemoEstadisticasResponse,
} from '../../sociogram';
import { adminService } from '../services';
import type { Cuestionario } from '../types';
import type { SociogramGrupoEstadisticas, EstadisticasResponse } from '../../sociogram/types';

const EMPTY_GROUPS: SociogramGrupoEstadisticas[] = [];

interface GroupOption {
  id: number;
  label: string;
  total: number;
  completed: number;
}

interface PanelTopbarControlsProps {
  cuestionarios: Cuestionario[];
  selectedCuestionarioId: number | null;
  onCuestionarioChange: (value: number) => void;
  groupOptions: GroupOption[];
  selectedGrupoId: number | null;
  onGrupoChange: (value: number) => void;
  onExport: () => void;
  isDisabled: boolean;
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

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number } };
    return axiosErr.response?.status;
  }
  return undefined;
}

function PanelTopbarControls({
  cuestionarios,
  selectedCuestionarioId,
  onCuestionarioChange,
  groupOptions,
  selectedGrupoId,
  onGrupoChange,
  onExport,
  isDisabled,
}: PanelTopbarControlsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 sm:text-sm">GRUPO:</span>
        <select
          className="min-w-[170px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs sm:text-sm"
          value={selectedGrupoId ?? ''}
          disabled={isDisabled || groupOptions.length === 0}
          onChange={(event) => onGrupoChange(Number(event.target.value))}
        >
          {groupOptions.length === 0 && <option value="">No hay grupos</option>}
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label} ({group.completed}/{group.total})
            </option>
          ))}
        </select>
      </div>

      <select
        className="min-w-[240px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm"
        value={selectedCuestionarioId ?? ''}
        disabled={isDisabled || cuestionarios.length === 0}
        onChange={(event) => onCuestionarioChange(Number(event.target.value))}
      >
        {cuestionarios.length === 0 && <option value="">No hay sociogramas</option>}
        {cuestionarios.map((cuestionario) => (
          <option key={cuestionario.id} value={cuestionario.id}>
            {cuestionario.titulo}
            {cuestionario.esta_activo ? ' (activo)' : ''}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onExport}
        disabled={isDisabled}
        className="hidden shrink-0 items-center justify-center gap-2 rounded-md bg-[#0B5A4A] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
      >
        Exportar <Download size={15} />
      </button>
    </div>
  );
}

export function AdminPanelView() {
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [tutorGroups, setTutorGroups] = useState<Array<{
    id: number;
    clave: string;
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
  const [usingDemoData, setUsingDemoData] = useState(false);

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
        const periodLabel = group.periodo_codigo ? ` · ${group.periodo_codigo}` : '';
        return {
          id: group.id,
          label: `${group.clave}${periodLabel}`,
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
    if (!selectedGrupo) return undefined;
    return [...selectedGrupo.nodos]
      .sort((a, b) => b.impacto_total - a.impacto_total)
      .slice(0, 18)
      .map((nodo) => ({
        name: nodo.nombre,
        score: nodo.impacto_total,
        id: nodo.matricula,
      }));
  }, [selectedGrupo]);

  const activityItems = useMemo<ActivityItem[] | undefined>(() => {
    if (!selectedGrupo) return [];
    const mapped = [...selectedGrupo.nodos]
      .filter((nodo) => nodo.completo || nodo.elecciones_realizadas > 0)
      .sort((a, b) => Number(b.completo) - Number(a.completo) || b.elecciones_realizadas - a.elecciones_realizadas)
      .slice(0, 10)
      .map((nodo) => {
        const startDate = formatActivityDateTime(nodo.fecha_inicio);
        const endDate = formatActivityDateTime(nodo.fecha_completado);

        return {
          name: nodo.nombre,
          action: nodo.completo ? 'ha finalizado el formulario.' : 'ha comenzado a realizar el formulario.',
          time: startDate || endDate || 'Fecha no disponible',
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          approxMinutes: getApproxMinutes(nodo.fecha_inicio, nodo.fecha_completado),
        };
      });

    return mapped;
  }, [selectedGrupo]);

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

  const fetchCuestionarios = useCallback(async () => {
    setIsLoadingCuestionarios(true);
    try {
      const response = await adminService.getCuestionarios();
      setCuestionarios(response.cuestionarios || []);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'No fue posible cargar los sociogramas.');
      showToast({ message, type: 'error' });
      setCuestionarios([]);
    } finally {
      setIsLoadingCuestionarios(false);
    }
  }, [showToast]);

  const fetchTutorGroups = useCallback(async () => {
    setIsLoadingTutorGroups(true);
    try {
      const groups = await adminService.getMyTutorGroups();
      setTutorGroups(groups || []);
    } catch (error: unknown) {
      const statusCode = extractStatusCode(error);
      if (statusCode !== 403) {
        const message = extractErrorMessage(error, 'No fue posible cargar los grupos del tutor.');
        showToast({ message, type: 'error' });
      }
      setTutorGroups([]);
    } finally {
      setIsLoadingTutorGroups(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCuestionarios();
    fetchTutorGroups();
  }, [fetchCuestionarios, fetchTutorGroups]);

  useEffect(() => {
    if (cuestionarios.length === 0) {
      setSelectedCuestionarioId(null);
      return;
    }

    setSelectedCuestionarioId((current) => {
      if (current && cuestionarios.some((item) => item.id === current)) {
        return current;
      }
      return cuestionarios.find((item) => item.esta_activo)?.id ?? cuestionarios[0].id;
    });
  }, [cuestionarios]);

  useEffect(() => {
    if (!selectedCuestionarioId) {
      setEstadisticas(null);
      setErrorEstadisticas(null);
      setUsingDemoData(false);
      return;
    }

    let isCancelled = false;

    const fetchEstadisticas = async () => {
      setIsLoadingEstadisticas(true);
      setErrorEstadisticas(null);
      try {
        const response = await adminService.getCuestionarioEstadisticas(
          selectedCuestionarioId,
          selectedGrupoId ?? undefined
        );
        if (!isCancelled) {
          setEstadisticas(response);
          setUsingDemoData(false);
          if (response.grupos.length === 0) {
            setErrorEstadisticas(
              'El grupo seleccionado no tiene datos disponibles para este cuestionario.'
            );
          }
        }
      } catch (error: unknown) {
        if (isCancelled) return;
        const statusCode = extractStatusCode(error);
        if (statusCode === 403 && selectedGrupoId === null) {
          const demo = createDemoEstadisticasResponse(
            selectedCuestionarioId,
            selectedCuestionario?.titulo ?? 'Sociograma Demo'
          );
          setEstadisticas(demo);
          setErrorEstadisticas(null);
          setUsingDemoData(true);
          showToast({
            message: 'Sin permisos o sin datos reales para estadisticas. Cargando sociograma de prueba.',
            type: 'info',
          });
          return;
        }

        if (statusCode === 403) {
          setEstadisticas(null);
          setUsingDemoData(false);
          setErrorEstadisticas(
            'No tienes acceso a ese grupo para el cuestionario seleccionado. Verifica el periodo y la asignacion de tutor.'
          );
          return;
        }

        const message = extractErrorMessage(
          error,
          'No se pudo obtener la data del sociograma para este cuestionario.'
        );
        setEstadisticas(null);
        setErrorEstadisticas(message);
        setUsingDemoData(false);
      } finally {
        if (!isCancelled) {
          setIsLoadingEstadisticas(false);
        }
      }
    };

    fetchEstadisticas();

    return () => {
      isCancelled = true;
    };
  }, [selectedCuestionarioId, selectedGrupoId, selectedCuestionario?.titulo, showToast]);

  useEffect(() => {
    if (groupOptions.length === 0) {
      setSelectedGrupoId(null);
      return;
    }

    setSelectedGrupoId((current) => {
      if (current && groupOptions.some((group) => group.id === current)) {
        return current;
      }
      return groupOptions[0].id;
    });
  }, [groupOptions]);

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
        isDisabled={isLoadingCuestionarios || isLoadingTutorGroups || isLoadingEstadisticas}
      />
    ),
    [
      cuestionarios,
      selectedCuestionarioId,
      groupOptions,
      selectedGrupoId,
      handleExport,
      isLoadingCuestionarios,
      isLoadingTutorGroups,
      isLoadingEstadisticas,
    ]
  );

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: topbarContent,
      mobileAction: {
        id: 'export-sociogram-panel',
        label: 'Exportar',
        icon: 'download',
        variant: 'primary',
        onClick: handleExport,
        disabled: !selectedGrupo || isLoadingCuestionarios || isLoadingTutorGroups || isLoadingEstadisticas,
      },
    });
  }, [
    topbarContent,
    handleExport,
    selectedGrupo,
    isLoadingCuestionarios,
    isLoadingTutorGroups,
    isLoadingEstadisticas,
    setTopbarConfig,
  ]);

  useEffect(() => {
    return () => resetTopbar();
  }, [resetTopbar]);

  if (isLoadingCuestionarios && cuestionarios.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-600/35 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-500">Cargando panel del sociograma...</p>
      </div>
    );
  }

  if (!isLoadingCuestionarios && cuestionarios.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-600/35 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0B5A4A]">No hay cuestionarios disponibles</h2>
        <p className="mt-2 text-sm text-gray-500">
          Crea y activa un cuestionario para visualizar el sociograma del panel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex min-w-0 flex-col gap-6">
        {usingDemoData && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Mostrando un sociograma de prueba para validar el mapeo visual. El endpoint real está respondiendo sin acceso o sin grupos con datos.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_190px]">
          <SociogramGraph
            data={graphData}
            isLoading={isLoadingEstadisticas}
            error={errorEstadisticas}
            className="min-h-[500px]"
          />
          <SociogramLegend className="hidden xl:block" />
        </div>

        <div className="rounded-xl border border-emerald-600/35 bg-white p-4 shadow-sm xl:hidden">
          <SociogramLegend />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:hidden">
          <ResponsesProgressCard
            total={selectedGrupo?.total_alumnos ?? 0}
            completed={selectedGrupo?.respuestas_completas ?? 0}
          />
          <ClassificationCard
            items={classificationItems}
            subtitle={selectedCuestionario?.titulo ?? 'Sin sociograma seleccionado'}
          />
        </div>

        <ActivityLogCard items={activityItems} />
      </section>

      <aside className="hidden min-h-0 flex-col gap-6 lg:flex">
        <ResponsesProgressCard
          total={selectedGrupo?.total_alumnos ?? 0}
          completed={selectedGrupo?.respuestas_completas ?? 0}
        />
        <div className="min-h-0 flex-1">
          <ClassificationCard
            className="h-full"
            items={classificationItems}
            subtitle={selectedCuestionario?.titulo ?? 'Sin sociograma seleccionado'}
          />
        </div>
      </aside>
    </div>
  );
}

export default AdminPanelView;
