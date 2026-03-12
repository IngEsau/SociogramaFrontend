/**
 * Componente de carga de pagina completa (page-level loader).
 *
 * Muestra el Spinner del sistema centrado con un mensaje opcional
 * mientras se cargan datos iniciales de un endpoint.
 *
 * Uso:
 *   <PageLoader message="Cargando dashboard..." />
 *   <PageLoader />
 */

import { Spinner } from './Spinner';

interface PageLoaderProps {
  /** Texto descriptivo que aparece debajo del spinner. */
  message?: string;
  /** Clases extra para el contenedor raiz. */
  className?: string;
}

export function PageLoader({ message = 'Cargando...', className = '' }: PageLoaderProps) {
  return (
    <div
      className={`flex min-h-[calc(100vh-12rem)] w-full items-center justify-center ${className}`}
      role="status"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-[#0B5A4A]" />

        {message && (
          <p className="text-sm font-medium text-gray-500 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

export default PageLoader;
