/**
 * Componente del canvas del sociograma (placeholder)
 * Este componente mostrará el gráfico del sociograma
 */

export function SociogramCanvasCard() {
  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm relative">
      <div className="min-h-[340px] md:min-h-[520px] rounded-xl" />

      <button
        className="absolute right-4 bottom-4 w-10 h-10 rounded-lg bg-green-600 text-white font-bold text-xl shadow-md hover:opacity-90"
        aria-label="Agregar"
      >
        +
      </button>
    </div>
  );
}
