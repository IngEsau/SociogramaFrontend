/**
 * Dialogo de confirmacion reutilizable
 *
 * Muestra un modal con animacion CSS segun la prop open.
 * Se usa para confirmar acciones criticas como cerrar sesion.
 */

import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

// Icono SVG segun variante
function DialogIcon({ variant }: { variant: NonNullable<ConfirmDialogProps['variant']> }) {
  if (variant === 'danger') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-600"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    );
  }

  if (variant === 'warning') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-600"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-600"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const iconBg: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger: 'bg-red-100',
  warning: 'bg-amber-100',
  info: 'bg-blue-100',
};

const confirmBtnColor: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  warning: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
  info: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Foco accesible al boton cancelar cuando se abre
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      aria-hidden={!open}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      className={`
        fixed inset-0 z-9999 flex items-center justify-center p-4
        transition-all duration-200
        ${open ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-transparent opacity-0'}
      `}
      onClick={onCancel}
    >
      <div
        className={`
          bg-white rounded-xl shadow-2xl w-full max-w-sm
          transition-all duration-200
          ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg[variant]}`}>
            <DialogIcon variant={variant} />
          </div>
          <h3 id="confirm-dialog-title" className="text-base font-bold text-gray-900 leading-snug">
            {title}
          </h3>
        </div>

        {/* Descripcion */}
        <p id="confirm-dialog-desc" className="px-6 pb-6 text-sm text-gray-600 leading-relaxed">
          {description}
        </p>

        {/* Acciones */}
        <div className="flex gap-2 justify-end px-6 pb-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${confirmBtnColor[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}