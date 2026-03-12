/**
 * Skeleton de carga.
 *
 * Bloque animado que simula contenido mientras los datos reales
 * no estan disponibles. Usa pulse de Tailwind.
 *
 * Variantes:
 * - text:   linea de texto (alto 14px)
 * - title:  titulo (alto 24px)
 * - card:   tarjeta completa (alto libre, configurable)
 * - circle: circulo (para avatares o graficos radiales)
 * - bar:    barra horizontal (para barras de progreso, KPI values)
 *
 * Uso:
 *   <Skeleton variant="text" className="w-32" />
 *   <Skeleton variant="card" className="h-40" />
 *   <Skeleton variant="circle" className="h-24 w-24" />
 */

const variantMap = {
  text: 'h-3.5 rounded',
  title: 'h-6 rounded',
  card: 'rounded-xl',
  circle: 'rounded-full',
  bar: 'h-4 rounded-full',
} as const;

type SkeletonVariant = keyof typeof variantMap;

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantMap[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
