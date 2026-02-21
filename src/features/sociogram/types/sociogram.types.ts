/**
 * Tipos del módulo Sociogram (Core)
 *
 * Fase 5: Polaridad de preguntas y nuevos campos de puntaje.
 * - Nodos: puntos_positivos, puntos_negativos, impacto_total, tamano
 * - Clasificacion: ACEPTADO (verde), RECHAZADO (rojo), INVISIBLE (gris)
 * - Conexiones: porcentaje_mutuo, polaridad
 */

// ==========================================
// Tipos de respuesta del backend /estadisticas/
// ==========================================

/** Tipo de clasificacion segun polaridad (Fase 5) */
export type ClasificacionTipo = 'ACEPTADO' | 'RECHAZADO' | 'INVISIBLE';

/** Tipo de conexion segun peso */
export type TipoConexion = 'fuerte' | 'media' | 'debil';

/** Nodo del sociograma (alumno) - Respuesta del backend */
export interface SociogramNodo {
  alumno_id: number;
  matricula: string;
  nombre: string;
  tipo: ClasificacionTipo;
  puntos_positivos: number;
  puntos_negativos: number;
  impacto_total: number;
  tamano: number;
  puntos_recibidos: number;
  elecciones_recibidas: number;
  elecciones_realizadas: number;
  completo: boolean;
}

/** Conexion del sociograma - Respuesta del backend */
export interface SociogramConexion {
  origen_id: number;
  origen_nombre: string;
  destino_id: number;
  destino_nombre: string;
  peso: number;
  tipo_conexion: TipoConexion;
  porcentaje_mutuo?: number;
  polaridad?: 'POSITIVA' | 'NEGATIVA';
  orden_eleccion: number;
}

/** Grupo con estadisticas sociometricas - Respuesta del backend */
export interface SociogramGrupoEstadisticas {
  grupo_id: number;
  grupo_clave: string;
  total_alumnos: number;
  respuestas_completas: number;
  nodos: SociogramNodo[];
  conexiones: SociogramConexion[];
}

/** Respuesta completa de /estadisticas/ */
export interface EstadisticasResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  total_grupos: number;
  grupos: SociogramGrupoEstadisticas[];
}

// ==========================================
// Tipos internos para renderizar el grafo
// ==========================================

export interface GraphNode {
  id: number;
  label: string;
  matricula?: string;
  genero?: 'Masculino' | 'Femenino' | 'Otro';
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  metrics?: NodeMetrics;
}

export interface NodeMetrics {
  elecciones_recibidas: number;
  elecciones_emitidas: number;
  rechazos_recibidos: number;
  rechazos_emitidos: number;
  indice_popularidad: number;
  indice_antipatia: number;
  status: 'lider' | 'popular' | 'normal' | 'aislado' | 'rechazado';
}

export interface GraphEdge {
  id: string;
  source: number;
  target: number;
  type: 'eleccion' | 'rechazo';
  pregunta_id?: number;
  reciproco?: boolean;
  weight?: number;
  color?: string;
}

export interface SociogramData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: SociogramMetadata;
}

export interface SociogramMetadata {
  id: number;
  titulo: string;
  grupo: string;
  fecha: string;
  total_alumnos: number;
  total_respuestas: number;
}

export interface GlobalMetrics {
  // Índices de cohesión
  indice_cohesion: number;
  densidad_positiva: number;
  densidad_negativa: number;
  
  // Reciprocidad
  reciprocidad_elecciones: number;
  reciprocidad_rechazos: number;
  
  // Distribución
  total_lideres: number;
  total_populares: number;
  total_normales: number;
  total_aislados: number;
  total_rechazados: number;
  
  // Grupos
  clusters?: ClusterInfo[];
}

export interface ClusterInfo {
  id: number;
  miembros: number[];
  cohesion_interna: number;
}

export interface SociogramConfig {
  // Visualización
  showLabels: boolean;
  showEdges: boolean;
  showMetrics: boolean;
  
  // Filtros
  filterByQuestion?: number;
  filterByType?: 'eleccion' | 'rechazo' | 'all';
  highlightNode?: number;
  
  // Colores
  colorScheme: 'default' | 'gender' | 'status';
  eleccionColor: string;
  rechazoColor: string;
  
  // Layout
  layout: 'force' | 'circular' | 'hierarchical';
}

export const defaultSociogramConfig: SociogramConfig = {
  showLabels: true,
  showEdges: true,
  showMetrics: true,
  filterByType: 'all',
  colorScheme: 'default',
  eleccionColor: '#22c55e',
  rechazoColor: '#ef4444',
  layout: 'force',
};
