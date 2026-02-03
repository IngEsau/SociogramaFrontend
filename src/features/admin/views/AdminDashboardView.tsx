/**
 * Vista del Dashboard de Administrador
 * 
 * Esta es la vista principal para usuarios con rol ADMIN.
 * Proporciona acceso a todas las funcionalidades administrativas.
 */

import {
  SociogramCanvasCard,
  ActivityLogCard,
  ResponsesProgressCard,
  ClassificationCard,
} from '../../../components/shared/dashboard';

export function AdminDashboardView() {
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

export default AdminDashboardView;
