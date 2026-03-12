/**
 * Spinner unificado del sistema.
 *
 * UNICO patron visual de carga para toda la aplicacion.
 * Doble anillo: uno estatico de fondo y un arco giratorio.
 *
 * Tamanios disponibles:
 * - xs  (14px) — dentro de botones compactos
 * - sm  (18px) — dentro de botones normales, indicadores inline
 * - md  (32px) — secciones de contenido, paneles laterales
 * - lg  (48px) — carga de pagina completa, bootstrap de vista
 *
 * Color por defecto: #0B5A4A (verde institucional).
 *
 * Uso:
 *   <Spinner />                           // md, verde institucional
 *   <Spinner size="sm" />                 // boton
 *   <Spinner size="lg" />                 // pagina
 *   <Spinner className="text-white" />    // color custom (hereda de text-*)
 */

const sizeMap = {
  xs: { box: 'h-3.5 w-3.5', border: 'border-2' },
  sm: { box: 'h-4.5 w-4.5', border: 'border-2' },
  md: { box: 'h-8 w-8', border: 'border-3' },
  lg: { box: 'h-12 w-12', border: 'border-4' },
} as const;

type SpinnerSize = keyof typeof sizeMap;

interface SpinnerProps {
  /** Tamanio del spinner. */
  size?: SpinnerSize;
  /** Clases extra para el contenedor. */
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const { box, border } = sizeMap[size];

  return (
    <span
      className={`relative inline-flex ${box} ${className}`}
      role="status"
      aria-hidden="true"
    >
      {/* Anillo de fondo */}
      <span className={`absolute inset-0 rounded-full ${border} border-current opacity-20`} />
      {/* Arco giratorio */}
      <span className={`absolute inset-0 animate-spin rounded-full ${border} border-transparent border-t-current`} />
    </span>
  );
}

export default Spinner;
