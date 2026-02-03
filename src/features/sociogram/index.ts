/**
 * Feature Sociogram (Core)
 * 
 * Módulo transversal que contiene la lógica y componentes
 * de visualización del sociograma. Es usado por tutor, committee y reports.
 */

// Components
export { SociogramGraph, SociogramLegend, MetricsPanel } from './components';

// Hooks
export { useSociogram } from './hooks';

// Utils
export { calculateMetrics, normalizeGraphData } from './utils';

// Types
export * from './types';
