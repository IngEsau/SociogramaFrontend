/**
 * Tipos del módulo Sociogram (Core)
 */

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
