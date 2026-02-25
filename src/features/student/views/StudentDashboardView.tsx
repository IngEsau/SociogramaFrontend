/**
 * Vista del Dashboard de Estudiante
 *
 * Esta es la vista principal para usuarios con rol ALUMNO.
 * Muestra cuestionarios disponibles, progreso y datos del alumno.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useTopbarStore } from '../../../store';
import { studentService } from '../services';
import type { StudentQuestionnaireWithProgress } from '../types';

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

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    return axiosError.response?.status;
  }
  return undefined;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentDashboardView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  const [pendingQuestionnaires, setPendingQuestionnaires] = useState<StudentQuestionnaireWithProgress[]>([]);
  const [completedQuestionnaires, setCompletedQuestionnaires] = useState<StudentQuestionnaireWithProgress[]>([]);
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      actions: [],
      infoText: null,
      customContent: null,
      mobileAction: null,
    });

    return () => resetTopbar();
  }, [setTopbarConfig, resetTopbar]);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const available = await studentService.getAvailableQuestionnaires();
        if (cancelled) return;

        setCurrentGroup(available.grupo_actual?.clave ?? null);
        setEmptyMessage(available.message ?? '');

        const questionnairesWithProgress = await Promise.all(
          available.cuestionarios.map(async (cuestionario): Promise<StudentQuestionnaireWithProgress> => {
            try {
              const progress = await studentService.getMyProgress(cuestionario.id);
              return {
                ...cuestionario,
                estado: progress.estado,
                progreso: progress.progreso,
                preguntas_respondidas: progress.preguntas_respondidas,
                estado_fecha_inicio: progress.fecha_inicio,
                fecha_completado: progress.fecha_completado,
              };
            } catch (progressError) {
              // 404 significa que aun no existe registro de avance para el alumno.
              if (extractStatusCode(progressError) === 404) {
                return {
                  ...cuestionario,
                  estado: 'PENDIENTE',
                  progreso: 0,
                  preguntas_respondidas: 0,
                  estado_fecha_inicio: null,
                  fecha_completado: null,
                };
              }

              throw progressError;
            }
          })
        );

        if (cancelled) return;

        setPendingQuestionnaires(
          questionnairesWithProgress.filter((item) => item.estado !== 'COMPLETADO')
        );
        setCompletedQuestionnaires(
          questionnairesWithProgress.filter((item) => item.estado === 'COMPLETADO')
        );
      } catch (fetchError) {
        if (cancelled) return;

        setPendingQuestionnaires([]);
        setCompletedQuestionnaires([]);
        setError(
          extractErrorMessage(
            fetchError,
            'No fue posible obtener tus cuestionarios en este momento.'
          )
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const studentName = useMemo(() => {
    if (user?.nombre_completo) return user.nombre_completo;
    return `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Estudiante';
  }, [user?.first_name, user?.last_name, user?.nombre_completo]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-emerald-600/35 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-500">Cargando información del alumno...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-emerald-600/35 bg-white p-6 shadow-sm xl:col-span-2">
        <h1 className="mb-2 text-2xl font-semibold text-[#0F7E3C]">
          ¡Bienvenido, {user?.first_name || 'Estudiante'}!
        </h1>
        <p className="text-gray-600">
          Aquí podrás ver y responder las encuestas sociométricas asignadas.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Grupo activo: <span className="font-semibold text-[#313131]">{currentGroup ?? 'Sin grupo activo'}</span>
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-emerald-600/35 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F7E3C]">Encuestas Pendientes</h2>
        {pendingQuestionnaires.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p>No tienes encuestas pendientes</p>
            {emptyMessage && <p className="mt-2 text-xs text-gray-400">{emptyMessage}</p>}
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingQuestionnaires.map((survey) => (
              <li key={survey.id} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                <p className="font-semibold text-[#313131]">{survey.titulo}</p>
                <p className="mt-1 text-xs text-gray-500">{survey.periodo_nombre}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {survey.preguntas_respondidas}/{survey.total_preguntas} preguntas respondidas
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full bg-[#0F7E3C] transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, survey.progreso))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Progreso: {Math.round(survey.progreso)}%</span>
                  <span>Disponible hasta: {formatDate(survey.fecha_fin)}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/student-form/${survey.id}`)}
                    className="rounded-md bg-[#0F7E3C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c6a33]"
                  >
                    Responder
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-emerald-600/35 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0F7E3C]">Encuestas Completadas</h2>
        {completedQuestionnaires.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p>Aún no has completado ninguna encuesta</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {completedQuestionnaires.map((survey) => (
              <li key={survey.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-[#313131]">{survey.titulo}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Completado: {survey.fecha_completado ? formatDate(survey.fecha_completado) : 'Sin fecha registrada'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {survey.total_preguntas}/{survey.total_preguntas} preguntas respondidas
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-emerald-600/35 bg-white p-6 shadow-sm xl:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-[#0F7E3C]">Tu Información</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-gray-500">Nombre:</span>
            <p className="font-medium text-[#313131]">{studentName}</p>
          </div>
          <div>
            <span className="text-gray-500">Correo:</span>
            <p className="font-medium text-[#313131]">{user?.email || 'No disponible'}</p>
          </div>
          {user?.alumno && (
            <>
              <div>
                <span className="text-gray-500">Matrícula:</span>
                <p className="font-medium text-[#313131]">{user.alumno.matricula}</p>
              </div>
              <div>
                <span className="text-gray-500">Programa:</span>
                <p className="font-medium text-[#313131]">{user.alumno.programa}</p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboardView;
