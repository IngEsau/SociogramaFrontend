/**
 * Dashboard de Comite
 *
 * Implementa una vista global de analitica institucional usando endpoints:
 * - /comite/cuestionarios/
 * - /comite/cuestionarios/{id}/
 * - /comite/cuestionarios/{id}/progreso/
 * - /comite/cuestionarios/{id}/estadisticas/
 * - /comite/overview/
 * - /comite/overview/progreso/
 * - /comite/overview/alertas/
 * - /comite/overview/centralidad/
 * - /comite/graphs/
 */

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Loader2, Network, RefreshCw, Rows3, Users } from 'lucide-react';
import { ActivityLogCard, ClassificationCard, ResponsesProgressCard } from '../../../components/shared/dashboard';
import { useToastStore, useTopbarStore } from '../../../store';
import { mapGrupoEstadisticasToSociogramData, SociogramGraph, SociogramLegend } from '../../sociogram';
import { committeeService } from '../services';
import type {
  CommitteeFilters,
  CommitteeGraphDistributionItem,
  CommitteeOverviewAlertsResponse,
  CommitteeOverviewCentralityResponse,
  CommitteeOverviewProgressResponse,
  CommitteeOverviewResponse,
  CommitteeQuestionnaireDetail,
  CommitteeQuestionnaireListItem,
  CommitteeQuestionnaireProgressResponse,
  CommitteeQuestionnaireStatsGroup,
  CommitteeQuestionnaireStatsResponse,
} from '../types';

type CommitteeTab = 'resumen' | 'cuestionarios' | 'sociograma';
type CommitteeViewMode = 'full' | 'panel' | 'cuestionarios' | 'sociograma';

interface CommitteeDashboardViewProps {
  initialTab?: CommitteeTab;
  mode?: CommitteeViewMode;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosError.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.message === 'string') return data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return 'No disponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-emerald-600/25 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <span className="text-[#0B5A4A]">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[#0B5A4A]">{value}</p>
    </article>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        isActive
          ? 'border-[#0B5A4A] bg-[#0B5A4A] text-white'
          : 'border-[#0B5A4A]/25 bg-white text-[#0B5A4A] hover:bg-emerald-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DistributionRow({ item }: { item: CommitteeGraphDistributionItem }) {
  const safeTotal = item.total > 0 ? item.total : 1;
  const accepted = Math.round((item.ACEPTADO / safeTotal) * 100);
  const rejected = Math.round((item.RECHAZADO / safeTotal) * 100);
  const invisible = Math.max(0, 100 - accepted - rejected);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-gray-800">{item.grupo_clave}</p>
        <p className="text-xs text-gray-500">{item.total} alumnos</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div className="flex h-full w-full">
          <div className="bg-emerald-600" style={{ width: `${accepted}%` }} title={`Aceptados: ${item.ACEPTADO}`} />
          <div className="bg-red-700" style={{ width: `${rejected}%` }} title={`Rechazados: ${item.RECHAZADO}`} />
          <div className="bg-gray-500" style={{ width: `${invisible}%` }} title={`Invisibles: ${item.INVISIBLE}`} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span>Aceptado: {item.ACEPTADO}</span>
        <span>Rechazado: {item.RECHAZADO}</span>
        <span>Invisible: {item.INVISIBLE}</span>
      </div>
    </div>
  );
}

function resolveTabByMode(mode: CommitteeViewMode, initialTab: CommitteeTab): CommitteeTab {
  if (mode === 'panel') return 'resumen';
  if (mode === 'cuestionarios') return 'cuestionarios';
  if (mode === 'sociograma') return 'sociograma';
  return initialTab;
}

export function CommitteeDashboardView({ initialTab = 'resumen', mode = 'full' }: CommitteeDashboardViewProps) {
  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  const resolvedInitialTab = useMemo(() => resolveTabByMode(mode, initialTab), [initialTab, mode]);
  const [activeTab, setActiveTab] = useState<CommitteeTab>(resolvedInitialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allQuestionnaires, setAllQuestionnaires] = useState<CommitteeQuestionnaireListItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [draftDivisionId, setDraftDivisionId] = useState('');
  const [draftTutorId, setDraftTutorId] = useState('');
  const [showNodeNames, setShowNodeNames] = useState(false);

  const [overview, setOverview] = useState<CommitteeOverviewResponse | null>(null);
  const [overviewProgress, setOverviewProgress] = useState<CommitteeOverviewProgressResponse | null>(null);
  const [overviewAlerts, setOverviewAlerts] = useState<CommitteeOverviewAlertsResponse | null>(null);
  const [overviewCentrality, setOverviewCentrality] = useState<CommitteeOverviewCentralityResponse | null>(null);
  const [graphs, setGraphs] = useState<{
    distribucion_por_grupo: CommitteeGraphDistributionItem[];
  } | null>(null);
  const [questionnaireDetail, setQuestionnaireDetail] = useState<CommitteeQuestionnaireDetail | null>(null);
  const [questionnaireProgress, setQuestionnaireProgress] =
    useState<CommitteeQuestionnaireProgressResponse | null>(null);
  const [questionnaireStats, setQuestionnaireStats] = useState<CommitteeQuestionnaireStatsResponse | null>(null);

  useEffect(() => {
    setActiveTab(resolvedInitialTab);
  }, [resolvedInitialTab]);

  const periodOptions = useMemo(() => {
    const periodMap = new Map<number, { id: number; label: string }>();
    allQuestionnaires.forEach((questionnaire) => {
      if (!periodMap.has(questionnaire.periodo)) {
        periodMap.set(questionnaire.periodo, {
          id: questionnaire.periodo,
          label: `${questionnaire.periodo_codigo} · ${questionnaire.periodo_nombre}`,
        });
      }
    });
    return Array.from(periodMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allQuestionnaires]);

  const questionnaires = useMemo(() => {
    if (!selectedPeriodId) return allQuestionnaires;
    return allQuestionnaires.filter((questionnaire) => questionnaire.periodo === selectedPeriodId);
  }, [allQuestionnaires, selectedPeriodId]);

  const selectedQuestionnaire = useMemo(
    () => questionnaires.find((item) => item.id === selectedQuestionnaireId) ?? null,
    [questionnaires, selectedQuestionnaireId]
  );

  const groupOptions = useMemo(() => {
    const optionsFromProgress = (questionnaireProgress?.grupos ?? []).map((group) => ({
      id: group.grupo_id,
      label: group.grupo_clave,
    }));

    if (optionsFromProgress.length > 0) return optionsFromProgress;

    return (questionnaireStats?.grupos ?? []).map((group) => ({
      id: group.grupo_id,
      label: group.grupo_clave,
    }));
  }, [questionnaireProgress, questionnaireStats]);

  const selectedStatsGroup = useMemo<CommitteeQuestionnaireStatsGroup | null>(() => {
    const groups = questionnaireStats?.grupos ?? [];
    if (groups.length === 0) return null;

    if (selectedGroupId) {
      return groups.find((group) => group.grupo_id === selectedGroupId) ?? groups[0];
    }
    return groups[0];
  }, [questionnaireStats, selectedGroupId]);

  const graphData = useMemo(() => {
    if (!selectedStatsGroup || !selectedQuestionnaire) return null;
    return mapGrupoEstadisticasToSociogramData(selectedStatsGroup, {
      id: selectedQuestionnaire.id,
      titulo: selectedQuestionnaire.titulo,
      grupo: selectedStatsGroup.grupo_clave,
      total_alumnos: selectedStatsGroup.total_alumnos,
      total_respuestas: selectedStatsGroup.respuestas_completas,
    });
  }, [selectedStatsGroup, selectedQuestionnaire]);

  const centralityItems = useMemo(() => {
    const byDivision = overviewCentrality?.top_centralidad.por_division ?? [];
    const flatItems = byDivision.flatMap((division) =>
      division.top.map((student) => ({
        name: student.nombre,
        score: student.elecciones_positivas,
        id: `${student.matricula}${student.grupo ? ` · ${student.grupo}` : ''}`,
      }))
    );

    return flatItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
  }, [overviewCentrality]);

  const activityItems = useMemo(() => {
    const groups = questionnaireProgress?.grupos ?? [];
    return [...groups]
      .sort((a, b) => b.porcentaje_completado - a.porcentaje_completado)
      .slice(0, 10)
      .map((group) => ({
        name: group.grupo_clave,
        action: `tiene ${group.completados}/${group.total_alumnos} respuestas completas.`,
        time: `${group.porcentaje_completado}%`,
      }));
  }, [questionnaireProgress]);

  const nodeDistribution = useMemo(() => {
    if (!selectedStatsGroup) {
      return { aceptados: 0, rechazados: 0, invisibles: 0 };
    }

    return selectedStatsGroup.nodos.reduce(
      (acc, node) => {
        if (node.tipo === 'ACEPTADO') acc.aceptados += 1;
        else if (node.tipo === 'RECHAZADO') acc.rechazados += 1;
        else acc.invisibles += 1;
        return acc;
      },
      { aceptados: 0, rechazados: 0, invisibles: 0 }
    );
  }, [selectedStatsGroup]);

  const loadCommitteeData = useCallback(
    async (withRefreshIndicator = false) => {
      if (!selectedQuestionnaireId) return;

      if (withRefreshIndicator) setIsRefreshing(true);
      setIsLoading(true);
      setError(null);

      const globalFilters: CommitteeFilters = { cuestionario_id: selectedQuestionnaireId };
      if (selectedPeriodId) globalFilters.periodo_id = selectedPeriodId;
      if (selectedGroupId) globalFilters.grupo_id = selectedGroupId;
      if (selectedDivisionId) globalFilters.division_id = selectedDivisionId;
      if (selectedTutorId) globalFilters.tutor_id = selectedTutorId;

      const questionnaireFilters = {
        division_id: selectedDivisionId ?? undefined,
        grupo_id: selectedGroupId ?? undefined,
      };

      try {
        const [
          detailResponse,
          progressResponse,
          statsResponse,
          overviewResponse,
          overviewProgressResponse,
          overviewAlertsResponse,
          overviewCentralityResponse,
          graphsResponse,
        ] = await Promise.all([
          committeeService.getCuestionarioDetalle(selectedQuestionnaireId),
          committeeService.getCuestionarioProgreso(selectedQuestionnaireId, questionnaireFilters),
          committeeService.getCuestionarioEstadisticas(selectedQuestionnaireId, questionnaireFilters),
          committeeService.getOverview(globalFilters),
          committeeService.getOverviewProgreso(globalFilters),
          committeeService.getOverviewAlertas(globalFilters),
          committeeService.getOverviewCentralidad(globalFilters),
          committeeService.getGraphs(globalFilters),
        ]);

        setQuestionnaireDetail(detailResponse.cuestionario);
        setQuestionnaireProgress(progressResponse);
        setQuestionnaireStats(statsResponse);
        setOverview(overviewResponse);
        setOverviewProgress(overviewProgressResponse);
        setOverviewAlerts(overviewAlertsResponse);
        setOverviewCentrality(overviewCentralityResponse);
        setGraphs({ distribucion_por_grupo: graphsResponse.distribucion_por_grupo });
      } catch (err) {
        const message = extractErrorMessage(err, 'No se pudo cargar la informacion del Comite.');
        setError(message);
        showToast({
          type: 'error',
          message,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      selectedDivisionId,
      selectedGroupId,
      selectedPeriodId,
      selectedQuestionnaireId,
      selectedTutorId,
      showToast,
    ]
  );

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await committeeService.getCuestionarios({ todos: true });
      const available = response.cuestionarios ?? [];
      setAllQuestionnaires(available);
    } catch (err) {
      const message = extractErrorMessage(err, 'No se pudo obtener el catalogo de cuestionarios.');
      setError(message);
      showToast({
        type: 'error',
        message,
      });
      setAllQuestionnaires([]);
      setSelectedQuestionnaireId(null);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (questionnaires.length === 0) {
      if (selectedQuestionnaireId !== null) {
        setSelectedQuestionnaireId(null);
      }
      return;
    }

    if (!selectedQuestionnaireId || !questionnaires.some((item) => item.id === selectedQuestionnaireId)) {
      const fallbackId = questionnaires.find((item) => item.esta_activo)?.id ?? questionnaires[0]?.id ?? null;
      setSelectedGroupId(null);
      setSelectedQuestionnaireId(fallbackId);
    }
  }, [questionnaires, selectedQuestionnaireId]);

  useEffect(() => {
    if (!selectedQuestionnaireId) return;
    void loadCommitteeData();
  }, [loadCommitteeData, selectedQuestionnaireId]);

  const handleRefresh = useCallback(() => {
    void loadCommitteeData(true);
  }, [loadCommitteeData]);

  const handlePeriodChange = useCallback((nextPeriodId: number | null) => {
    setSelectedPeriodId(nextPeriodId);
    setSelectedGroupId(null);
  }, []);

  const handleQuestionnaireChange = useCallback((nextQuestionnaireId: number) => {
    setSelectedGroupId(null);
    setSelectedQuestionnaireId(nextQuestionnaireId);
  }, []);

  const handleGroupChange = useCallback((nextGroupId: number | null) => {
    setSelectedGroupId(nextGroupId);
  }, []);

  const handleApplyAdvancedFilters = useCallback(() => {
    const rawDivision = draftDivisionId.trim();
    const rawTutor = draftTutorId.trim();

    let nextDivisionId: number | null = null;
    let nextTutorId: number | null = null;

    if (rawDivision) {
      const parsedDivision = Number(rawDivision);
      if (!Number.isFinite(parsedDivision) || parsedDivision <= 0) {
        showToast({
          type: 'warning',
          message: 'division_id debe ser un numero entero positivo.',
        });
        return;
      }
      nextDivisionId = parsedDivision;
    }

    if (rawTutor) {
      const parsedTutor = Number(rawTutor);
      if (!Number.isFinite(parsedTutor) || parsedTutor <= 0) {
        showToast({
          type: 'warning',
          message: 'tutor_id debe ser un numero entero positivo.',
        });
        return;
      }
      nextTutorId = parsedTutor;
    }

    setSelectedDivisionId(nextDivisionId);
    setSelectedTutorId(nextTutorId);
  }, [draftDivisionId, draftTutorId, showToast]);

  const handleClearAdvancedFilters = useCallback(() => {
    setDraftDivisionId('');
    setDraftTutorId('');
    setSelectedDivisionId(null);
    setSelectedTutorId(null);
  }, []);

  const topbarControls = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedPeriodId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            handlePeriodChange(value ? Number(value) : null);
          }}
          className="min-w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm"
          disabled={periodOptions.length === 0}
        >
          <option value="">Todos los periodos</option>
          {periodOptions.map((period) => (
            <option key={period.id} value={period.id}>
              {period.label}
            </option>
          ))}
        </select>

        <select
          value={selectedQuestionnaireId ?? ''}
          onChange={(event) => handleQuestionnaireChange(Number(event.target.value))}
          className="min-w-60 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm"
          disabled={questionnaires.length === 0}
        >
          {questionnaires.length === 0 && <option value="">Sin cuestionarios disponibles</option>}
          {questionnaires.map((item) => (
            <option key={item.id} value={item.id}>
              {item.titulo}
              {item.esta_activo ? ' (activo)' : ''}
            </option>
          ))}
        </select>

        <select
          value={selectedGroupId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            handleGroupChange(value ? Number(value) : null);
          }}
          className="min-w-52 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm"
          disabled={groupOptions.length === 0}
        >
          <option value="">Todos los grupos</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>

        <input
          value={draftDivisionId}
          onChange={(event) => setDraftDivisionId(event.target.value)}
          className="w-34 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm"
          placeholder="division_id"
          inputMode="numeric"
        />

        <input
          value={draftTutorId}
          onChange={(event) => setDraftTutorId(event.target.value)}
          className="w-30 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm"
          placeholder="tutor_id"
          inputMode="numeric"
        />

        <button
          type="button"
          onClick={handleApplyAdvancedFilters}
          className="rounded-md border border-[#0B5A4A]/35 bg-white px-3 py-2 text-sm font-semibold text-[#0B5A4A] hover:bg-emerald-50"
        >
          Aplicar filtros
        </button>

        <button
          type="button"
          onClick={handleClearAdvancedFilters}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || !selectedQuestionnaireId}
          className="inline-flex items-center gap-2 rounded-md border border-[#0B5A4A]/35 bg-white px-3 py-2 text-sm font-semibold text-[#0B5A4A] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>
    ),
    [
      draftDivisionId,
      draftTutorId,
      groupOptions,
      handleApplyAdvancedFilters,
      handleClearAdvancedFilters,
      handleGroupChange,
      handlePeriodChange,
      handleQuestionnaireChange,
      handleRefresh,
      isRefreshing,
      periodOptions,
      questionnaires,
      selectedPeriodId,
      selectedGroupId,
      selectedQuestionnaireId,
    ]
  );

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: topbarControls,
      actions: [],
      infoText: null,
      mobileAction: null,
    });

    return () => {
      resetTopbar();
    };
  }, [resetTopbar, setTopbarConfig, topbarControls]);

  const hasQuestionnaires = questionnaires.length > 0;
  const appliedFilterChips = useMemo(() => {
    const chips: string[] = [];

    if (selectedPeriodId) {
      const period = periodOptions.find((item) => item.id === selectedPeriodId);
      chips.push(`Periodo: ${period?.label ?? selectedPeriodId}`);
    }
    if (selectedDivisionId) chips.push(`division_id: ${selectedDivisionId}`);
    if (selectedTutorId) chips.push(`tutor_id: ${selectedTutorId}`);
    if (selectedGroupId) {
      const group = groupOptions.find((item) => item.id === selectedGroupId);
      chips.push(`Grupo: ${group?.label ?? selectedGroupId}`);
    }

    return chips;
  }, [groupOptions, periodOptions, selectedDivisionId, selectedGroupId, selectedPeriodId, selectedTutorId]);

  const isStandaloneView = mode !== 'full';
  const headerByMode: Record<Exclude<CommitteeViewMode, 'full'>, { title: string; subtitle: string }> = {
    panel: {
      title: 'Panel del Comite',
      subtitle: 'Monitoreo global institucional con indicadores consolidados por cuestionario.',
    },
    cuestionarios: {
      title: 'Gestion de Cuestionarios',
      subtitle: 'Seguimiento operativo de avance y contenido de cuestionarios institucionales.',
    },
    sociograma: {
      title: 'Grafo Global',
      subtitle: 'Visualizacion sociometrica consolidada por cuestionario y grupo.',
    },
  };
  const currentHeader =
    mode === 'full'
      ? {
          title: 'Comite de Analitica Sociometrica',
          subtitle: 'Vista global de resultados agregados por cuestionario, periodo y grupo, en modo solo lectura.',
        }
      : headerByMode[mode];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-400/35 bg-gradient-to-r from-[#0B5A4A] to-[#13715D] px-6 py-5 text-white shadow-sm">
        <h2 className="text-2xl font-extrabold">{currentHeader.title}</h2>
        <p className="mt-1 text-sm text-white/85">{currentHeader.subtitle}</p>
      </section>

      {!isStandaloneView && (
        <nav className="flex flex-wrap items-center gap-2">
          <TabButton
            label="Resumen"
            icon={<BarChart3 size={16} />}
            isActive={activeTab === 'resumen'}
            onClick={() => setActiveTab('resumen')}
          />
          <TabButton
            label="Cuestionarios"
            icon={<Rows3 size={16} />}
            isActive={activeTab === 'cuestionarios'}
            onClick={() => setActiveTab('cuestionarios')}
          />
          <TabButton
            label="Sociograma"
            icon={<Network size={16} />}
            isActive={activeTab === 'sociograma'}
            onClick={() => setActiveTab('sociograma')}
          />
        </nav>
      )}

      {appliedFilterChips.length > 0 && (
        <section className="rounded-xl border border-emerald-600/25 bg-white px-4 py-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filtros activos</p>
          <div className="flex flex-wrap gap-2">
            {appliedFilterChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1 text-xs font-medium text-[#0B5A4A]"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!hasQuestionnaires && !isLoading && (
        <section className="rounded-xl border border-emerald-600/25 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-base font-semibold text-[#0B5A4A]">No hay cuestionarios disponibles para el Comite.</p>
          <p className="mt-1 text-sm text-gray-500">
            Cuando exista al menos un cuestionario en backend, esta vista mostrara los indicadores globales.
          </p>
        </section>
      )}

      {hasQuestionnaires && isLoading && (
        <section className="rounded-xl border border-emerald-600/25 bg-white px-6 py-10 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-[#0B5A4A]">
            <Loader2 size={18} className="animate-spin" />
            <p className="font-semibold">Cargando dashboard del Comite...</p>
          </div>
        </section>
      )}

      {hasQuestionnaires && !isLoading && activeTab === 'resumen' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Periodo" value={overview?.periodo.codigo ?? '-'} icon={<Rows3 size={16} />} />
              <KpiCard
                title="Grupos analizados"
                value={overview?.total_grupos ?? 0}
                icon={<Users size={16} />}
              />
              <KpiCard
                title="Aislados detectados"
                value={overviewAlerts?.alertas_aislados.total_global ?? 0}
                icon={<AlertTriangle size={16} />}
              />
              <KpiCard
                title="Completado global"
                value={`${overviewProgress?.porcentaje_completado_global ?? 0}%`}
                icon={<BarChart3 size={16} />}
              />
            </div>

            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Distribucion por grupo</h3>
              <p className="mb-4 text-sm text-gray-500">
                Clasificacion de alumnos por estado (aceptado, rechazado e invisible).
              </p>

              <div className="space-y-4">
                {(graphs?.distribucion_por_grupo ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay datos de distribucion disponibles.</p>
                ) : (
                  (graphs?.distribucion_por_grupo ?? []).map((item) => (
                    <DistributionRow key={item.grupo_id} item={item} />
                  ))
                )}
              </div>
            </article>

            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Alertas por grupo</h3>
              <p className="mb-4 text-sm text-gray-500">
                Grupos con alumnos invisibles (sin elecciones positivas recibidas).
              </p>

              {(overviewAlerts?.alertas_aislados.por_grupo ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No se detectaron alertas de aislados con los filtros actuales.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-130 text-left text-sm">
                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-2 py-2">Grupo</th>
                        <th className="px-2 py-2">Division</th>
                        <th className="px-2 py-2">Aislados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overviewAlerts?.alertas_aislados.por_grupo ?? []).map((row) => (
                        <tr key={row.grupo_id} className="border-b border-gray-100">
                          <td className="px-2 py-2 font-semibold text-gray-800">{row.grupo_clave}</td>
                          <td className="px-2 py-2 text-gray-600">{row.division}</td>
                          <td className="px-2 py-2 text-red-700">{row.total_aislados}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <ResponsesProgressCard
              total={overviewProgress?.total_alumnos ?? 0}
              completed={overviewProgress?.total_completados ?? 0}
            />

            <ClassificationCard
              title="Top de centralidad"
              subtitle="Alumnos con mas elecciones positivas"
              items={centralityItems}
              emptyMessage="No hay datos de centralidad para mostrar."
            />

            <ActivityLogCard
              items={activityItems}
              emptyMessage="Sin actividad de avance por grupo para este cuestionario."
            />
          </aside>
        </section>
      )}

      {hasQuestionnaires && !isLoading && activeTab === 'cuestionarios' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Detalle del cuestionario seleccionado</h3>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-gray-500">Titulo</p>
                  <p className="font-semibold text-gray-800">{questionnaireDetail?.titulo ?? 'No disponible'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-gray-500">Periodo</p>
                  <p className="font-semibold text-gray-800">{questionnaireDetail?.periodo_codigo ?? 'No disponible'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-gray-500">Inicio</p>
                  <p className="font-semibold text-gray-800">{formatDate(questionnaireDetail?.fecha_inicio)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-gray-500">Fin</p>
                  <p className="font-semibold text-gray-800">{formatDate(questionnaireDetail?.fecha_fin)}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                {questionnaireDetail?.descripcion || 'Sin descripcion registrada para este cuestionario.'}
              </p>
            </article>

            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Progreso por grupo</h3>
              <p className="mb-4 text-sm text-gray-500">
                Resumen de avance de respuestas por cada grupo del periodo del cuestionario.
              </p>

              {(questionnaireProgress?.grupos ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No hay grupos para mostrar progreso.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-170 text-left text-sm">
                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-2 py-2">Grupo</th>
                        <th className="px-2 py-2">Division</th>
                        <th className="px-2 py-2">Programa</th>
                        <th className="px-2 py-2">Completados</th>
                        <th className="px-2 py-2">En progreso</th>
                        <th className="px-2 py-2">Pendientes</th>
                        <th className="px-2 py-2">% avance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(questionnaireProgress?.grupos ?? []).map((group) => (
                        <tr key={group.grupo_id} className="border-b border-gray-100">
                          <td className="px-2 py-2 font-semibold text-gray-800">{group.grupo_clave}</td>
                          <td className="px-2 py-2 text-gray-600">{group.division || 'No disponible'}</td>
                          <td className="px-2 py-2 text-gray-600">{group.programa || 'No disponible'}</td>
                          <td className="px-2 py-2 text-emerald-700">
                            {group.completados}/{group.total_alumnos}
                          </td>
                          <td className="px-2 py-2 text-amber-700">{group.en_progreso}</td>
                          <td className="px-2 py-2 text-gray-700">{group.pendientes}</td>
                          <td className="px-2 py-2 font-semibold text-[#0B5A4A]">
                            {group.porcentaje_completado}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Catalogo de cuestionarios</h3>
              <p className="mb-4 text-sm text-gray-500">Listado completo para consulta institucional.</p>

              <ul className="space-y-2">
                {questionnaires.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleQuestionnaireChange(item.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        item.id === selectedQuestionnaireId
                          ? 'border-[#0B5A4A]/70 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-800">{item.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {item.periodo_codigo} · Preguntas: {item.total_preguntas}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B5A4A]">Preguntas del cuestionario</h3>
              <p className="mb-4 text-sm text-gray-500">
                Previsualizacion de reactivos del cuestionario actual.
              </p>

              {(questionnaireDetail?.preguntas ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">Este cuestionario no tiene preguntas asociadas.</p>
              ) : (
                <ul className="space-y-2">
                  {(questionnaireDetail?.preguntas ?? []).slice(0, 12).map((item) => (
                    <li key={item.id} className="rounded-md border border-gray-200 px-3 py-2">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        {item.pregunta.tipo} · {item.pregunta.polaridad}
                      </p>
                      <p className="text-sm font-medium text-gray-800">{item.pregunta.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </aside>
        </section>
      )}

      {hasQuestionnaires && !isLoading && activeTab === 'sociograma' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <article className="rounded-xl border border-emerald-600/25 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B5A4A]">Grafo sociometrico consolidado</h3>
                  <p className="text-sm text-gray-500">
                    {selectedStatsGroup
                      ? `Grupo ${selectedStatsGroup.grupo_clave} · Respuestas completas: ${selectedStatsGroup.respuestas_completas}/${selectedStatsGroup.total_alumnos}`
                      : 'Selecciona un grupo para visualizar su sociograma.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNodeNames((current) => !current)}
                  className="rounded-md border border-[#0B5A4A]/35 bg-white px-3 py-2 text-sm font-semibold text-[#0B5A4A] hover:bg-emerald-50"
                >
                  {showNodeNames ? 'Ocultar nombres' : 'Mostrar nombres'}
                </button>
              </div>
            </article>

            <SociogramGraph
              data={graphData}
              className="min-h-140"
              showNodeNames={showNodeNames}
              onToggleNodeNames={() => setShowNodeNames((current) => !current)}
            />
          </div>

          <aside className="space-y-6">
            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <SociogramLegend />
            </article>

            <article className="rounded-xl border border-emerald-600/25 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-[#0B5A4A]">Distribucion del grupo</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Aceptado</span>
                  <span className="font-semibold text-emerald-700">{nodeDistribution.aceptados}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Rechazado</span>
                  <span className="font-semibold text-red-700">{nodeDistribution.rechazados}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Invisible</span>
                  <span className="font-semibold text-gray-700">{nodeDistribution.invisibles}</span>
                </p>
              </div>
            </article>
          </aside>
        </section>
      )}
    </div>
  );
}

export default CommitteeDashboardView;
