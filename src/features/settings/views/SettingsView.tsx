import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, RefreshCw, ShieldCheck, UserRound, Users } from 'lucide-react';
import { api } from '../../../core/api/axios';
import { normalizeRole } from '../../../core/routing';
import type { UserResponse } from '../../../core/types/api.types';
import { useAuthStore, useTopbarStore } from '../../../store';
import { authService } from '../../auth/services';

interface ActivePeriodSummary {
  id: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

interface TutorGroupSummary {
  id: number;
  clave: string;
  periodo_codigo?: string;
  periodo_nombre?: string;
  total_alumnos: number;
  alumnos: TutorStudentSummary[];
}

interface TutorStudentSummary {
  promedio: number | null;
}

interface StudentSummary {
  groupKey: string | null;
  totalQuestionnaires: number;
  activeQuestionnaires: number;
  message: string | null;
}

type PasswordFeedbackType = 'success' | 'error' | 'warning';

interface PasswordFeedback {
  type: PasswordFeedbackType;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asRole(value: unknown, fallback: UserResponse['rol']): UserResponse['rol'] {
  if (
    value === 'ADMIN' ||
    value === 'DOCENTE' ||
    value === 'ALUMNO' ||
    value === 'ACADEMICO' ||
    value === 'COMITE'
  ) {
    return value;
  }
  return fallback;
}

function asGenero(value: unknown, fallback: UserResponse['genero']): UserResponse['genero'] {
  if (value === 'Masculino' || value === 'Femenino' || value === 'Otro') {
    return value;
  }
  return fallback;
}

function parseAlumnoInfo(value: unknown): UserResponse['alumno'] | undefined {
  if (!isRecord(value)) return undefined;

  return {
    id: asNumber(value.id),
    matricula: asString(value.matricula),
    semestre_actual: asNumber(value.semestre_actual),
    promedio: typeof value.promedio === 'number' ? value.promedio : null,
    estatus: asString(value.estatus),
    programa: asString(value.programa),
  };
}

function parseDocenteInfo(value: unknown): UserResponse['docente'] | undefined {
  if (!isRecord(value)) return undefined;

  return {
    id: asNumber(value.id),
    profesor_id: asString(value.profesor_id),
    es_tutor: asBoolean(value.es_tutor),
    division: asString(value.division),
  };
}

function parseProfileResponse(payload: unknown, fallback: UserResponse | null): UserResponse | null {
  if (!isRecord(payload)) return fallback;

  const source = isRecord(payload.user) ? payload.user : payload;
  if (!isRecord(source)) return fallback;

  const fallbackUser = fallback ?? {
    id: 0,
    username: '',
    email: '',
    nombre_completo: '',
    first_name: '',
    last_name: '',
    rol: 'ALUMNO' as const,
    genero: 'Otro' as const,
    is_staff: false,
  };

  const firstName = asString(source.first_name, fallbackUser.first_name);
  const lastName = asString(source.last_name, fallbackUser.last_name);
  const fullName =
    asString(source.nombre_completo, '').trim() ||
    `${firstName} ${lastName}`.trim() ||
    fallbackUser.nombre_completo ||
    fallbackUser.username;

  const parsedUser: UserResponse = {
    id: asNumber(source.id, fallbackUser.id),
    username: asString(source.username, fallbackUser.username),
    email: asString(source.email, fallbackUser.email),
    nombre_completo: fullName,
    first_name: firstName,
    last_name: lastName,
    rol: asRole(source.rol, asRole(payload.rol, fallbackUser.rol)),
    genero: asGenero(source.genero, fallbackUser.genero),
    is_staff: asBoolean(source.is_staff, fallbackUser.is_staff),
    is_active: asBoolean(source.is_active, fallbackUser.is_active ?? true),
  };

  const telefono = asString(source.telefono, fallbackUser.telefono ?? '').trim();
  const fechaNacimiento = asString(
    source.fecha_nacimiento,
    fallbackUser.fecha_nacimiento ?? ''
  ).trim();

  if (telefono) parsedUser.telefono = telefono;
  if (fechaNacimiento) parsedUser.fecha_nacimiento = fechaNacimiento;

  const alumnoInfo = parseAlumnoInfo(source.alumno) ?? parseAlumnoInfo(payload.alumno) ?? fallbackUser.alumno;
  const docenteInfo = parseDocenteInfo(source.docente) ?? parseDocenteInfo(payload.docente) ?? fallbackUser.docente;

  if (alumnoInfo) parsedUser.alumno = alumnoInfo;
  if (docenteInfo) parsedUser.docente = docenteInfo;

  return parsedUser;
}

function parseActivePeriod(payload: unknown): ActivePeriodSummary | null {
  if (!isRecord(payload)) return null;

  const source =
    isRecord(payload.periodo)
      ? payload.periodo
      : typeof payload.codigo === 'string' && typeof payload.nombre === 'string'
        ? payload
        : null;

  if (!source) return null;

  return {
    id: asNumber(source.id),
    codigo: asString(source.codigo),
    nombre: asString(source.nombre),
    fecha_inicio: asString(source.fecha_inicio),
    fecha_fin: asString(source.fecha_fin),
    activo: asBoolean(source.activo, true),
  };
}

function parseTutorGroup(value: unknown): TutorGroupSummary | null {
  if (!isRecord(value)) return null;

  const clave = asString(value.clave).trim();
  if (!clave) return null;
  const periodoCodigo = asString(value.periodo_codigo).trim();
  const periodoNombre = asString(value.periodo_nombre).trim();
  const alumnos = Array.isArray(value.alumnos)
    ? value.alumnos
      .map((alumno) => parseTutorStudent(alumno))
      .filter((alumno): alumno is TutorStudentSummary => alumno !== null)
    : [];

  return {
    id: asNumber(value.id),
    clave,
    periodo_codigo: periodoCodigo || undefined,
    periodo_nombre: periodoNombre || undefined,
    total_alumnos: asNumber(value.total_alumnos),
    alumnos,
  };
}

function parseTutorStudent(value: unknown): TutorStudentSummary | null {
  if (!isRecord(value)) return null;

  const nestedAlumno = isRecord(value.alumno) ? value.alumno : null;
  const promedio =
    asNullableNumber(value.promedio) ??
    asNullableNumber(value.alumno_promedio) ??
    asNullableNumber(value.calificacion_promedio) ??
    asNullableNumber(nestedAlumno?.promedio);

  return { promedio };
}

function parseTutorGroups(payload: unknown): TutorGroupSummary[] {
  const groupsCandidate = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.grupos)
      ? payload.grupos
      : [];

  return groupsCandidate
    .map((group) => parseTutorGroup(group))
    .filter((group): group is TutorGroupSummary => group !== null);
}

function parseStudentSummary(payload: unknown): StudentSummary | null {
  if (!isRecord(payload)) return null;

  const questionnaires = Array.isArray(payload.cuestionarios) ? payload.cuestionarios : [];
  const activeCount = questionnaires.filter(
    (item) =>
      isRecord(item) &&
      (item.esta_activo === true || item.activo === true)
  ).length;

  const groupKey = isRecord(payload.grupo_actual)
    ? asString(payload.grupo_actual.clave).trim()
    : '';

  return {
    groupKey: groupKey || null,
    totalQuestionnaires: questionnaires.length,
    activeQuestionnaires: activeCount,
    message: asString(payload.message, '').trim() || null,
  };
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBirthDate(value?: string | null): string {
  if (!value) return 'No disponible';
  return formatDate(value);
}

function getDaysBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getDaysUntil(dateValue?: string | null): number | null {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / 86400000);
}

function getInitials(name?: string): string {
  const cleaned = (name ?? '').trim();
  if (!cleaned) return 'US';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function getPasswordFeedbackClasses(type: PasswordFeedbackType): string {
  if (type === 'success') return 'border-green-300 bg-green-50 text-green-700';
  if (type === 'warning') return 'border-yellow-300 bg-yellow-50 text-yellow-800';
  return 'border-red-300 bg-red-50 text-red-700';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 break-words">{value}</p>
    </div>
  );
}

export function SettingsView() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [roleDataError, setRoleDataError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<ActivePeriodSummary | null>(null);
  const [tutorGroups, setTutorGroups] = useState<TutorGroupSummary[]>([]);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<PasswordFeedback | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFilename, setAvatarFilename] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const role = useMemo(() => normalizeRole(user?.rol), [user?.rol]);

  const roleLabel = useMemo(() => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'DOCENTE':
        return 'Docente';
      case 'ALUMNO':
        return 'Alumno';
      case 'COMITE':
        return 'Comité';
      default:
        return 'Usuario';
    }
  }, [role]);

  const tutorTotalStudents = useMemo(
    () => tutorGroups.reduce((sum, group) => sum + group.total_alumnos, 0),
    [tutorGroups]
  );

  const tutorAverageStudents = useMemo(() => {
    if (tutorGroups.length === 0) return 0;
    return Math.round(tutorTotalStudents / tutorGroups.length);
  }, [tutorGroups.length, tutorTotalStudents]);

  const tutorAverageGrade = useMemo(() => {
    const grades = tutorGroups
      .flatMap((group) => group.alumnos)
      .map((alumno) => alumno.promedio)
      .filter((promedio): promedio is number => promedio !== null);

    if (grades.length === 0) return null;

    const sum = grades.reduce((acc, value) => acc + value, 0);
    return sum / grades.length;
  }, [tutorGroups]);

  const tutorGradesSummary = useMemo(() => {
    const students = tutorGroups.flatMap((group) => group.alumnos);
    const withGrade = students.filter((alumno) => alumno.promedio !== null).length;
    return {
      withGrade,
      total: students.length,
    };
  }, [tutorGroups]);

  const tutorPeriodsCount = useMemo(() => {
    const unique = new Set(
      tutorGroups
        .map((group) => group.periodo_codigo || group.periodo_nombre || '')
        .filter((value) => value.trim().length > 0)
    );
    return unique.size;
  }, [tutorGroups]);

  const adminPeriodDurationDays = useMemo(
    () => getDaysBetween(activePeriod?.fecha_inicio, activePeriod?.fecha_fin),
    [activePeriod?.fecha_inicio, activePeriod?.fecha_fin]
  );

  const adminDaysRemaining = useMemo(
    () => getDaysUntil(activePeriod?.fecha_fin),
    [activePeriod?.fecha_fin]
  );

  const studentInactiveQuestionnaires = useMemo(
    () => Math.max(
      0,
      (studentSummary?.totalQuestionnaires ?? 0) - (studentSummary?.activeQuestionnaires ?? 0)
    ),
    [studentSummary?.activeQuestionnaires, studentSummary?.totalQuestionnaires]
  );

  const loadRoleData = useCallback(async (activeUser: UserResponse | null) => {
    setRoleDataError(null);
    setActivePeriod(null);
    setTutorGroups([]);
    setStudentSummary(null);

    const normalizedRole = normalizeRole(activeUser?.rol);
    if (!normalizedRole) return;

    try {
      if (normalizedRole === 'ADMIN' || normalizedRole === 'COMITE') {
        const { data } = await api.get('/periodos/activo/');
        setActivePeriod(parseActivePeriod(data));
        return;
      }

      if (normalizedRole === 'DOCENTE') {
        const { data } = await api.get('/academic/my-groups/');
        setTutorGroups(parseTutorGroups(data));
        return;
      }

      if (normalizedRole === 'ALUMNO') {
        const { data } = await api.get('/student/cuestionarios/disponibles/');
        setStudentSummary(parseStudentSummary(data));
      }
    } catch (error) {
      setRoleDataError(
        extractErrorMessage(error, 'No se pudo cargar la configuración de tu rol.')
      );
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    setIsRefreshing(true);
    setProfileError(null);

    const fallbackUser = useAuthStore.getState().user;
    let activeUser = fallbackUser;

    try {
      const { data } = await api.get('/auth/me/');
      const parsedProfile = parseProfileResponse(data, fallbackUser);
      if (parsedProfile) {
        setUser(parsedProfile);
        activeUser = parsedProfile;
      } else {
        setProfileError('No fue posible interpretar la respuesta del perfil.');
      }
    } catch (error) {
      setProfileError(
        extractErrorMessage(error, 'No se pudo actualizar la información del perfil.')
      );
    }

    await loadRoleData(activeUser);
    setIsRefreshing(false);
  }, [loadRoleData, setUser]);

  useEffect(() => {
    setTopbarConfig({
      actions: [],
      hideDefaultSelectors: true,
      infoText: null,
      customContent: null,
      mobileAction: null,
    });

    return () => resetTopbar();
  }, [resetTopbar, setTopbarConfig]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Solo se permiten imágenes (JPG, PNG, WEBP).');
      event.target.value = '';
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setAvatarError(`La imagen debe pesar máximo ${MAX_SIZE_MB} MB.`);
      event.target.value = '';
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return nextUrl;
    });
    setAvatarFilename(file.name);
    setAvatarError(null);
    event.target.value = '';
  };

  const clearAvatarPreview = () => {
    setAvatarPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
    setAvatarFilename(null);
    setAvatarError(null);
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      const message = 'Todos los campos de contraseña son obligatorios.';
      setPasswordFeedback({ type: 'warning', message });
      return;
    }

    if (newPassword.length < 8) {
      const message = 'La nueva contraseña debe tener al menos 8 caracteres.';
      setPasswordFeedback({ type: 'warning', message });
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = 'La confirmación de contraseña no coincide.';
      setPasswordFeedback({ type: 'error', message });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: confirmPassword,
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({
        type: 'success',
        message: 'Contraseña actualizada correctamente.',
      });
    } catch (error) {
      const message = extractErrorMessage(error, 'No se pudo actualizar la contraseña.');
      setPasswordFeedback({ type: 'error', message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="ml-0 mr-auto w-full space-y-6">
      <section className="rounded-xl border border-emerald-600/30 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B5A4A]">Configuración</h1>
            <p className="mt-1 text-sm text-gray-600">
              Ajustes básicos para tu perfil
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshSettings()}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[#0B5A4A]/30 px-4 py-2 text-sm font-semibold text-[#0B5A4A] transition hover:bg-[#0B5A4A]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm h-full flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            {(role === 'ADMIN' || role === 'COMITE') && <CalendarClock size={18} className="text-[#0B5A4A]" />}
            {role === 'DOCENTE' && <Users size={18} className="text-[#0B5A4A]" />}
            {role === 'ALUMNO' && <ClipboardList size={18} className="text-[#0B5A4A]" />}
            <h2 className="text-lg font-semibold text-gray-900">Configuración por rol</h2>
          </div>

          {roleDataError && (
            <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {roleDataError}
            </p>
          )}

          {(role === 'ADMIN' || role === 'COMITE') && (
            <>
              <p className="text-sm text-gray-600">
                Estado actual del periodo académico activo.
              </p>
              {activePeriod ? (
                <div className="mt-4 space-y-3">
                  <InfoRow label="Código" value={activePeriod.codigo || 'No disponible'} />
                  <InfoRow label="Nombre" value={activePeriod.nombre || 'No disponible'} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Inicio" value={formatDate(activePeriod.fecha_inicio)} />
                    <InfoRow label="Fin" value={formatDate(activePeriod.fecha_fin)} />
                  </div>
                  <InfoRow label="Estado" value={activePeriod.activo ? 'Activo' : 'Inactivo'} />
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  No hay un periodo activo configurado en este momento.
                </p>
              )}
            </>
          )}

          {role === 'DOCENTE' && (
            <>
              <p className="text-sm text-gray-600">
                Resumen dinámico de grupos asignados a tu perfil tutor.
              </p>

              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total de grupos</p>
                <p className="text-xl font-semibold text-gray-900">{tutorGroups.length}</p>
              </div>

              {tutorGroups.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {tutorGroups.slice(0, 8).map((group) => (
                    <li key={group.id} className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">{group.clave}</p>
                      <p className="text-xs text-gray-600">
                        {group.periodo_codigo || group.periodo_nombre || 'Periodo no disponible'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Alumnos: {group.total_alumnos}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  No se encontraron grupos asignados para este usuario.
                </p>
              )}
            </>
          )}

          {role === 'ALUMNO' && (
            <>
              <p className="text-sm text-gray-600">
                Resumen de tu grupo activo y encuestas disponibles.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoRow
                  label="Grupo actual"
                  value={studentSummary?.groupKey ?? 'Sin grupo activo'}
                />
                <InfoRow
                  label="Cuestionarios disponibles"
                  value={String(studentSummary?.totalQuestionnaires ?? 0)}
                />
                <InfoRow
                  label="Activos"
                  value={String(studentSummary?.activeQuestionnaires ?? 0)}
                />
                <InfoRow
                  label="Estado"
                  value={studentSummary?.totalQuestionnaires ? 'Con actividad' : 'Sin actividad'}
                />
              </div>

              {studentSummary?.message && (
                <p className="mt-4 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {studentSummary.message}
                </p>
              )}
            </>
          )}

          {!role && (
            <p className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Tu rol no pudo ser identificado para mostrar configuración específica.
            </p>
          )}

          <div className="mt-6 rounded-lg border border-[#0B5A4A]/20 bg-[#0B5A4A]/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0B5A4A]">
              Indicadores rápidos
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(role === 'ADMIN' || role === 'COMITE') && (
                <>
                  <InfoRow
                    label="Duración del periodo"
                    value={adminPeriodDurationDays === null ? 'No disponible' : `${adminPeriodDurationDays} días`}
                  />
                  <InfoRow
                    label="Días restantes"
                    value={
                      adminDaysRemaining === null
                        ? 'No disponible'
                        : adminDaysRemaining < 0
                          ? 'Periodo finalizado'
                          : `${adminDaysRemaining} días`
                    }
                  />
                </>
              )}

              {role === 'DOCENTE' && (
                <>
                  <InfoRow label="Alumnos asignados" value={String(tutorTotalStudents)} />
                  <InfoRow label="Promedio de alumnos por grupo" value={String(tutorAverageStudents)} />
                  <InfoRow
                    label="Promedio de calificaciones"
                    value={
                      tutorAverageGrade === null
                        ? tutorGradesSummary.total > 0
                          ? `Sin promedios cargados (${tutorGradesSummary.withGrade}/${tutorGradesSummary.total})`
                          : 'No disponible'
                        : tutorAverageGrade.toFixed(1)
                    }
                  />
                  <InfoRow label="Periodos con grupo" value={String(tutorPeriodsCount)} />
                </>
              )}

              {role === 'ALUMNO' && (
                <>
                  <InfoRow label="Activos" value={String(studentSummary?.activeQuestionnaires ?? 0)} />
                  <InfoRow label="Inactivos" value={String(studentInactiveQuestionnaires)} />
                </>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-[#0B5A4A]" />
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
          </div>

          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Foto de perfil
            </p>
            <div className="mt-3 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-white text-base font-bold text-[#0B5A4A]">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Vista previa de foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user?.nombre_completo || user?.username)
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <label
                  htmlFor="profile-photo-input"
                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#0B5A4A]/30 px-3 py-1.5 text-xs font-semibold text-[#0B5A4A] transition hover:bg-[#0B5A4A]/5"
                >
                  Seleccionar foto
                </label>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={clearAvatarPreview}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  Quitar
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                {avatarFilename || 'Sin archivo seleccionado. JPG/PNG/WEBP, max. 2 MB.'}
              </p>
              <p className="text-center text-xs text-gray-500">
                Vista previa local. Para guardar en sistema se requiere endpoint backend.
              </p>
            </div>
            {avatarError && (
              <p className="mt-2 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
                {avatarError}
              </p>
            )}
          </div>

          {profileError && (
            <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Nombre" value={user?.nombre_completo || 'No disponible'} />
            <InfoRow label="Usuario" value={user?.username || 'No disponible'} />
            <InfoRow label="Correo" value={user?.email || 'No disponible'} />
            <InfoRow label="Rol" value={roleLabel} />
            <InfoRow label="Género" value={user?.genero || 'No disponible'} />
            <InfoRow label="Teléfono" value={user?.telefono?.trim() || 'No disponible'} />
            <InfoRow label="Nacimiento" value={formatBirthDate(user?.fecha_nacimiento)} />
            <InfoRow
              label="Estatus"
              value={user?.is_active === false ? 'Inactivo' : user?.is_staff ? 'Staff habilitado' : 'Usuario estándar'}
            />
          </div>

          {user?.alumno && (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Alumno</p>
              <p className="mt-1 text-sm text-gray-700">
                Matrícula: <span className="font-semibold">{user.alumno.matricula || 'No disponible'}</span>
              </p>
            </div>
          )}

          {user?.docente && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Docente</p>
              <p className="mt-1 text-sm text-gray-700">
                Número de profesor: <span className="font-semibold">{user.docente.profesor_id || 'No disponible'}</span>
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#0B5A4A]" />
          <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Cambia tu contraseña desde esta sección.
        </p>

        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleChangePassword}>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contraseña actual</span>
            <input
              type="password"
              value={oldPassword}
              onChange={(event) => {
                setOldPassword(event.target.value);
                if (passwordFeedback) setPasswordFeedback(null);
              }}
              autoComplete="current-password"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0B5A4A] focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nueva contraseña</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (passwordFeedback) setPasswordFeedback(null);
              }}
              autoComplete="new-password"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0B5A4A] focus:outline-none"
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confirmar contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (passwordFeedback) setPasswordFeedback(null);
              }}
              autoComplete="new-password"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0B5A4A] focus:outline-none"
              placeholder="Repite tu contraseña"
            />
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-md bg-[#0B5A4A] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
            </button>

            {passwordFeedback && (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-sm ${getPasswordFeedbackClasses(passwordFeedback.type)}`}
              >
                {passwordFeedback.message}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default SettingsView;
