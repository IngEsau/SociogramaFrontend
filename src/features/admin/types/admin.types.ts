/**
 * Tipos del módulo Admin
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nombre_completo?: string;
  rol: 'ADMIN' | 'DOCENTE' | 'ALUMNO' | 'ACADEMICO' | 'COMITE';
  genero: 'Masculino' | 'Femenino' | 'Otro';
  is_active: boolean;
  is_staff: boolean;
}

export interface Group {
  id: number;
  nombre: string;
  clave?: string;
  periodo: string;
  division?: string;
  tutor?: {
    id: number;
    nombre: string;
    email?: string;
  };
  alumnos_count: number;
  created_at?: string;
}

export interface SystemLog {
  id: number;
  action: string;
  user: string;
  user_id?: number;
  timestamp: string;
  ip_address?: string;
  details?: string;
  level: 'info' | 'warning' | 'error';
}

export interface ImportResult {
  success: boolean;
  message: string;
  records_imported?: number;
  errors?: string[];
}

export interface Period {
  id: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  grupos_count?: number;
  alumnos_count?: number;
}

// Tipos para importación Excel (flujo analizar + ejecutar)

export interface ExcelAnalysisResponse {
  archivo_id: string;
  nombre_archivo: string;
  resumen: {
    total_alumnos: number;
    total_grupos: number;
    total_tutores: number;
  };
  warnings: string[];
  periodos_disponibles: Period[];
}

export interface ExcelExecuteRequest {
  archivo_id: string;
  periodo_id?: number;
  crear_periodo: boolean;
  nuevo_periodo_anio?: number;
  nuevo_periodo_numero?: number;
  desactivar_anteriores: boolean;
}

export interface ExcelExecuteResponse {
  success: boolean;
  message: string;
  detalle: {
    tutores_nuevos: number;
    grupos_creados: number;
    alumnos_nuevos: number;
    inscripciones_creadas: number;
    bajas: number;
  };
  periodo_desactivado?: boolean;
  periodo_usado: {
    id: number;
    codigo: string;
    nombre: string;
  };
  log_completo?: string[];
}

export interface CsvImportResponse {
  success: boolean;
  message: string;
  registros_procesados?: number;
  errores?: string[];
}

// Tipo de importación disponible
export type ImportType = 'excel' | 'csv' | 'docentes' | 'alumnos';

// ==========================================
// Cuestionarios
// ==========================================

/** Polaridad de una pregunta sociometrica */
export type PreguntaPolaridad = 'POSITIVA' | 'NEGATIVA';

/** Pregunta sociometrica */
export interface Pregunta {
  id: number;
  texto: string;
  tipo: 'SELECCION_ALUMNO';
  polaridad?: PreguntaPolaridad;
  max_elecciones: number;
  descripcion?: string;
  es_sociometrica: boolean;
}

/** Pregunta dentro de un cuestionario con su orden */
export interface CuestionarioPregunta {
  id: number;
  pregunta: Pregunta;
  orden: number;
}

/** Cuestionario completo */
export interface Cuestionario {
  id: number;
  titulo: string;
  descripcion?: string;
  periodo: number;
  periodo_codigo: string;
  periodo_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  esta_activo: boolean;
  preguntas?: CuestionarioPregunta[];
  total_preguntas: number;
  total_respuestas: number;
  total_grupos: number;
  creado_en: string;
}

/** Datos para crear una pregunta */
export interface PreguntaInput {
  texto: string;
  tipo: 'SELECCION_ALUMNO';
  polaridad: PreguntaPolaridad;
  max_elecciones: number;
  descripcion?: string;
}

// ==========================================
// Banco global de preguntas
// ==========================================

/** Pregunta del banco tal como la devuelve */
export interface PreguntaBanco {
  id: number;
  texto: string;
  tipo: 'SELECCION_ALUMNO';
  polaridad: PreguntaPolaridad;
  max_elecciones: number;
  orden: number;
  activa: boolean;
  descripcion?: string;
  es_sociometrica?: boolean;
  opciones?: unknown[];
  creado_en?: string;
}

/** Respuesta de GET /api/admin/preguntas/ */
export interface ListarBancoResponse {
  total: number;
  preguntas: PreguntaBanco[];
}

/** Body para POST /api/admin/preguntas/crear/ (individual) */
export interface CrearPreguntaBancoRequest {
  texto: string;
  tipo: 'SELECCION_ALUMNO';
  polaridad: PreguntaPolaridad;
  max_elecciones: number;
  orden?: number;
  descripcion?: string;
}

/** Respuesta de POST /api/admin/preguntas/crear/ (individual) */
export interface CrearPreguntaBancoResponse {
  success: boolean;
  pregunta: PreguntaBanco;
  message: string;
}

/** Respuesta de POST /api/admin/preguntas/crear/ (bulk — array) */
export interface CrearPreguntasBulkResponse {
  success: boolean;
  total_creadas: number;
  preguntas: PreguntaBanco[];
  message: string;
}

/** PUT /api/admin/preguntas/<id>/actualizar/ */
export type ActualizarPreguntaBancoRequest = Partial<CrearPreguntaBancoRequest>;

/** Respuesta de PUT /api/admin/preguntas/<id>/actualizar/ y editar-copia */
export interface ActualizarPreguntaBancoResponse {
  success: boolean;
  pregunta: PreguntaBanco;
}

/** PUT /api/admin/preguntas/<id>/editar-copia/ — editar una pregunta clonada en un cuestionario */
export type EditarCopiaPreguntaRequest = Partial<Pick<CrearPreguntaBancoRequest, 'texto' | 'polaridad' | 'descripcion' | 'max_elecciones'>>;

/** Respuesta generica de acciones sobre el banco (eliminar, etc.) */
export interface BancoActionResponse {
  success: boolean;
  message: string;
  respuestas_count?: number;
  error?: string;
}

/** POST /api/admin/cuestionarios/<id>/asociar-pregunta/ */
export interface AsociarPreguntaRequest {
  pregunta_id: number;
}

/** Datos para crear un cuestionario (POST /admin/cuestionarios/crear/) */
export interface CrearCuestionarioRequest {
  titulo: string;
  descripcion?: string;
  periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  /** IDs de preguntas existentes del banco global. Se clonan al cuestionario. */
  preguntas_ids: number[];
  /** Preguntas nuevas creadas inline al momento de crear el cuestionario. */
  preguntas?: PreguntaInput[];
}

/** Respuesta al crear cuestionario */
export interface CrearCuestionarioResponse {
  success: boolean;
  cuestionario: Cuestionario;
  message?: string;
}

/** Respuesta al listar cuestionarios */
export interface ListarCuestionariosResponse {
  cuestionarios: Cuestionario[];
}

/** Respuesta al activar cuestionario */
export interface ActivarCuestionarioResponse {
  success: boolean;
  cuestionario: Cuestionario;
  estados_creados: number;
  grupos_afectados: number;
  cuestionarios_desactivados?: number;
}

/** Respuesta al agregar pregunta */
export interface AgregarPreguntaResponse {
  success: boolean;
  cuestionario_pregunta: CuestionarioPregunta;
  total_preguntas: number;
}

/** Respuesta genérica de operaciones */
export interface CuestionarioActionResponse {
  success: boolean;
  message: string;
  total_preguntas?: number;
}
