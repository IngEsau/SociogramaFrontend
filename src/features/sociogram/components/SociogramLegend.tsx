/**
 * Leyenda visual del sociograma.
 */

interface SociogramLegendProps {
  className?: string;
}

function LegendNode({
  label,
  gradient,
}: {
  label: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-8 w-8 rounded-full border border-black/25 shadow-[inset_-6px_-6px_14px_rgba(0,0,0,0.32)]"
        style={{ background: gradient }}
      />
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  );
}

export function SociogramLegend({ className = '' }: SociogramLegendProps) {
  return (
    <aside className={`border-l border-black/20 pl-4 xl:pl-5 ${className}`}>
      <h3 className="mb-4 text-sm font-semibold text-gray-800">Leyenda</h3>

      <div className="space-y-3">
        <LegendNode
          label="Aceptado"
          gradient="radial-gradient(circle at 30% 25%, #2C8E80 0%, #0C5B4F 58%, #003A33 100%)"
        />
        <LegendNode
          label="Rechazado"
          gradient="radial-gradient(circle at 30% 25%, #7F2A2A 0%, #5B0D0D 58%, #3A0404 100%)"
        />
        <LegendNode
          label="Neutro / Invisible"
          gradient="radial-gradient(circle at 30% 25%, #7A7F87 0%, #4A4F56 58%, #2E3136 100%)"
        />
      </div>

      <div className="my-4 h-px bg-black/15" />

      <div className="space-y-3 text-xs text-gray-700">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-full border border-dashed border-black/35 bg-white/70" />
          <span>+ Impacto</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 rounded-full border border-dashed border-black/35 bg-white/70" />
          <span>- Impacto</span>
        </div>
        <div className="flex items-center gap-3">
          <svg width="56" height="10" viewBox="0 0 56 10" fill="none" aria-hidden>
            <path d="M1 5H55" stroke="#202328" strokeWidth="1.5" />
            <path d="M7 2L1 5L7 8" stroke="#202328" strokeWidth="1.5" />
            <path d="M49 2L55 5L49 8" stroke="#202328" strokeWidth="1.5" />
          </svg>
          <span>Conexiones fuertes</span>
        </div>
      </div>
    </aside>
  );
}

export default SociogramLegend;

