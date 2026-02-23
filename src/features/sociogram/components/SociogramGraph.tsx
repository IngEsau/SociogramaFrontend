/**
 * Renderizador SVG del sociograma.
 * Dibuja nodos, conexiones dirigidas y controles de zoom.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GraphEdge, GraphNode, SociogramConfig, SociogramData } from '../types';
import { normalizeGraphData } from '../utils';

interface SociogramGraphProps {
  data: SociogramData | null;
  config?: Partial<SociogramConfig>;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
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

function buildSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<number, SimulationNode> {
  const centerX = width / 2;
  const centerY = height / 2;

  const seeded = [...nodes]
    .map((node, index) => ({
      id: node.id,
      radius: clamp(node.size ?? 26, 14, 86),
      index,
    }))
    .sort((a, b) => b.radius - a.radius);

  const states: SimulationNode[] = seeded.map((node, index) => {
    if (index === 0) {
      return {
        id: node.id,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        radius: node.radius,
      };
    }

    const ring = 150 + Math.floor((index - 1) / 8) * 95;
    const angle = ((index - 1) / Math.max(1, seeded.length - 1)) * Math.PI * 2;
    const wobble = ((index % 3) - 1) * 12;

    return {
      id: node.id,
      x: centerX + Math.cos(angle) * (ring + wobble),
      y: centerY + Math.sin(angle) * (ring - wobble),
      vx: 0,
      vy: 0,
      radius: node.radius,
    };
  });

  const stateById = new Map<number, SimulationNode>();
  states.forEach((node) => stateById.set(node.id, node));

  const repulsionFactor = 8000;
  const springFactor = 0.02;
  const centerForce = 0.0023;
  const damping = 0.87;
  const maxStep = 9.5;

  for (let iteration = 0; iteration < 260; iteration += 1) {
    for (let i = 0; i < states.length; i += 1) {
      const a = states[i];
      for (let j = i + 1; j < states.length; j += 1) {
        const b = states[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 0.1;
        const dist = Math.sqrt(distSq);
        const minDist = a.radius + b.radius + 30;
        const force = (repulsionFactor * minDist * minDist) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    edges.forEach((edge) => {
      const source = stateById.get(edge.source);
      const target = stateById.get(edge.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDistance = source.radius + target.radius + (edge.reciproco ? 26 : 52);
      const stretch = dist - idealDistance;
      const force = stretch * springFactor;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    states.forEach((node) => {
      node.vx += (centerX - node.x) * centerForce;
      node.vy += (centerY - node.y) * centerForce;

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

  const startX = source.x + ux * (source.radius - 1);
  const startY = source.y + uy * (source.radius - 1);
  const endX = target.x - ux * (target.radius + 5);
  const endY = target.y - uy * (target.radius + 5);

  if (!reciprocal) {
    return `M ${roundTo1(startX)} ${roundTo1(startY)} L ${roundTo1(endX)} ${roundTo1(endY)}`;
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -uy;
  const perpY = ux;
  const curveMagnitude = source.id < target.id ? 20 : -20;
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
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 ${className}`}>
        <div className="flex min-h-[420px] items-center justify-center">
          <p className="text-sm text-gray-500">Cargando sociograma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 ${className}`}>
        <div className="flex min-h-[420px] items-center justify-center">
          <p className="max-w-md text-center text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!normalizedData || normalizedData.nodes.length === 0 || !simulation) {
    return (
      <div className={`rounded-xl border border-emerald-600/35 bg-white p-6 ${className}`}>
        <div className="flex min-h-[420px] items-center justify-center">
          <p className="text-sm text-gray-500">No hay datos del sociograma para mostrar.</p>
        </div>
      </div>
    );
  }

  const centerX = VIEWBOX_WIDTH / 2;
  const centerY = VIEWBOX_HEIGHT / 2;
  const zoomTransform = `translate(${centerX} ${centerY}) scale(${zoom}) translate(${-centerX} ${-centerY})`;

  return (
    <div className={`relative rounded-xl border border-emerald-600/35 bg-[#f4f5f6] ${className}`}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-full min-h-[420px] w-full rounded-xl"
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

          <marker id="arrow-regular" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#21242A" />
          </marker>
          <marker id="arrow-negative" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#5A0D0D" />
          </marker>
        </defs>

        <g transform={zoomTransform}>
          {normalizedData.edges.map((edge) => {
            const source = simulation.get(edge.source);
            const target = simulation.get(edge.target);
            if (!source || !target) return null;

            const path = getEdgePath(source, target, Boolean(edge.reciproco));
            const edgeColor = edge.type === 'rechazo' ? '#5A0D0D' : '#21242A';
            const strokeWidth = clamp(1 + (edge.weight ?? 1) * 0.14, 1.1, 3.2);

            return (
              <path
                key={edge.id}
                d={path}
                stroke={edgeColor}
                strokeWidth={strokeWidth}
                fill="none"
                markerEnd={edge.type === 'rechazo' ? 'url(#arrow-negative)' : 'url(#arrow-regular)'}
                opacity={0.95}
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
              </g>
            );
          })}
        </g>

        {hoveredNode && (
          <g
            transform={`translate(${clamp(((hoveredNode.simNode.x - centerX) * zoom) + centerX + 14, 10, VIEWBOX_WIDTH - 220)} ${clamp(((hoveredNode.simNode.y - centerY) * zoom) + centerY - 24, 16, VIEWBOX_HEIGHT - 90)})`}
            pointerEvents="none"
          >
            <rect width="206" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
            <text x="10" y="20" fontSize="12" fill="#0F172A" fontWeight={600}>
              {hoveredNode.node.matricula ? `${hoveredNode.node.matricula} · ` : ''}
              {hoveredNode.node.label}
            </text>
            <text x="10" y="38" fontSize="11" fill="#0A5B50">
              + {hoveredNode.node.puntosPositivos ?? 0} pts
            </text>
            <text x="10" y="54" fontSize="11" fill="#7A1501">
              - {hoveredNode.node.puntosNegativos ?? 0} pts
            </text>
          </g>
        )}
      </svg>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
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
