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

  const repulsionFactor = 14000;
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
        // Separacion minima: suma de radios + margen para que nunca se peguen
        const minDist = a.radius + b.radius + 50;
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
      // Aristas reciprocas (conexion fuerte) atraen mas pero con margen suficiente
      const idealDistance = source.radius + target.radius + (edge.reciproco ? 36 : 60);
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

  // Fase final: resolucion de colisiones para garantizar separacion minima
  const minGap = 12; // pixeles minimos entre bordes de nodos
  for (let pass = 0; pass < 50; pass += 1) {
    let resolved = true;
    for (let i = 0; i < states.length; i += 1) {
      const a = states[i];
      for (let j = i + 1; j < states.length; j += 1) {
        const b = states[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const requiredDist = a.radius + b.radius + minGap;

        if (dist < requiredDist) {
          resolved = false;
          const overlap = (requiredDist - dist) / 2 + 1;
          const ux = dx / dist;
          const uy = dy / dist;

          a.x -= ux * overlap;
          a.y -= uy * overlap;
          b.x += ux * overlap;
          b.y += uy * overlap;

          // Re-clamp dentro del viewbox
          a.x = clamp(a.x, PADDING + a.radius, width - PADDING - a.radius);
          a.y = clamp(a.y, PADDING + a.radius, height - PADDING - a.radius);
          b.x = clamp(b.x, PADDING + b.radius, width - PADDING - b.radius);
          b.y = clamp(b.y, PADDING + b.radius, height - PADDING - b.radius);
        }
      }
    }
    if (resolved) break;
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

  // markerUnits="strokeWidth" con markerWidth=6 y strokeWidth=2 => punta de ~12px efectivos
  const arrowTipSize = 12;
  const startOffset = reciprocal
    ? source.radius + arrowTipSize + 2
    : source.radius + 2;
  const endOffset = target.radius + arrowTipSize + 2;

  const startX = source.x + ux * startOffset;
  const startY = source.y + uy * startOffset;
  const endX = target.x - ux * endOffset;
  const endY = target.y - uy * endOffset;

  // Siempre linea recta, tanto para conexiones fuertes como debiles
  return `M ${roundTo1(startX)} ${roundTo1(startY)} L ${roundTo1(endX)} ${roundTo1(endY)}`;
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
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
  const zoomTransform = `translate(${centerX + pan.x} ${centerY + pan.y}) scale(${zoom}) translate(${-centerX} ${-centerY})`;

  return (
    <div className={`relative rounded-xl border border-emerald-600/35 bg-[#f4f5f6] ${className}`}>
      {/* Overlay de blur con fade */}
      <div
        className="absolute inset-0 z-20 rounded-xl pointer-events-none transition-opacity duration-300"
        style={{
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          opacity: isBlurred ? 1 : 0,
          pointerEvents: isBlurred ? 'auto' : 'none',
        }}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-full min-h-105 w-full rounded-xl"
        role="img"
        aria-label="Grafo del sociograma"
        style={{ cursor: 'grab', touchAction: 'none' }}
        onMouseDown={(e) => {
          // Solo panning con boton izquierdo y sin hover en nodo
          if (e.button !== 0) return;
          isPanningRef.current = true;
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseMove={(e) => {
          if (!isPanningRef.current) return;
          const dx = e.clientX - lastPointerRef.current.x;
          const dy = e.clientY - lastPointerRef.current.y;
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
          // Convertir delta de pixeles CSS a unidades del viewBox
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = VIEWBOX_WIDTH / rect.width;
          const scaleY = VIEWBOX_HEIGHT / rect.height;
          setPan((prev) => ({ x: prev.x + dx * scaleX, y: prev.y + dy * scaleY }));
        }}
        onMouseUp={(e) => {
          isPanningRef.current = false;
          e.currentTarget.style.cursor = 'grab';
        }}
        onMouseLeave={(e) => {
          isPanningRef.current = false;
          e.currentTarget.style.cursor = 'grab';
        }}
        onTouchStart={(e) => {
          if (e.touches.length !== 1) return;
          isPanningRef.current = true;
          lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchMove={(e) => {
          if (!isPanningRef.current || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - lastPointerRef.current.x;
          const dy = e.touches[0].clientY - lastPointerRef.current.y;
          lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = VIEWBOX_WIDTH / rect.width;
          const scaleY = VIEWBOX_HEIGHT / rect.height;
          setPan((prev) => ({ x: prev.x + dx * scaleX, y: prev.y + dy * scaleY }));
        }}
        onTouchEnd={() => { isPanningRef.current = false; }}
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

          {/* Punta de flecha fin — todas las conexiones */}
          <marker id="arrow-end" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 6 2.5, 0 5" fill="#1A1A1A" />
          </marker>
          {/* Punta de flecha inicio — conexiones fuertes (reciprocas) */}
          <marker id="arrow-start" markerWidth="6" markerHeight="5" refX="0" refY="2.5" orient="auto-start-reverse" markerUnits="strokeWidth">
            <polygon points="0 0, 6 2.5, 0 5" fill="#1A1A1A" />
          </marker>
        </defs>

        <g transform={zoomTransform}>
          {normalizedData.edges.map((edge) => {
            const source = simulation.get(edge.source);
            const target = simulation.get(edge.target);
            if (!source || !target) return null;

            const path = getEdgePath(source, target, Boolean(edge.reciproco));
            const isReciproca = Boolean(edge.reciproco);

            // Color negro uniforme para todas las conexiones
            const edgeColor = '#1A1A1A';
            // Grosor identico para todos los tipos de conexion
            const strokeWidth = 2;

            const markerEnd = 'url(#arrow-end)';
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
                opacity={1}
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
                  {showNodeNames ? node.label : ''}
                </text>
                {/* El numero de lista se muestra en la bolita solo cuando showNodeNames=true */}
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
            const tooltipW = showNodeNames ? 260 : 180;
            const tooltipH = showNodeNames ? 106 : 76;
            const rowH = 22; // altura de cada fila de pts
            const pad = 13;  // padding interno

            const rawX = ((hoveredNode.simNode.x - centerX) * zoom) + centerX + pan.x + hoveredNode.simNode.radius * zoom + 12;
            const rawY = ((hoveredNode.simNode.y - centerY) * zoom) + centerY + pan.y - tooltipH / 2;
            const tx = clamp(rawX, 8, VIEWBOX_WIDTH - tooltipW - 8);
            const ty = clamp(rawY, 8, VIEWBOX_HEIGHT - tooltipH - 8);

            // Posicion Y de la fila de puntos segun si hay nombre
            const ptsStartY = showNodeNames ? 58 : pad + 8;

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
                      width={17}
                      height={17}
                    />
                    <text
                      x={pad + 22}
                      y={pad + 13}
                      fontSize="14"
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
                  width={16} height={16} rx="3"
                  fill="#0B9624"
                />
                <text
                  x={pad + 22}
                  y={ptsStartY + 13}
                  fontSize="14"
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
                  width={16} height={16} rx="3"
                  fill="#7A1501"
                />
                <text
                  x={pad + 22}
                  y={ptsStartY + rowH + 2 + 13}
                  fontSize="14"
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
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
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
