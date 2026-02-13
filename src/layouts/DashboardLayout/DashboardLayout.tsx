import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Download } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTopbarStore } from "../../store";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mobileAction, actions } = useTopbarStore();

  // Si hay acciones custom, el primer botón primario se usa como acción móvil
  const mobileBtn = mobileAction
    || actions.find((a) => a.variant !== 'outline')
    || null;

  return (
    <div className="h-dvh bg-[#F7F8FA] flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/10 p-3">
          {mobileBtn ? (
            <button
              onClick={mobileBtn.onClick}
              disabled={mobileBtn.disabled}
              className="w-full bg-[#0F7E3C] text-white py-3 rounded-md font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {mobileBtn.label} <Download size={18} />
            </button>
          ) : (
            <button className="w-full bg-[#0B5A4A] text-white py-3 rounded-md font-medium flex items-center justify-center gap-2 hover:opacity-90">
              Exportar <Download size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}