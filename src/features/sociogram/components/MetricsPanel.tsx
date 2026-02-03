/**
 * Panel de métricas del sociograma
 * 
 * Muestra las métricas globales y del nodo seleccionado
 */

import type { GlobalMetrics, GraphNode } from '../types';

interface MetricsPanelProps {
  globalMetrics?: GlobalMetrics | null;
  selectedNode?: GraphNode | null;
  className?: string;
}

export function MetricsPanel({
  globalMetrics,
  selectedNode,
  className = '',
}: MetricsPanelProps) {
  return (
    <div className={`bg-white rounded-xl border border-emerald-600/35 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Métricas</h3>

      {/* Métricas globales */}
      {globalMetrics && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-gray-500 font-medium">Globales</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Cohesión</p>
              <p className="text-lg font-semibold text-gray-800">
                {(globalMetrics.indice_cohesion * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Densidad +</p>
              <p className="text-lg font-semibold text-green-600">
                {(globalMetrics.densidad_positiva * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Densidad -</p>
              <p className="text-lg font-semibold text-red-600">
                {(globalMetrics.densidad_negativa * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Reciprocidad</p>
              <p className="text-lg font-semibold text-blue-600">
                {(globalMetrics.reciprocidad_elecciones * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Distribución */}
          <div className="text-xs">
            <p className="text-gray-500 font-medium mb-1">Distribución</p>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                {globalMetrics.total_lideres} líderes
              </span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                {globalMetrics.total_aislados} aislados
              </span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                {globalMetrics.total_rechazados} rechazados
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Métricas del nodo seleccionado */}
      {selectedNode && selectedNode.metrics && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Nodo: {selectedNode.label}
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Elecciones recibidas</p>
              <p className="font-semibold text-green-600">
                {selectedNode.metrics.elecciones_recibidas}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Rechazos recibidos</p>
              <p className="font-semibold text-red-600">
                {selectedNode.metrics.rechazos_recibidos}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Popularidad</p>
              <p className="font-semibold">
                {(selectedNode.metrics.indice_popularidad * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold capitalize">
                {selectedNode.metrics.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {!globalMetrics && !selectedNode && (
        <p className="text-xs text-gray-400 text-center py-4">
          No hay datos disponibles
        </p>
      )}
    </div>
  );
}

export default MetricsPanel;
