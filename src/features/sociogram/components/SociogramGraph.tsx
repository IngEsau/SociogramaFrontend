/**
 * Componente principal del grafo del sociograma
 * 
 * Este es un placeholder que será reemplazado con la implementación
 * real usando una librería de grafos (D3.js, vis.js, react-force-graph, etc.)
 */

import type { SociogramData, SociogramConfig } from '../types';

interface SociogramGraphProps {
  data: SociogramData;
  config?: Partial<SociogramConfig>;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  className?: string;
}

export function SociogramGraph({
  data,
  // config,
  // onNodeClick,
  // onNodeHover,
  className = '',
}: SociogramGraphProps) {
  const { nodes, edges } = data;

  return (
    <div className={`relative bg-white rounded-xl border border-emerald-600/35 ${className}`}>
      {/* Placeholder del grafo */}
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🕸️</div>
          <p className="text-lg font-medium">Sociograma</p>
          <p className="text-sm mt-2">
            {nodes.length} nodos • {edges.length} conexiones
          </p>
          <p className="text-xs mt-4 text-gray-300">
            Implementación con D3.js/vis.js pendiente
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
          title="Zoom in"
        >
          ➕
        </button>
        <button
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
          title="Zoom out"
        >
          ➖
        </button>
        <button
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
          title="Centrar"
        >
          🎯
        </button>
      </div>
    </div>
  );
}

export default SociogramGraph;
