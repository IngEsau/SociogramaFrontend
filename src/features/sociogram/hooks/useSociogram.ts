/**
 * Hook para manejar el estado y lógica del sociograma
 */

import { useState, useCallback, useMemo } from 'react';
import type { 
  SociogramData, 
  SociogramConfig, 
  GlobalMetrics,
  GraphNode,
} from '../types';
import { calculateMetrics, normalizeGraphData } from '../utils/graphMath';

interface UseSociogramOptions {
  initialData?: SociogramData;
  initialConfig?: Partial<SociogramConfig>;
}

interface UseSociogramReturn {
  // Data
  data: SociogramData | null;
  metrics: GlobalMetrics | null;
  
  // Config
  config: SociogramConfig;
  setConfig: (config: Partial<SociogramConfig>) => void;
  
  // Actions
  setData: (data: SociogramData) => void;
  highlightNode: (nodeId: number | null) => void;
  filterByQuestion: (questionId: number | null) => void;
  filterByType: (type: 'eleccion' | 'rechazo' | 'all') => void;
  
  // Selection
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  
  // State
  isLoading: boolean;
  error: string | null;
}

const defaultConfig: SociogramConfig = {
  showLabels: true,
  showEdges: true,
  showMetrics: true,
  filterByType: 'all',
  colorScheme: 'default',
  eleccionColor: '#22c55e',
  rechazoColor: '#ef4444',
  layout: 'force',
};

export function useSociogram(options: UseSociogramOptions = {}): UseSociogramReturn {
  const { initialData, initialConfig } = options;

  // State
  const [rawData, setRawData] = useState<SociogramData | null>(initialData || null);
  const [config, setConfigState] = useState<SociogramConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed: normalized data
  const data = useMemo(() => {
    if (!rawData) return null;
    return normalizeGraphData(rawData);
  }, [rawData]);

  // Computed: metrics
  const metrics = useMemo(() => {
    if (!data) return null;
    return calculateMetrics(data);
  }, [data]);

  // Actions
  const setData = useCallback((newData: SociogramData) => {
    setIsLoading(true);
    setError(null);
    try {
      setRawData(newData);
    } catch {
      setError('Error al procesar los datos del sociograma');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setConfig = useCallback((partialConfig: Partial<SociogramConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partialConfig }));
  }, []);

  const highlightNode = useCallback((nodeId: number | null) => {
    setConfig({ highlightNode: nodeId ?? undefined });
  }, [setConfig]);

  const filterByQuestion = useCallback((questionId: number | null) => {
    setConfig({ filterByQuestion: questionId ?? undefined });
  }, [setConfig]);

  const filterByType = useCallback((type: 'eleccion' | 'rechazo' | 'all') => {
    setConfig({ filterByType: type });
  }, [setConfig]);

  return {
    data,
    metrics,
    config,
    setConfig,
    setData,
    highlightNode,
    filterByQuestion,
    filterByType,
    selectedNode,
    setSelectedNode,
    isLoading,
    error,
  };
}

export default useSociogram;
