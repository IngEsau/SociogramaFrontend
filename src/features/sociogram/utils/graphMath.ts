/**
 * Utilidades matemáticas para el grafo del sociograma
 */

import type { GraphEdge, GlobalMetrics, NodeMetrics, SociogramData } from '../types';

/**
 * Calcula las métricas de un nodo específico
 */
export function calculateNodeMetrics(
  nodeId: number,
  edges: GraphEdge[],
  totalNodes: number
): NodeMetrics {
  const eleccionesRecibidas = edges.filter(
    (e) => e.target === nodeId && e.type === 'eleccion'
  ).length;
  
  const eleccionesEmitidas = edges.filter(
    (e) => e.source === nodeId && e.type === 'eleccion'
  ).length;
  
  const rechazosRecibidos = edges.filter(
    (e) => e.target === nodeId && e.type === 'rechazo'
  ).length;
  
  const rechazosEmitidos = edges.filter(
    (e) => e.source === nodeId && e.type === 'rechazo'
  ).length;

  // Índice de popularidad (normalizado)
  const maxPossible = totalNodes - 1;
  const indicePopularidad = maxPossible > 0 
    ? eleccionesRecibidas / maxPossible 
    : 0;
  
  const indiceAntipatia = maxPossible > 0 
    ? rechazosRecibidos / maxPossible 
    : 0;

  // Determinar status
  let status: NodeMetrics['status'] = 'normal';
  
  if (indicePopularidad > 0.5 && rechazosRecibidos === 0) {
    status = 'lider';
  } else if (indicePopularidad > 0.3) {
    status = 'popular';
  } else if (eleccionesRecibidas === 0 && rechazosRecibidos === 0) {
    status = 'aislado';
  } else if (indiceAntipatia > 0.3) {
    status = 'rechazado';
  }

  return {
    elecciones_recibidas: eleccionesRecibidas,
    elecciones_emitidas: eleccionesEmitidas,
    rechazos_recibidos: rechazosRecibidos,
    rechazos_emitidos: rechazosEmitidos,
    indice_popularidad: Math.round(indicePopularidad * 100) / 100,
    indice_antipatia: Math.round(indiceAntipatia * 100) / 100,
    status,
  };
}

/**
 * Calcula las métricas globales del sociograma
 */
export function calculateMetrics(data: SociogramData): GlobalMetrics {
  const { nodes, edges } = data;
  const n = nodes.length;
  
  if (n === 0) {
    return {
      indice_cohesion: 0,
      densidad_positiva: 0,
      densidad_negativa: 0,
      reciprocidad_elecciones: 0,
      reciprocidad_rechazos: 0,
      total_lideres: 0,
      total_populares: 0,
      total_normales: 0,
      total_aislados: 0,
      total_rechazados: 0,
    };
  }

  const maxEdges = n * (n - 1);
  
  const elecciones = edges.filter((e) => e.type === 'eleccion');
  const rechazos = edges.filter((e) => e.type === 'rechazo');

  // Densidades
  const densidadPositiva = maxEdges > 0 ? elecciones.length / maxEdges : 0;
  const densidadNegativa = maxEdges > 0 ? rechazos.length / maxEdges : 0;

  // Reciprocidad
  const eleccionesReciprocos = elecciones.filter((e) =>
    elecciones.some((e2) => e2.source === e.target && e2.target === e.source)
  ).length;
  
  const rechazosReciprocos = rechazos.filter((e) =>
    rechazos.some((e2) => e2.source === e.target && e2.target === e.source)
  ).length;

  const reciprocidadElecciones = elecciones.length > 0
    ? eleccionesReciprocos / elecciones.length
    : 0;
    
  const reciprocidadRechazos = rechazos.length > 0
    ? rechazosReciprocos / rechazos.length
    : 0;

  // Índice de cohesión (simplificado)
  const indiceCohesion = densidadPositiva - densidadNegativa * 0.5;

  // Contar por status
  const nodesWithMetrics = nodes.map((node) => ({
    ...node,
    metrics: node.metrics || calculateNodeMetrics(node.id, edges, n),
  }));

  const total_lideres = nodesWithMetrics.filter((n) => n.metrics?.status === 'lider').length;
  const total_populares = nodesWithMetrics.filter((n) => n.metrics?.status === 'popular').length;
  const total_normales = nodesWithMetrics.filter((n) => n.metrics?.status === 'normal').length;
  const total_aislados = nodesWithMetrics.filter((n) => n.metrics?.status === 'aislado').length;
  const total_rechazados = nodesWithMetrics.filter((n) => n.metrics?.status === 'rechazado').length;

  return {
    indice_cohesion: Math.round(indiceCohesion * 100) / 100,
    densidad_positiva: Math.round(densidadPositiva * 100) / 100,
    densidad_negativa: Math.round(densidadNegativa * 100) / 100,
    reciprocidad_elecciones: Math.round(reciprocidadElecciones * 100) / 100,
    reciprocidad_rechazos: Math.round(reciprocidadRechazos * 100) / 100,
    total_lideres,
    total_populares,
    total_normales,
    total_aislados,
    total_rechazados,
  };
}

/**
 * Normaliza los datos del grafo para visualización
 */
export function normalizeGraphData(data: SociogramData): SociogramData {
  const { nodes, edges, metadata } = data;
  
  // Agregar métricas a cada nodo
  const nodesWithMetrics = nodes.map((node) => ({
    ...node,
    metrics: node.metrics || calculateNodeMetrics(node.id, edges, nodes.length),
  }));

  // Marcar edges recíprocos
  const edgesWithReciprocity = edges.map((edge) => ({
    ...edge,
    id: edge.id || `${edge.source}-${edge.target}-${edge.type}`,
    reciproco: edges.some(
      (e) => e.source === edge.target && e.target === edge.source && e.type === edge.type
    ),
  }));

  return {
    nodes: nodesWithMetrics,
    edges: edgesWithReciprocity,
    metadata,
  };
}

/**
 * Asigna colores a los nodos según su status
 */
export function getNodeColor(status: NodeMetrics['status']): string {
  const colors: Record<NodeMetrics['status'], string> = {
    lider: '#22c55e',      // Verde
    popular: '#3b82f6',    // Azul
    normal: '#6b7280',     // Gris
    aislado: '#f59e0b',    // Amarillo/Naranja
    rechazado: '#ef4444',  // Rojo
  };
  return colors[status] || colors.normal;
}
