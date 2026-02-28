/**
 * Vista de Actividad - Tutor
 *
 * Muestra los estudiantes asignados al tutor con su numero de lista y estado
 * en el cuestionario activo. Permite previsualizar el cuestionario.
 * Incluye filtro de alumnos por nombre o grupo y ordenamiento.
 *
 * Endpoints:
 * - GET /api/academic/cuestionarios/                                  - Listar cuestionarios (para obtener el activo)
 * - GET /api/admin/cuestionarios/:id/                                 - Detalle del cuestionario activo con preguntas
 * - GET /api/academic/my-groups/                                      - Grupos del tutor (incluye alumnos de cada grupo)
 * - GET /api/academic/cuestionarios/:id/registro/?grupo_id=X          - Registro de actividad por grupo (numero_lista, estado)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Search, Eye, ArrowLeft, Users, FileText, Calendar, Clock } from 'lucide-react';
import { useTopbarStore, useToastStore } from '../../../store';
import { tutorService } from '../services';
import type { TutorStudent, TutorGroupSummary } from '../services/tutor.service';
import type { Cuestionario } from '../../admin/types';
import type { Question, QuestionAnswer, Student } from '../../student/types/studentForm.types';
import type { RegistroAlumno } from '../types';
import {
  SurveyHeader,
  SurveyForm,
  DecorativeCircles,
} from '../../student/form/components';
import CastorBN from '../../../core/assets/Castor1-BN.png';

// ==========================================
// Tipos locales
// ==========================================

type SortMode = 'numero_lista' | 'name' | 'group';

// ==========================================
// Utilidades
// ==========================================

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Sin definir';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Sin definir';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Sin definir';
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return 'Sin definir';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Sin definir';
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' hrs';
  } catch {
    return 'Sin definir';
  }
}

/**
 * Calcula el color para la FECHA DE INICIO.
 * La fecha de inicio no puede estar "vencida". Si ya paso, significa que
 * el cuestionario esta activo (ya empezo), lo cual es correcto -> verde.
 * Si aun no llega, se indica cuanto falta.
 */
function getStartDateColor(startStr?: string, endStr?: string): string {
  if (!startStr) return 'text-[#9CA3AF]';
  try {
    const start = new Date(startStr);
    const now = new Date();
    if (isNaN(start.getTime())) return 'text-[#9CA3AF]';

    // Si ya paso la fecha de inicio
    if (now >= start) {
      // Verificar si el cuestionario sigue activo (antes de fecha_fin)
      if (endStr) {
        const end = new Date(endStr);
        if (!isNaN(end.getTime()) && now <= end) {
          return 'text-[#0F7E3C]'; // Activo, dentro del rango -> verde UTP
        }
        return 'text-[#9CA3AF]'; // Ya termino todo -> gris
      }
      return 'text-[#0F7E3C]'; // Ya empezo, sin fecha fin -> verde
    }

    // Aun no empieza
    const diffDays = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'text-[#0B5A4A]';  // Manana o hoy -> verde principal
    if (diffDays <= 3) return 'text-[#245C52]';   // Pronto -> verde oscuro
    return 'text-[#0F7E3C]';                       // Falta bastante -> verde UTP
  } catch {
    return 'text-[#9CA3AF]';
  }
}

/**
 * Calcula el color para la FECHA DE CIERRE.
 * Esta si puede vencerse. Colores institucionales:
 * - Vencida: rojo UTP
 * - Menos de 3 dias: rojo UTP
 * - Entre 3 y 7 dias: tono intermedio (advertencia)
 * - Mas de 7 dias: verde UTP
 */
function getEndDateColor(dateStr?: string): string {
  if (!dateStr) return 'text-[#9CA3AF]';
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 'text-[#9CA3AF]';
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-[#7A1501]';    // Ya vencio -> rojo UTP
    if (diffDays <= 2) return 'text-[#DC2626]';    // Urgente (0-2 dias) -> rojo eliminar
    if (diffDays <= 5) return 'text-[#B45309]';    // Precaucion (3-5 dias) -> ambar oscuro
    return 'text-[#0F7E3C]';                       // Tranquilo -> verde UTP
  } catch {
    return 'text-[#9CA3AF]';
  }
}

/**
 * Etiqueta para la FECHA DE INICIO.
 */
function getStartDateLabel(startStr?: string, endStr?: string): string | null {
  if (!startStr) return null;
  try {
    const start = new Date(startStr);
    const now = new Date();
    if (isNaN(start.getTime())) return null;

    if (now >= start) {
      if (endStr) {
        const end = new Date(endStr);
        if (!isNaN(end.getTime()) && now <= end) return 'En curso';
        if (!isNaN(end.getTime()) && now > end) return 'Finalizado';
      }
      return 'Iniciado';
    }

    const diffDays = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Manana';
    return `En ${diffDays} dias`;
  } catch {
    return null;
  }
}

/**
 * Etiqueta para la FECHA DE CIERRE.
 */
function getEndDateLabel(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Hoy cierra';
    if (diffDays === 1) return 'Cierra manana';
    return `Cierra en ${diffDays} dias`;
  } catch {
    return null;
  }
}

// ==========================================
// Alumnos ficticios para previsualizacion (ordenados alfabéticamente)
// ==========================================

const PREVIEW_STUDENTS: Student[] = [
  { id: '24', name: 'Alejandro David Castro Ramos' },
  { id: '16', name: 'Andres Felipe Munoz Castillo' },
  { id: '2', name: 'Ana Maria Martinez Sanchez' },
  { id: '23', name: 'Andrea Carolina Gutierrez Leon' },
  { id: '3', name: 'Carlos Eduardo Ramirez Lopez' },
  { id: '11', name: 'Carmen Elena Rodriguez Silva' },
  { id: '27', name: 'Carolina Victoria Vazquez Salazar' },
  { id: '21', name: 'Daniela Sofia Medina Aguilar' },
  { id: '33', name: 'Diana Marcela Soto Villanueva' },
  { id: '18', name: 'Diego Armando Vargas Herrera' },
  { id: '36', name: 'Eduardo Jose Estrada Pineda' },
  { id: '26', name: 'Emilio Sebastian Pena Carrillo' },
  { id: '14', name: 'Fernando Javier Alvarez Rojas' },
  { id: '17', name: 'Gabriela Alejandra Cruz Mendoza' },
  { id: '34', name: 'Hector Manuel Rios Sandoval' },
  { id: '15', name: 'Isabel Cristina Romero Navarro' },
  { id: '22', name: 'Javier Enrique Molina Rios' },
  { id: '1', name: 'Jesus Aguilar Perez Osorno' },
  { id: '40', name: 'Jorge Luis Acosta Velazquez' },
  { id: '8', name: 'Jose Manuel Garcia Ruiz' },
  { id: '9', name: 'Laura Patricia Fernandez Castro' },
  { id: '31', name: 'Lucia Fernanda Herrera Espinoza' },
  { id: '4', name: 'Luis Fernando Hernandez Garcia' },
  { id: '5', name: 'Maria Guadalupe Gonzalez Torres' },
  { id: '39', name: 'Mariana Isabela Lara Montes' },
  { id: '10', name: 'Miguel Angel Sanchez Perez' },
  { id: '35', name: 'Monica Patricia Duran Cabrera' },
  { id: '25', name: 'Natalia Fernanda Ortiz Delgado' },
  { id: '32', name: 'Omar Alejandro Moreno Fuentes' },
  { id: '29', name: 'Paola Andrea Ruiz Montero' },
  { id: '13', name: 'Patricia Lorena Torres Vega' },
  { id: '6', name: 'Pedro Antonio Lopez Ramirez' },
  { id: '30', name: 'Raul Eduardo Dominguez Paredes' },
  { id: '20', name: 'Ricardo Alberto Flores Guerrero' },
  { id: '12', name: 'Roberto Carlos Jimenez Ortiz' },
  { id: '37', name: 'Rosa Maria Juarez Contreras' },
  { id: '28', name: 'Sergio Ivan Mendez Cortes' },
  { id: '7', name: 'Sofia Isabella Diaz Morales' },
  { id: '19', name: 'Valentina Maria Reyes Campos' },
  { id: '38', name: 'Victor Hugo Cervantes Ibarra' },
];

// ==========================================
// Vista principal
// ==========================================

export function TutorActivityView() {
  const [cuestionarioActivo, setCuestionarioActivo] = useState<Cuestionario | null>(null);
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [groups, setGroups] = useState<TutorGroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [registroAlumnos, setRegistroAlumnos] = useState<RegistroAlumno[]>([]);
  const [isLoadingRegistro, setIsLoadingRegistro] = useState(false);
  const [isLoadingCuestionario, setIsLoadingCuestionario] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('numero_lista');
  const [showPreview, setShowPreview] = useState(false);

  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  // Cargar cuestionario activo
  const fetchCuestionarioActivo = useCallback(async () => {
    setIsLoadingCuestionario(true);
    try {
      const cuestionario = await tutorService.getCuestionarioActivo();
      setCuestionarioActivo(cuestionario);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'No se pudo obtener el cuestionario activo.');
      showToast({ message, type: 'error' });
      setCuestionarioActivo(null);
    } finally {
      setIsLoadingCuestionario(false);
    }
  }, [showToast]);

  // Cargar alumnos asignados y grupos
  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    try {
      const result = await tutorService.getAllMyStudents();
      setStudents(result.students);
      setGroups(result.groups);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'No se pudieron cargar los estudiantes.');
      showToast({ message, type: 'error' });
      setStudents([]);
      setGroups([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCuestionarioActivo();
    fetchStudents();
  }, [fetchCuestionarioActivo, fetchStudents]);

  // Seleccionar el primer grupo cuando se carguen los grupos
  useEffect(() => {
    if (groups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Cargar registro de actividad cuando cambia el cuestionario o el grupo seleccionado
  useEffect(() => {
    if (!cuestionarioActivo || !selectedGroupId) {
      setRegistroAlumnos([]);
      return;
    }

    let isCancelled = false;

    const fetchRegistro = async () => {
      setIsLoadingRegistro(true);
      try {
        const response = await tutorService.getCuestionarioRegistro(cuestionarioActivo.id, selectedGroupId);
        if (!isCancelled) setRegistroAlumnos(response.alumnos);
      } catch {
        if (!isCancelled) setRegistroAlumnos([]);
      } finally {
        if (!isCancelled) setIsLoadingRegistro(false);
      }
    };

    fetchRegistro();
    return () => { isCancelled = true; };
  }, [cuestionarioActivo, selectedGroupId]);

  // Topbar: solo boton de previsualizar
  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: cuestionarioActivo ? (
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-400/50 shadow-sm
                     text-gray-500 font-bold font-lato text-sm hover:bg-gray-50 transition-colors"
        >
          <Eye size={18} />
          <span>Previsualizar</span>
        </button>
      ) : null,
    });
    return () => resetTopbar();
  }, [setTopbarConfig, resetTopbar, cuestionarioActivo]);

  // Filtrar y ordenar alumnos
  // Cuando hay un grupo seleccionado y registro disponible, los alumnos del registro
  // son la fuente principal (contienen numero_lista y estado). Si no, se usan los alumnos
  // basicos de my-groups filtrados por grupo.
  const filteredStudents = useMemo(() => {
    // Determinar la lista base
    let baseList: Array<{
      id: number;
      matricula: string;
      nombre_completo: string;
      email: string;
      grupo_id: number;
      grupo_clave: string;
      numero_lista?: number;
      estado?: RegistroAlumno['estado'];
    }>;

    if (selectedGroupId && registroAlumnos.length > 0) {
      // Datos enriquecidos desde el registro del cuestionario
      baseList = registroAlumnos.map((ra) => ({
        id: ra.alumno_id,
        matricula: ra.matricula,
        nombre_completo: ra.nombre,
        email: '',
        grupo_id: selectedGroupId,
        grupo_clave: groups.find((g) => g.id === selectedGroupId)?.clave ?? '',
        numero_lista: ra.numero_lista,
        estado: ra.estado,
      }));
    } else {
      // Fallback: datos basicos de my-groups, filtrados por grupo si aplica
      baseList = (selectedGroupId
        ? students.filter((s) => s.grupo_id === selectedGroupId)
        : students
      ).map((s) => ({
        id: s.id,
        matricula: s.matricula,
        nombre_completo: s.nombre_completo,
        email: s.email,
        grupo_id: s.grupo_id,
        grupo_clave: s.grupo_clave,
        numero_lista: undefined,
        estado: undefined,
      }));
    }

    // Busqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      baseList = baseList.filter(
        (s) =>
          s.nombre_completo.toLowerCase().includes(query) ||
          s.matricula.toLowerCase().includes(query) ||
          s.grupo_clave.toLowerCase().includes(query)
      );
    }

    // Ordenamiento
    if (sortMode === 'numero_lista') {
      baseList.sort((a, b) => (a.numero_lista ?? 999) - (b.numero_lista ?? 999));
    } else if (sortMode === 'name') {
      baseList.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'));
    } else {
      baseList.sort((a, b) => {
        const groupCompare = a.grupo_clave.localeCompare(b.grupo_clave, 'es');
        if (groupCompare !== 0) return groupCompare;
        return (a.numero_lista ?? 999) - (b.numero_lista ?? 999);
      });
    }

    return baseList;
  }, [students, registroAlumnos, groups, selectedGroupId, searchQuery, sortMode]);

  // Previsualizacion
  if (showPreview && cuestionarioActivo) {
    return (
      <PreviewView
        cuestionario={cuestionarioActivo}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  const isLoading = isLoadingCuestionario || isLoadingStudents;

  if (isLoading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#245C52]" />
          <p className="text-sm text-gray-500">Cargando datos de actividad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Contenido principal */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1 min-h-0">
        {/* Panel izquierdo: Estudiantes Asignados */}
        <div
          className="w-full lg:w-[66%] rounded-lg border border-[#0F7E3C]/50 shadow-md bg-white p-4 flex flex-col gap-3 min-h-0"
        >
          {/* Encabezado con selector de grupo */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-extrabold text-[#0F7E3C] font-lato">
              Estudiantes Asignados
            </h2>
            {groups.length > 1 && (
              <select
                value={selectedGroupId ?? ''}
                onChange={(e) => setSelectedGroupId(e.target.value === '' ? null : Number(e.target.value))}
                className="h-9 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white
                           text-sm font-lato font-medium text-black focus:outline-none focus:ring-2
                           focus:ring-[#0F7E3C]/30 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230F7E3C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.4rem center',
                  paddingRight: '2rem',
                }}
              >
                <option value="">Todos los grupos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.clave}</option>
                ))}
              </select>
            )}
          </div>

          {/* Barra de busqueda y filtro */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-[#0F7E3C]/50 shadow-sm
                           text-base font-lato font-bold text-black placeholder:text-black/40
                           placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-[#0F7E3C]/30"
              />
              <Search
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Ordenar:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white
                           text-sm font-lato font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#0F7E3C]/30"
              >
                <option value="numero_lista">Por lista</option>
                <option value="name">Por nombre</option>
                <option value="group">Por grupo</option>
              </select>
            </div>
          </div>

          {/* Lista de estudiantes */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
            {isLoadingStudents || isLoadingRegistro ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[#245C52]" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Users size={40} className="text-gray-300" />
                <p className="text-sm text-gray-400 text-center">
                  {searchQuery.trim()
                    ? 'No se encontraron estudiantes con ese criterio.'
                    : 'No hay estudiantes asignados.'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <StudentCard
                  key={`${student.grupo_id}-${student.id}`}
                  student={student}
                  showGroupBadge={!selectedGroupId || groups.length > 1}
                />
              ))
            )}
          </div>
        </div>

        {/* Panel derecho: Datos del sociograma activo */}
        <div
          className="w-full lg:flex-1 rounded-lg border border-[#0F7E3C]/50 shadow-md bg-white p-4 flex flex-col gap-3 min-h-0 overflow-y-auto"
        >
          <h2 className="text-xl font-extrabold text-[#0F7E3C] font-lato shrink-0">
            Datos del sociograma activo
          </h2>

          {isLoadingCuestionario ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#245C52]" />
            </div>
          ) : !cuestionarioActivo ? (
            <NoCuestionarioActivo />
          ) : (
            <CuestionarioInfo
              cuestionario={cuestionarioActivo}
              students={students}
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Tarjeta de estudiante
// ==========================================

interface StudentCardData {
  id: number;
  matricula: string;
  nombre_completo: string;
  email: string;
  grupo_id: number;
  grupo_clave: string;
  numero_lista?: number;
  estado?: RegistroAlumno['estado'];
}

const ESTADO_STYLES: Record<NonNullable<StudentCardData['estado']>, { label: string; className: string }> = {
  COMPLETADO:   { label: 'Completado',   className: 'bg-[#0F7E3C]/10 text-[#0F7E3C] border border-[#0F7E3C]/30' },
  EN_PROGRESO:  { label: 'En progreso',  className: 'bg-amber-50 text-amber-700 border border-amber-300' },
  PENDIENTE:    { label: 'Pendiente',    className: 'bg-gray-100 text-gray-500 border border-gray-300' },
};

function StudentCard({
  student,
  showGroupBadge = true,
}: {
  student: StudentCardData;
  showGroupBadge?: boolean;
}) {
  const estadoInfo = student.estado ? ESTADO_STYLES[student.estado] : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#0F7E3C]/50 shadow-md bg-white">
      {/* Numero de lista */}
      {student.numero_lista !== undefined && (
        <span className="shrink-0 w-7 text-center text-sm font-bold text-[#0F7E3C]/60 font-lato select-none">
          {student.numero_lista}
        </span>
      )}

      {/* Nombre y matricula */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-base font-bold text-black font-lato truncate lg:text-lg leading-tight">
          {student.nombre_completo}
        </span>
        <span className="text-xs text-[#6D6D6D] font-lato">
          {student.matricula}
        </span>
      </div>

      {/* Badges: estado y grupo */}
      <div className="shrink-0 flex items-center gap-2">
        {estadoInfo && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${estadoInfo.className}`}>
            {estadoInfo.label}
          </span>
        )}
        {showGroupBadge && student.grupo_clave && (
          <span className="text-sm font-bold text-[#0F7E3C] px-2 py-1 rounded-lg border border-[#0F7E3C]/50 whitespace-nowrap">
            {student.grupo_clave}
          </span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Estado vacio: sin cuestionario activo
// ==========================================

function NoCuestionarioActivo() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <img
        src={CastorBN}
        alt="Sin cuestionario activo"
        className="w-36 h-auto opacity-20 select-none pointer-events-none"
        draggable={false}
      />
      <div className="text-center">
        <p className="text-base font-bold text-[#245C52]/50 font-lato">
          No hay un cuestionario activo por el momento.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          El administrador debe activar un cuestionario para que aparezca aqui.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Informacion del cuestionario activo
// ==========================================

interface CuestionarioInfoProps {
  cuestionario: Cuestionario;
  students: TutorStudent[];
  groups: TutorGroupSummary[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number | null) => void;
}

function CuestionarioInfo({ cuestionario, students, groups, selectedGroupId, onSelectGroup }: CuestionarioInfoProps) {
  // Calcular estudiantes segun grupo seleccionado
  const studentCount = useMemo(() => {
    if (selectedGroupId === null) {
      // Sumar total_alumnos de todos los grupos
      if (groups.length > 0) {
        return groups.reduce((sum, g) => sum + g.total_alumnos, 0);
      }
      return students.length;
    }
    const grupo = groups.find((g) => g.id === selectedGroupId);
    return grupo ? grupo.total_alumnos : students.filter((s) => s.grupo_id === selectedGroupId).length;
  }, [students, groups, selectedGroupId]);

  // Colores y etiquetas con logica separada para inicio y cierre
  const startDateColor = getStartDateColor(cuestionario.fecha_inicio, cuestionario.fecha_fin);
  const endDateColor = getEndDateColor(cuestionario.fecha_fin);
  const startDateLabel = getStartDateLabel(cuestionario.fecha_inicio, cuestionario.fecha_fin);
  const endDateLabel = getEndDateLabel(cuestionario.fecha_fin);

  return (
    <div className="flex flex-col gap-3">
      {/* Titulo */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-black font-lato">Titulo del sociograma</label>
        <div className="w-full px-3 py-2 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center">
          <span className="text-sm text-black font-roboto">{cuestionario.titulo}</span>
        </div>
      </div>

      {/* Descripcion */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-black font-lato">Descripcion</label>
        <div className="w-full min-h-14 px-3 py-2 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white">
          <span className="text-sm text-black font-roboto">
            {cuestionario.descripcion || 'Sin descripcion'}
          </span>
        </div>
      </div>

      {/* Fecha y hora de inicio */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-black font-lato">Fecha y hora de Inicio</label>
          {startDateLabel && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${startDateColor} bg-current/10`}>
              {startDateLabel}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className={`flex-1 h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center gap-2`}>
            <Calendar size={16} className={`${startDateColor} shrink-0`} />
            <span className={`text-sm font-medium font-roboto ${startDateColor}`}>
              {formatDate(cuestionario.fecha_inicio)}
            </span>
          </div>
          <div className={`flex-1 h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center gap-2`}>
            <Clock size={16} className={`${startDateColor} shrink-0`} />
            <span className={`text-sm font-medium font-roboto ${startDateColor}`}>
              {formatTime(cuestionario.fecha_inicio)}
            </span>
          </div>
        </div>
      </div>

      {/* Fecha limite de cierre */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-black font-lato">Fecha limite de cierre</label>
          {endDateLabel && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${endDateColor} bg-current/10`}>
              {endDateLabel}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className={`flex-1 h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center gap-2`}>
            <Calendar size={16} className={`${endDateColor} shrink-0`} />
            <span className={`text-sm font-medium font-roboto ${endDateColor}`}>
              {formatDate(cuestionario.fecha_fin)}
            </span>
          </div>
          <div className={`flex-1 h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center gap-2`}>
            <Clock size={16} className={`${endDateColor} shrink-0`} />
            <span className={`text-sm font-medium font-roboto ${endDateColor}`}>
              {formatTime(cuestionario.fecha_fin)}
            </span>
          </div>
        </div>
      </div>

      {/* Grupos asignados */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-black font-lato">Grupos asignados</label>
        {groups.length === 0 ? (
          <div className="w-full h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white flex items-center">
            <span className="text-sm text-gray-400 font-lato">Sin grupos asignados</span>
          </div>
        ) : (
          <select
            value={selectedGroupId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onSelectGroup(val === '' ? null : Number(val));
            }}
            className="w-full h-10 px-3 rounded-lg border border-[#0F7E3C]/50 shadow-sm bg-white
                       text-sm font-lato font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#0F7E3C]/30
                       cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230F7E3C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
            }}
          >
            <option value="">Todos los grupos ({groups.length})</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.clave} — {group.total_alumnos} alumnos
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resumen */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-300">
        <span className="text-sm font-bold text-black font-lato">Resumen</span>
        <div className="flex items-center justify-between">
          <span className="text-sm text-black font-lato">Estudiantes</span>
          <span className="text-sm font-bold text-[#0F7E3C] font-lato">{studentCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-black font-lato">Preguntas</span>
          <span className="text-sm font-bold text-[#0F7E3C] font-lato">{cuestionario.total_preguntas}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-black font-lato">Grupos</span>
          <span className="text-sm font-bold text-[#0F7E3C] font-lato">{groups.length}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Vista de previsualizacion (reutilizada del admin)
// ==========================================

interface PreviewViewProps {
  cuestionario: Cuestionario;
  onBack: () => void;
}

function PreviewView({ cuestionario, onBack }: PreviewViewProps) {
  const questions: Question[] = (cuestionario.preguntas || []).map((cp) => ({
    id: cp.pregunta.id,
    text: cp.pregunta.texto,
    type: cp.pregunta.polaridad === 'NEGATIVA' ? 'negative' as const : 'positive' as const,
  }));

  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>(() => {
    const initial: Record<number, QuestionAnswer> = {};
    questions.forEach((q) => {
      initial[q.id] = { firstPlace: null, secondPlace: null, thirdPlace: null };
    });
    return initial;
  });

  const handleAnswerChange = (
    questionId: number,
    place: 'firstPlace' | 'secondPlace' | 'thirdPlace',
    studentId: string | null
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [place]: studentId,
      },
    }));
  };

  const handleSubmitPreview = () => {
    // No-op: es solo previsualizacion
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header con boton de regreso */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-black">Previsualizacion</h2>
            <p className="text-xs text-gray-400">
              Asi veran el cuestionario los alumnos. Puedes interactuar pero no se enviara nada.
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor del formulario real */}
      <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full min-h-full relative bg-white overflow-hidden">
          <DecorativeCircles />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 sm:py-12 md:py-16 lg:py-20 flex flex-col items-center gap-6 sm:gap-8">
            <SurveyHeader groupName={cuestionario.titulo} questionnaireTitle={cuestionario.titulo} />

            {questions.length > 0 ? (
              <SurveyForm
                studentName="Jesus Aguilar Perez Osorno"
                studentId="preview-student"
                questions={questions}
                students={PREVIEW_STUDENTS}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmitPreview}
                isSubmitting={false}
              />
            ) : (
              <div className="w-full p-8 rounded-2xl border border-[#0F7E3C] bg-white/60 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-gray-500 font-medium">
                  No hay preguntas en este cuestionario
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  El administrador debe agregar preguntas al cuestionario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorActivityView;
