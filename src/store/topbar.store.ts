/**
 * Store para configuración dinámica del Topbar
 *
 * Permite que cada vista defina qué contenido muestra el Topbar
 * (botones, selectores, acciones) según la ruta actual.
 */

import { create } from 'zustand';
import type { ReactNode } from 'react';

/** Acción personalizada del Topbar */
export interface TopbarAction {
  id: string;
  label: string;
  icon?: 'download' | 'export';
  variant?: 'primary' | 'outline';
  onClick: () => void;
  disabled?: boolean;
}

/** Configuración completa del Topbar */
interface TopbarConfig {
  /** Contenido personalizado para la zona derecha. Si es null, se muestra el default */
  actions: TopbarAction[];
  /** Si se deben ocultar los selectores por defecto (grupo, sociograma) */
  hideDefaultSelectors: boolean;
  /** Texto informativo adicional (ej: "Último registro: 28/08/2025") */
  infoText: string | null;
  /** Botón móvil inferior personalizado */
  mobileAction: TopbarAction | null;
  /** Componente personalizado para la zona derecha del Topbar */
  customContent: ReactNode | null;
}

interface TopbarStore extends TopbarConfig {
  setTopbarConfig: (config: Partial<TopbarConfig>) => void;
  resetTopbar: () => void;
}

const defaultConfig: TopbarConfig = {
  actions: [],
  hideDefaultSelectors: false,
  infoText: null,
  mobileAction: null,
  customContent: null,
};

export const useTopbarStore = create<TopbarStore>((set) => ({
  ...defaultConfig,

  setTopbarConfig: (config) => set((state) => ({ ...state, ...config })),

  resetTopbar: () => set(defaultConfig),
}));
