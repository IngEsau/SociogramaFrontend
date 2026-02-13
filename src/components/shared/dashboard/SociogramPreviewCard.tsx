/**
 * Componente de vista previa del sociograma
 * Muestra un placeholder o el canvas del sociograma final del periodo
 */

interface SociogramPreviewCardProps {
  hasData?: boolean;
  emptyMessage?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SociogramPreviewCard({
  hasData = false,
  emptyMessage = 'Aquí se mostrará una vista previa del sociograma final del periodo',
  className = '',
  children,
}: SociogramPreviewCardProps) {
  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <div className="min-h-[200px] sm:min-h-[280px] lg:min-h-[350px] flex items-center justify-center">
        {hasData && children ? (
          children
        ) : (
          <p className="text-xs sm:text-sm text-gray-400 text-center px-4 max-w-sm leading-relaxed">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
