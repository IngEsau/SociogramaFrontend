/**
 * Vista del Dashboard del Comité
 * 
 * Esta es la vista principal para usuarios con rol COMITE.
 * Proporciona una vista global de supervisión de todos los sociogramas.
 */

import {
  SociogramCanvasCard,
  ActivityLogCard,
  ResponsesProgressCard,
  ClassificationCard,
} from '../../../components/shared/dashboard';

export function CommitteeDashboardView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-stretch">
      <section className="flex flex-col gap-6 min-w-0">
        {/* Banner de supervisión */}
        <div className="bg-gradient-to-r from-[#0F7E3C] to-[#245C52] rounded-xl shadow-sm p-6 text-white">
          <h1 className="text-xl font-semibold mb-2">Panel de Supervisión</h1>
          <p className="text-white/80 text-sm">
            Vista global de todos los sociogramas y actividad del sistema.
          </p>
        </div>

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

export default CommitteeDashboardView;
