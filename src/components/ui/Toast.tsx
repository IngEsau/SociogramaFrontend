/**© 2017 - 2026, Universidad Tecnológica de Puebla
 * Componente Toast personalizado
 * Muestra notificaciones temporales con acciones opcionales
 */

import { useState, useEffect } from 'react';
import { CloseIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon, AlertTriangleIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  action?: ToastAction;
  isVisible: boolean;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    icon: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    icon: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'text-blue-500',
  },
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = `w-5 h-5 ${toastStyles[type].icon}`;

  switch (type) {
    case 'success':
      return <CheckCircleIcon className={iconClass} />;
    case 'error':
      return <AlertCircleIcon className={iconClass} />;
    case 'warning':
      return <AlertTriangleIcon className={iconClass} />;
    case 'info':
      return <InfoIcon className={iconClass} />;
  }
};

export const Toast = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
  isVisible,
}: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Si hay una acción, no cerrar automáticamente
    if (action) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Esperar la animación de salida
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, isVisible, action]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  const styles = toastStyles[type];

  return (
    <div
      className={`
        fixed top-4 right-4 z-9999 max-w-md w-full mx-4
        ${styles.bg} ${styles.border} border-l-4 rounded-lg shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ToastIcon type={type} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-medium whitespace-pre-line">
              {message}
            </p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-semibold text-[#0F7E3C] hover:text-[#0d6b33] underline underline-offset-2 transition-colors cursor-pointer"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar notificación"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
