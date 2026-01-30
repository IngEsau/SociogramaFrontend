/**
 * Store global para manejar toasts
 * Permite mostrar notificaciones desde cualquier parte de la aplicación
 */

import { create } from 'zustand';
import type { ToastType, ToastAction } from '../components/ui/Toast';

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

interface ToastStore extends ToastState {
  showToast: (options: {
    message: string;
    type?: ToastType;
    action?: ToastAction;
    duration?: number;
  }) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  isVisible: false,
  message: '',
  type: 'info',
  action: undefined,
  duration: 5000,

  showToast: ({ message, type = 'info', action, duration = 5000 }) => {
    set({
      isVisible: true,
      message,
      type,
      action,
      duration,
    });
  },

  hideToast: () => {
    set({
      isVisible: false,
      message: '',
      action: undefined,
    });
  },
}));
