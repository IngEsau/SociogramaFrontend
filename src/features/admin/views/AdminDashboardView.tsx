/**
 * Vista del Dashboard de Administrador
 * 
 * Esta es la vista principal para usuarios con rol ADMIN.
 * Muestra información del periodo actual, estadísticas y vista previa del sociograma.
 */

import {
  PeriodInfoCard,
  SociogramPreviewCard,
} from '../../../components/shared/dashboard';

export function AdminDashboardView() {
  // Datos mock - se reemplazarán por datos reales del backend
  const periodData = {
    periodName: 'septiembre - diciembre',
    totalStudents: 320,
    completedSociograms: 4,
    totalSociograms: 12,
  };

  const handleConfigure = () => {
    // TODO: Navegar a configuración del periodo
    console.log('Configurar periodo');
  };

  const handleDelete = () => {
    // TODO: Mostrar modal de confirmación
    console.log('Eliminar periodo');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Card de información del periodo */}
      <PeriodInfoCard
        periodName={periodData.periodName}
        totalStudents={periodData.totalStudents}
        completedSociograms={periodData.completedSociograms}
        totalSociograms={periodData.totalSociograms}
        onConfigure={handleConfigure}
        onDelete={handleDelete}
      />

      {/* Vista previa del sociograma */}
      <SociogramPreviewCard
        hasData={false}
        emptyMessage="Aquí se mostrará una vista previa del sociograma final del periodo"
      />
    </div>
  );
}

export default AdminDashboardView;
