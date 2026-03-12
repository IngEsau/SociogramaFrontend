import { Suspense } from 'react';

interface LazyRouteProps {
  children: React.ReactNode;
}

/**
 * Envuelve componentes lazy en un Suspense sin indicador visible.
 * El DashboardLayout ya maneja sus propios estados de carga.
 */
export function LazyRoute({ children }: LazyRouteProps) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
