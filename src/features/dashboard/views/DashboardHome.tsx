export default function DashboardHome() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-stretch">
      <section className="flex flex-col gap-6 min-w-0">
        <SociogramCanvasCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden">
          <ResponsesProgressCard />
          <ClassificationCard />
        </div>

        <ActivityLogCard />
      </section>

      <aside className="hidden lg:flex flex-col gap-6 self-stretch min-h-0">
        <ResponsesProgressCard />
        <div className="flex-1 min-h-0">
          <ClassificationCard className="h-full" />
        </div>
      </aside>
    </div>
  );
}


/** -------------------------
 *  Componentes dummy por ahora
 *  ------------------------- */

function SociogramCanvasCard() {
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

function ActivityLogCard() {
  const items = [
    {
      name: "Carlos Rodríguez Sánchez",
      action: "ha comenzado a realizar el formulario.",
      time: "17:02:02 a 28 del Agosto del 2025",
    },
    {
      name: "Juan Hernández López",
      action: "ha comenzado a realizar el formulario.",
      time: "17:02:27 a 28 del Agosto del 2025",
    },
    {
      name: "Isabel Jiménez Soto",
      action: "ha finalizado el formulario.",
      time: "17:02:54 a 28 del Agosto del 2025",
    },
    {
      name: "Elena Vargas Reyes",
      action: "ha comenzado a realizar el formulario.",
      time: "17:03:05 a 28 del Agosto del 2025",
    },
    {
      name: "Patricia Serrano Delgado",
      action: "ha finalizado el formulario.",
      time: "17:04:03 a 28 del Agosto del 2025",
    },
  ];

  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5">
      <h2 className="text-green-700 font-semibold text-lg mb-3">
        Registro de actividades
      </h2>

      <ul className="space-y-2 text-sm text-gray-700">
        {items.map((it, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-gray-400">•</span>
            <div>
              <span className="font-semibold">{it.name}</span> {it.action}{" "}
              <span className="text-gray-400">{it.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResponsesProgressCard() {
  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4">
      <div className="mb-2">
        <h3 className="text-green-700 font-semibold">Total de respuestas</h3>
        <p className="text-xs text-gray-400">0 respuestas</p>
      </div>
      <div className="flex justify-center py-2">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-base font-bold text-gray-800">0%</div>
            <div className="text-xs text-gray-500">Progreso</div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ClassificationCard({ className = "" }: { className?: string }) {
  const rows = [
    { name: "Jesús Ortega Luna", score: 147 },
    { name: "Francisco Martínez Martínez", score: 142 },
    { name: "Julieta Tórrez Pérez", score: 133 },
    { name: "Miranda Morales Morales", score: 121 },
    { name: "Estef Nivarna de Jesús", score: 109 },
    { name: "Juan Hernández López", score: 95 },
    { name: "María García Martínez", score: 94 },
  ];

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-green-700 font-semibold">Clasificación</h3>
          <p className="text-xs text-gray-400">1. ¿A quién elegirías para...?</p>
        </div>
        <button className="text-green-700 text-lg leading-none">≡</button>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span className="font-semibold text-gray-700">Nombre completo</span>
        <span className="font-semibold text-gray-700">Puntaje</span>
      </div>

      <ul className="mt-2 space-y-3 overflow-auto pr-1 flex-1 min-h-0">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <div className="truncate max-w-[230px]">
              <span className="text-gray-500 mr-2">{i + 1}.</span>
              <span className="font-medium text-gray-800">{r.name}</span>
              <div className="text-xs text-gray-400">UTP012345</div>
            </div>
            <span className="text-gray-500">{r.score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}