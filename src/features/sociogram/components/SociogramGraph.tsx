/**
 * Renderizador SVG del sociograma.
 * Dibuja nodos, conexiones dirigidas y controles de zoom.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GraphEdge, GraphNode, SociogramConfig, SociogramData } from '../types';
import { normalizeGraphData } from '../utils';
import openEyeIcon from '../../../core/assets/open-eye-icon.svg';
import closeEyeIcon from '../../../core/assets/close-eye-icon.svg';
import visibilityIcon from '../../../core/assets/visibility-icon.svg';
import noVisibilityIcon from '../../../core/assets/no-visibility-icon.svg';
import personRoundedIcon from '../../../core/assets/person-rounded-icon.svg';

interface SociogramGraphProps {
  data: SociogramData | null;
  config?: Partial<SociogramConfig>;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  isBlurred?: boolean;
  onToggleBlur?: () => void;
  showNodeNames?: boolean;
  onToggleNodeNames?: () => void;
}

interface SimulationNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const VIEWBOX_WIDTH = 980;
const VIEWBOX_HEIGHT = 700;
const PADDING = 26;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

function gradientByNode(node: GraphNode): 'accepted' | 'rejected' | 'neutral' {
  const color = (node.color || '').toLowerCase();
  if (color.includes('7a1501') || color.includes('5b0d0d') || color.includes('ef4444')) {
    return 'rejected';
  }
  if (color.includes('4b5563') || color.includes('6b7280') || color.includes('9ca3af')) {
    return 'neutral';
  }
  return 'accepted';
}

/**
 * Calcula la "relevancia posicional" de un nodo para el layout.
 * Mayor puntaje positivo neto = mas cerca del centro.
 * Se basa en: puntos_positivos - puntos_negativos, normalizado por impactoTotal.
 */
function calcRelevancia(node: GraphNode): number {
  const pos = node.puntosPositivos ?? 0;
  const neg = node.puntosNegativos ?? 0;
  const impacto = node.impactoTotal ?? node.size ?? 0;
  // Puntaje positivo neto ponderado por el impacto total
  return Math.max(0, (pos - neg) * 0.6 + impacto * 0.4);
}

function buildSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<number, SimulationNode> {
  const centerX = width / 2;
  const centerY = height / 2;

  // Ordenar por relevancia: los mas relevantes (mayor puntaje positivo neto) van al centro
  const seeded = [...nodes]
    .map((node) => ({
      id: node.id,
      radius: clamp(node.size ?? 26, 14, 86),
      relevancia: calcRelevancia(node),
    }))
    .sort((a, b) => b.relevancia - a.relevancia);

  const maxRelevancia = seeded[0]?.relevancia ?? 1;

  // Distribucion radial: radio proporcional a la inversa de la relevancia
  // El nodo mas relevante en el centro, los demas en anillos segun su relevancia relativa
  const states: SimulationNode[] = seeded.map((node, index) => {
    if (index === 0) {
      return { id: node.id, x: centerX, y: centerY, vx: 0, vy: 0, radius: node.radius };
    }

    // Radio proporcional: nodos con alta relevancia cerca del centro
    const relRatio = maxRelevancia > 0 ? 1 - node.relevancia / maxRelevancia : 1;
    // Anillo minimo para evitar solapamiento con el centro, maximo hasta el borde
    const minRing = node.radius * 2 + 50;
    const maxRing = Math.min(width, height) * 0.44;
    const ring = minRing + relRatio * (maxRing - minRing);

    // Distribuir angulos de forma uniforme con un desfase para evitar alineaciones
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 grados
    const angle = index * goldenAngle;

    // Perturbacion organica para evitar aspecto de rejilla
    const wobble = (((index * 7) % 5) - 2) * 8;

    return {
      id: node.id,
      x: centerX + Math.cos(angle) * (ring + wobble),
      y: centerY + Math.sin(angle) * (ring - wobble * 0.5),
      vx: 0,
      vy: 0,
      radius: node.radius,
    };
  });

  const stateById = new Map<number, SimulationNode>();
  states.forEach((node) => stateById.set(node.id, node));

  // Mapa de relevancia para modular la fuerza central
  const relevanciaById = new Map<number, number>();
  seeded.forEach((n) => relevanciaById.set(n.id, n.relevancia));

  const repulsionFactor = 9500;
  const springFactor = 0.025;
  // Fuerza central variable: los nodos mas relevantes son mas atraidos al centro
  const centerForceBase = 0.003;
  const centerForceScale = 0.008;
  const damping = 0.85;
  const maxStep = 10;

  for (let iteration = 0; iteration < 320; iteration += 1) {
    // Repulsion entre pares de nodos
    for (let i = 0; i < states.length; i += 1) {
      const a = states[i];
      for (let j = i + 1; j < states.length; j += 1) {
        const b = states[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 0.1;
        const dist = Math.sqrt(distSq);
        const minDist = a.radius + b.radius + 28;
        const force = (repulsionFactor * minDist * minDist) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Fuerzas de resorte por aristas (mantiene nodos conectados cerca)
    edges.forEach((edge) => {
      const source = stateById.get(edge.source);
      const target = stateById.get(edge.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Aristas reciprocas (conexion fuerte) atraen mas
      const idealDistance = source.radius + target.radius + (edge.reciproco ? 20 : 48);
      const stretch = dist - idealDistance;
      const force = stretch * springFactor;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // Fuerza hacia el centro: proporcional a la relevancia del nodo
    states.forEach((node) => {
      const rel = relevanciaById.get(node.id) ?? 0;
      const relRatio = maxRelevancia > 0 ? rel / maxRelevancia : 0;
      const cf = centerForceBase + relRatio * centerForceScale;

      node.vx += (centerX - node.x) * cf;
      node.vy += (centerY - node.y) * cf;

      node.vx *= damping;
      node.vy *= damping;

      node.x += clamp(node.vx, -maxStep, maxStep);
      node.y += clamp(node.vy, -maxStep, maxStep);

      const minX = PADDING + node.radius;
      const maxX = width - PADDING - node.radius;
      const minY = PADDING + node.radius;
      const maxY = height - PADDING - node.radius;

      node.x = clamp(node.x, minX, maxX);
      node.y = clamp(node.y, minY, maxY);
    });
  }

  return stateById;
}

function getEdgePath(
  source: SimulationNode,
  target: SimulationNode,
  reciprocal: boolean
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // Para aristas reciprocas dejamos espacio para la punta de inicio tambien
  const startOffset = reciprocal ? source.radius + 6 : source.radius - 1;
  const endOffset = target.radius + 6;

  const startX = source.x + ux * startOffset;
  const startY = source.y + uy * startOffset;
  const endX = target.x - ux * endOffset;
  const endY = target.y - uy * endOffset;

  if (!reciprocal) {
    return `M ${roundTo1(startX)} ${roundTo1(startY)} L ${roundTo1(endX)} ${roundTo1(endY)}`;
  }

  // Curva cuadratica para aristas reciprocas (conexion fuerte)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -uy;
  const perpY = ux;
  const curveMagnitude = 26;
  const controlX = midX + perpX * curveMagnitude;
  const controlY = midY + perpY * curveMagnitude;

  return `M ${roundTo1(startX)} ${roundTo1(startY)} Q ${roundTo1(controlX)} ${roundTo1(controlY)} ${roundTo1(endX)} ${roundTo1(endY)}`;
}

export function SociogramGraph({
  data,
  onNodeClick,
  onNodeHover,
  className = '',
  isLoading = false,
  error = null,
  isBlurred = false,
  onToggleBlur,
  showNodeNames = false,
  onToggleNodeNames,
}: SociogramGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const hideTooltipTimerRef = useRef<number | null>(null);

  const normalizedData = useMemo(() => {
    if (!data) return null;
    return normalizeGraphData(data);
  }, [data]);

  const simulation = useMemo(() => {
    if (!normalizedData) return null;
    return buildSimulation(normalizedData.nodes, normalizedData.edges, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
  }, [normalizedData]);

  const hoveredNode = useMemo(() => {
    if (!hoveredNodeId || !normalizedData || !simulation) return null;
    const node = normalizedData.nodes.find((n) => n.id === hoveredNodeId);
    const simNode = simulation.get(hoveredNodeId);
    if (!node || !simNode) return null;
    return { node, simNode };
  }, [hoveredNodeId, normalizedData, simulation]);

  useEffect(() => {
    return () => {
      if (hideTooltipTimerRef.current !== null) {
        window.clearTimeout(hideTooltipTimerRef.current);
        hideTooltipTimerRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 flex items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500">Cargando sociograma...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 flex items-center justify-center ${className}`}>
        <p className="max-w-md text-center text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!normalizedData || normalizedData.nodes.length === 0 || !simulation) {
    return (
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 flex items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500">No hay datos del sociograma para mostrar.</p>
      </div>
    );
  }

  const centerX = VIEWBOX_WIDTH / 2;
  const centerY = VIEWBOX_HEIGHT / 2;
  const zoomTransform = `translate(${centerX} ${centerY}) scale(${zoom}) translate(${-centerX} ${-centerY})`;

  return (
    <div className={`relative rounded-xl border border-emerald-600/35 bg-[#f4f5f6] ${className}`}>
      {/* Overlay de blur cuando isBlurred */}
      {isBlurred && (
        <div
          className="absolute inset-0 z-20 rounded-xl"
          style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
        />
      )}

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-full min-h-105 w-full rounded-xl"
        role="img"
        aria-label="Grafo del sociograma"
      >
        <defs>
          <radialGradient id="node-accepted" cx="30%" cy="25%">
            <stop offset="0%" stopColor="#2F8B7E" />
            <stop offset="62%" stopColor="#0A5B50" />
            <stop offset="100%" stopColor="#013D36" />
          </radialGradient>
          <radialGradient id="node-rejected" cx="30%" cy="25%">
            <stop offset="0%" stopColor="#7F2C2A" />
            <stop offset="62%" stopColor="#5A0D0D" />
            <stop offset="100%" stopColor="#3A0404" />
          </radialGradient>
          <radialGradient id="node-neutral" cx="30%" cy="25%">
            <stop offset="0%" stopColor="#7A7F87" />
            <stop offset="62%" stopColor="#4A4F56" />
            <stop offset="100%" stopColor="#2E3136" />
          </radialGradient>

          {/* Punta de flecha fin — conexiones normales */}
          <marker id="arrow-end" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#21242A" />
          </marker>
          {/* Punta de flecha inicio — conexiones fuertes (reciprocas) */}
          <marker id="arrow-start" markerWidth="10" markerHeight="7" refX="2" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#21242A" />
          </marker>
          {/* Punta de flecha fin — rechazos */}
          <marker id="arrow-end-neg" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#5A0D0D" />
          </marker>
        </defs>

        <g transform={zoomTransform}>
          {normalizedData.edges.map((edge) => {
            const source = simulation.get(edge.source);
            const target = simulation.get(edge.target);
            if (!source || !target) return null;

            const path = getEdgePath(source, target, Boolean(edge.reciproco));
            const isRechazo = edge.type === 'rechazo';
            const isReciproca = Boolean(edge.reciproco);

            // Conexion fuerte (reciproca): linea continua mas gruesa, doble punta
            // Conexion debil (una direccion): linea mas fina, una punta
            const edgeColor = isRechazo ? '#5A0D0D' : '#21242A';
            const strokeWidth = isReciproca
              ? clamp(1.8 + (edge.weight ?? 1) * 0.18, 2, 4)
              : clamp(1 + (edge.weight ?? 1) * 0.12, 1, 2.5);

            const markerEnd = isRechazo ? 'url(#arrow-end-neg)' : 'url(#arrow-end)';
            const markerStart = isReciproca ? 'url(#arrow-start)' : undefined;

            return (
              <path
                key={edge.id}
                d={path}
                stroke={edgeColor}
                strokeWidth={strokeWidth}
                fill="none"
                markerEnd={markerEnd}
                markerStart={markerStart}
                opacity={isReciproca ? 1 : 0.85}
              />
            );
          })}

          {normalizedData.nodes.map((node) => {
            const simNode = simulation.get(node.id);
            if (!simNode) return null;

            const gradient = gradientByNode(node);
            const fill = gradient === 'rejected'
              ? 'url(#node-rejected)'
              : gradient === 'neutral'
                ? 'url(#node-neutral)'
                : 'url(#node-accepted)';

            const fontSize = clamp(simNode.radius * 0.8, 13, 56);

            return (
              <g
                key={node.id}
                onMouseEnter={() => {
                  if (hideTooltipTimerRef.current !== null) {
                    window.clearTimeout(hideTooltipTimerRef.current);
                    hideTooltipTimerRef.current = null;
                  }
                  setHoveredNodeId(node.id);
                  onNodeHover?.(node.id);
                }}
                onMouseLeave={() => {
                  if (hideTooltipTimerRef.current !== null) {
                    window.clearTimeout(hideTooltipTimerRef.current);
                  }
                  hideTooltipTimerRef.current = window.setTimeout(() => {
                    setHoveredNodeId(null);
                    onNodeHover?.(null);
                    hideTooltipTimerRef.current = null;
                  }, 850);
                }}
                onClick={() => onNodeClick?.(node.id)}
                className={onNodeClick ? 'cursor-pointer' : ''}
              >
                <circle
                  cx={simNode.x}
                  cy={simNode.y}
                  r={simNode.radius}
                  fill={fill}
                  stroke="#142029"
                  strokeWidth={1.2}
                />
                <text
                  x={simNode.x}
                  y={simNode.y + fontSize * 0.3}
                  textAnchor="middle"
                  fill="#F4F8FB"
                  fontSize={fontSize}
                  fontWeight={700}
                  paintOrder="stroke"
                  stroke="#0F1217"
                  strokeOpacity={0.45}
                  strokeWidth={1.2}
                  style={{ userSelect: 'none' }}
                >
                  {node.label}
                </text>
                {/* El nombre se muestra en el tooltip al hacer hover, no bajo la bolita */}
              </g>
            );
          })}
        </g>

        {hoveredNode && (
          (() => {
            const positivos = hoveredNode.node.puntosPositivos ?? 0;
            const negativos = hoveredNode.node.puntosNegativos ?? 0;
            const nombre = hoveredNode.node.nombre ?? '';
            const nombreDisplay = nombre.length > 28 ? nombre.slice(0, 26) + '…' : nombre;

            // Dimensiones del tooltip: con nombre es mas alto
            const tooltipW = showNodeNames ? 230 : 160;
            const tooltipH = showNodeNames ? 92 : 66;
            const rowH = 18; // altura de cada fila de pts
            const pad = 12;  // padding interno

            const rawX = ((hoveredNode.simNode.x - centerX) * zoom) + centerX + hoveredNode.simNode.radius * zoom + 12;
            const rawY = ((hoveredNode.simNode.y - centerY) * zoom) + centerY - tooltipH / 2;
            const tx = clamp(rawX, 8, VIEWBOX_WIDTH - tooltipW - 8);
            const ty = clamp(rawY, 8, VIEWBOX_HEIGHT - tooltipH - 8);

            // Posicion Y de la fila de puntos segun si hay nombre
            const ptsStartY = showNodeNames ? 52 : pad + 8;

            return (
              <g transform={`translate(${tx} ${ty})`} pointerEvents="none">
                {/* Sombra */}
                <rect x="2" y="3" width={tooltipW} height={tooltipH} rx="8" fill="rgba(0,0,0,0.18)" />
                {/* Fondo con borde verde */}
                <rect
                  width={tooltipW} height={tooltipH} rx="8"
                  fill="#FFFFFF"
                  stroke="rgba(15,126,60,0.50)"
                  strokeWidth={1}
                />

                {/* --- Fila superior: icono persona + nombre (solo si showNodeNames) --- */}
                {showNodeNames && (
                  <>
                    <image
                      href={personRoundedIcon}
                      x={pad}
                      y={pad}
                      width={15}
                      height={15}
                    />
                    <text
                      x={pad + 19}
                      y={pad + 12}
                      fontSize="12.5"
                      fontFamily="Lato, sans-serif"
                      fontWeight={700}
                      fill="#2E2E2E"
                      style={{ userSelect: 'none' }}
                    >
                      {nombreDisplay}
                    </text>
                    {/* Separador */}
                    <line
                      x1={pad} y1={ptsStartY - 8}
                      x2={tooltipW - pad} y2={ptsStartY - 8}
                      stroke="#D1FAE5" strokeWidth={1}
                    />
                  </>
                )}

                {/* --- Fila pts positivos --- */}
                <rect
                  x={pad} y={ptsStartY}
                  width={15} height={15} rx="3"
                  fill="#0B9624"
                />
                <text
                  x={pad + 20}
                  y={ptsStartY + 12}
                  fontSize="12.5"
                  fontFamily="Lato, sans-serif"
                  fontWeight={700}
                  fill="#000000"
                  style={{ userSelect: 'none' }}
                >
                  {positivos} pts
                </text>

                {/* --- Fila pts negativos --- */}
                <rect
                  x={pad} y={ptsStartY + rowH + 2}
                  width={15} height={15} rx="3"
                  fill="#7A1501"
                />
                <text
                  x={pad + 20}
                  y={ptsStartY + rowH + 2 + 12}
                  fontSize="12.5"
                  fontFamily="Lato, sans-serif"
                  fontWeight={700}
                  fill="#000000"
                  style={{ userSelect: 'none' }}
                >
                  {negativos} pts
                </text>
              </g>
            );
          })()
        )}
      </svg>

      <div className="absolute bottom-3 right-3 z-30 flex flex-col gap-1.5">
        {/* Boton ojo: muestra/oculta el grafo completo con blur */}
        {onToggleBlur && (
          <button
            type="button"
            className="h-8 w-8 rounded-md border bg-white border-gray-200 shadow flex items-center justify-center transition-colors hover:border-emerald-600/50"
            onClick={onToggleBlur}
            aria-label={isBlurred ? 'Mostrar sociograma' : 'Ocultar sociograma'}
            title={isBlurred ? 'Mostrar sociograma' : 'Ocultar sociograma'}
          >
            <img
              src={isBlurred ? closeEyeIcon : openEyeIcon}
              alt=""
              width={16}
              height={16}
              aria-hidden
            />
          </button>
        )}
        {/* Boton persona: muestra/oculta nombres en el tooltip hover */}
        {onToggleNodeNames && (
          <button
            type="button"
            className="h-8 w-8 rounded-md border bg-white border-gray-200 shadow flex items-center justify-center transition-colors hover:border-emerald-600/50"
            onClick={onToggleNodeNames}
            aria-label={showNodeNames ? 'Ocultar nombres' : 'Mostrar nombres'}
            title={showNodeNames ? 'Ocultar nombres' : 'Mostrar nombres'}
          >
            <img
              src={showNodeNames ? visibilityIcon : noVisibilityIcon}
              alt=""
              width={16}
              height={16}
              aria-hidden
            />
          </button>
        )}
        <button
          type="button"
          className="h-8 w-8 rounded-md bg-[#0F9B46] text-lg font-semibold leading-none text-white shadow hover:bg-[#0D873E]"
          onClick={() => setZoom((value) => clamp(roundTo1(value + 0.1), 0.6, 1.9))}
          aria-label="Acercar"
          title="Acercar"
        >
          +
        </button>
        <button
          type="button"
          className="h-8 w-8 rounded-md bg-[#0F9B46] text-lg font-semibold leading-none text-white shadow hover:bg-[#0D873E]"
          onClick={() => setZoom((value) => clamp(roundTo1(value - 0.1), 0.6, 1.9))}
          aria-label="Alejar"
          title="Alejar"
        >
          -
        </button>
        <button
          type="button"
          className="h-8 w-8 rounded-md border border-[#0F9B46] bg-white text-sm font-semibold text-[#0F9B46] shadow hover:bg-green-50"
          onClick={() => setZoom(1)}
          aria-label="Reset de zoom"
          title="Reset de zoom"
        >
          1:1
        </button>
      </div>
    </div>
  );
}

export default SociogramGraph;
