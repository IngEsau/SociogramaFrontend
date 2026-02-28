/**
 * Adaptadores entre respuesta del backend y el modelo interno del grafo.
 */

import type {
  GraphEdge,
  GraphNode,
  NodeMetrics,
  SociogramConexion,
  SociogramData,
  SociogramGrupoEstadisticas,
  SociogramMetadata,
  SociogramNodo,
} from '../types';

const MIN_NODE_SIZE = 18;
const MAX_NODE_SIZE = 82;

// Maximas flechas de salida por alumno (relaciones cercanas)
const MAX_OUTGOING_EDGES = 3;

// Umbral minimo de peso para que una conexion sea significativa (33% del total positivo del origen)
const MIN_WEIGHT_RATIO = 0.33;

// Porcentaje del impacto maximo por debajo del cual un nodo se considera neutro/invisible
const NEUTRAL_THRESHOLD_RATIO = 0.05;

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

/**
 * Determina el color del nodo segun la relacion entre puntos positivos y negativos.
 *
 * - Verde: puntos_positivos >= puntos_negativos
 * - Rojo:  puntos_negativos > puntos_positivos
 * - Gris:  impacto_total <= 5% del maximo impacto del grupo (neutro/invisible)
 */
function colorFromPuntaje(
  nodo: SociogramNodo,
  maxImpactoGrupo: number
): string {
  const impacto = nodo.impacto_total ?? 0;
  const umbralNeutro = maxImpactoGrupo * NEUTRAL_THRESHOLD_RATIO;

  if (impacto <= umbralNeutro) return '#4B5563'; // neutro/invisible

  if (nodo.puntos_negativos > nodo.puntos_positivos) return '#7A1501'; // rechazado
  return '#0F7E3C'; // aceptado
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

/**
 * Filtra y construye las aristas del grafo aplicando las reglas del sociograma:
 *
 * 1. Solo se grafican conexiones POSITIVAS. Las negativas se usan para metricas.
 * 2. Cada alumno tiene maximo MAX_OUTGOING_EDGES flechas de salida (elecciones positivas).
 *    Se toman las de mayor peso siempre que el peso >= 33% de la suma total positiva del origen.
 * 3. Si A -> B y B -> A en positivo, se consolida en una unica arista reciproca (doble punta = conexion fuerte).
 *    Si solo uno apunta al otro, es conexion debil (una punta).
 */
function filterAndBuildGraphEdges(conexiones: SociogramConexion[]): GraphEdge[] {
  // Separar positivas (las negativas se usan solo para metricas, no se grafican)
  const positivas = conexiones.filter((c) => c.polaridad === 'POSITIVA');

  // --- Procesar conexiones positivas ---

  // Calcular peso total positivo por origen
  const totalPositivoPorOrigen = new Map<number, number>();
  positivas.forEach((c) => {
    totalPositivoPorOrigen.set(
      c.origen_id,
      (totalPositivoPorOrigen.get(c.origen_id) ?? 0) + c.peso
    );
  });

  // Para cada origen, tomar top MAX_OUTGOING_EDGES con peso >= 33% del total
  const edgesPositivosSeleccionados = new Map<string, SociogramConexion>();

  const origenesPositivos = new Set(positivas.map((c) => c.origen_id));
  origenesPositivos.forEach((origenId) => {
    const totalPeso = totalPositivoPorOrigen.get(origenId) ?? 0;
    const umbral = totalPeso * MIN_WEIGHT_RATIO;

    const candidatos = positivas
      .filter((c) => c.origen_id === origenId && c.peso >= umbral)
      .sort((a, b) => b.peso - a.peso)
      .slice(0, MAX_OUTGOING_EDGES);

    candidatos.forEach((c) => {
      const key = `${c.origen_id}-${c.destino_id}`;
      edgesPositivosSeleccionados.set(key, c);
    });
  });

  // Determinar reciprocidad: A->B es reciproca si tambien B->A esta seleccionada
  const edgesPositivosFinales: GraphEdge[] = [];
  const procesados = new Set<string>();

  edgesPositivosSeleccionados.forEach((conexion, key) => {
    if (procesados.has(key)) return;

    const reverseKey = `${conexion.destino_id}-${conexion.origen_id}`;
    const esReciproca = edgesPositivosSeleccionados.has(reverseKey);

    if (esReciproca) {
      // Consolidar en una sola arista bidireccional (conexion fuerte)
      const pesoPromedio =
        ((conexion.peso + (edgesPositivosSeleccionados.get(reverseKey)?.peso ?? conexion.peso)) / 2);

      edgesPositivosFinales.push({
        id: `${Math.min(conexion.origen_id, conexion.destino_id)}-${Math.max(conexion.origen_id, conexion.destino_id)}-pos-mutual`,
        source: conexion.origen_id,
        target: conexion.destino_id,
        type: 'eleccion',
        reciproco: true,
        weight: pesoPromedio,
      });

      procesados.add(key);
      procesados.add(reverseKey);
    } else {
      // Conexion debil: solo una direccion
      edgesPositivosFinales.push({
        id: `${conexion.origen_id}-${conexion.destino_id}-pos`,
        source: conexion.origen_id,
        target: conexion.destino_id,
        type: 'eleccion',
        reciproco: false,
        weight: conexion.peso,
      });

      procesados.add(key);
    }
  });

  // Solo se muestran conexiones positivas en el grafo.
  // Las negativas se usan para metricas pero no se dibujan.
  return edgesPositivosFinales;
}

export function mapGrupoEstadisticasToSociogramData(
  grupo: SociogramGrupoEstadisticas,
  metadataOverrides?: Partial<SociogramMetadata>
): SociogramData {
  const maxImpacto = Math.max(...grupo.nodos.map((n) => n.impacto_total || 0), 0);

  const nodes: GraphNode[] = grupo.nodos.map((nodo, index) => ({
    id: nodo.alumno_id,
    label: String(nodo.numero_lista ?? index + 1),
    numeroLista: nodo.numero_lista ?? index + 1,
    matricula: nodo.matricula,
    nombre: nodo.nombre,
    size: normalizeNodeSize(nodo.impacto_total, maxImpacto),
    color: colorFromPuntaje(nodo, maxImpacto),
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

  const edges: GraphEdge[] = filterAndBuildGraphEdges(grupo.conexiones);

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
