/**
 * Adaptadores entre respuesta del backend y el modelo interno del grafo.
 */

import type {
  GraphEdge,
  GraphNode,
  NodeMetrics,
  SociogramData,
  SociogramGrupoEstadisticas,
  SociogramMetadata,
} from '../types';

const MIN_NODE_SIZE = 18;
const MAX_NODE_SIZE = 82;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusFromTipo(tipo: 'ACEPTADO' | 'RECHAZADO' | 'INVISIBLE'): NodeMetrics['status'] {
  if (tipo === 'RECHAZADO') return 'rechazado';
  if (tipo === 'INVISIBLE') return 'aislado';
  return 'popular';
}

function colorFromTipo(tipo: 'ACEPTADO' | 'RECHAZADO' | 'INVISIBLE'): string {
  if (tipo === 'RECHAZADO') return '#7A1501';
  if (tipo === 'INVISIBLE') return '#4B5563';
  return '#0F7E3C';
}

function buildNodeMetrics(
  eleccionesRecibidas: number,
  eleccionesRealizadas: number,
  puntosNegativos: number,
  totalAlumnos: number,
  tipo: 'ACEPTADO' | 'RECHAZADO' | 'INVISIBLE'
): NodeMetrics {
  const maxPossible = Math.max(totalAlumnos - 1, 1);
  const popularidad = roundTo2(eleccionesRecibidas / maxPossible);
  const antipatia = roundTo2(puntosNegativos / maxPossible);

  return {
    elecciones_recibidas: eleccionesRecibidas,
    elecciones_emitidas: eleccionesRealizadas,
    rechazos_recibidos: puntosNegativos,
    rechazos_emitidos: 0,
    indice_popularidad: popularidad,
    indice_antipatia: antipatia,
    status: statusFromTipo(tipo),
  };
}

function normalizeNodeSize(impacto: number, maxImpacto: number): number {
  if (maxImpacto <= 0) return MIN_NODE_SIZE;
  const normalized = impacto / maxImpacto;
  return clamp(
    Math.round(MIN_NODE_SIZE + normalized * (MAX_NODE_SIZE - MIN_NODE_SIZE)),
    MIN_NODE_SIZE,
    MAX_NODE_SIZE
  );
}

export function mapGrupoEstadisticasToSociogramData(
  grupo: SociogramGrupoEstadisticas,
  metadataOverrides?: Partial<SociogramMetadata>
): SociogramData {
  const maxImpacto = Math.max(...grupo.nodos.map((n) => n.impacto_total || 0), 0);

  const nodes: GraphNode[] = grupo.nodos.map((nodo, index) => ({
    id: nodo.alumno_id,
    label: String(index + 1),
    matricula: nodo.matricula,
    nombre: nodo.nombre,
    size: normalizeNodeSize(nodo.impacto_total, maxImpacto),
    color: colorFromTipo(nodo.tipo),
    puntosPositivos: nodo.puntos_positivos,
    puntosNegativos: nodo.puntos_negativos,
    impactoTotal: nodo.impacto_total,
    eleccionesRealizadas: nodo.elecciones_realizadas,
    completo: nodo.completo,
    metrics: buildNodeMetrics(
      nodo.elecciones_recibidas,
      nodo.elecciones_realizadas,
      nodo.puntos_negativos,
      grupo.total_alumnos,
      nodo.tipo
    ),
  }));

  const edges: GraphEdge[] = grupo.conexiones.map((conexion, index) => ({
    id: `${conexion.origen_id}-${conexion.destino_id}-${index}`,
    source: conexion.origen_id,
    target: conexion.destino_id,
    type: conexion.polaridad === 'NEGATIVA' ? 'rechazo' : 'eleccion',
    weight: conexion.peso,
  }));

  const metadata: SociogramMetadata = {
    id: metadataOverrides?.id ?? grupo.grupo_id,
    titulo: metadataOverrides?.titulo ?? 'Sociograma',
    grupo: metadataOverrides?.grupo ?? grupo.grupo_clave,
    fecha: metadataOverrides?.fecha ?? new Date().toISOString(),
    total_alumnos: metadataOverrides?.total_alumnos ?? grupo.total_alumnos,
    total_respuestas: metadataOverrides?.total_respuestas ?? grupo.respuestas_completas,
  };

  return { nodes, edges, metadata };
}
