/**
 * Vista de Importación de Base de Datos - Admin
 * 
 * Permite al administrador cargar archivos de base de datos
 * y visualizar los logs del sistema.
 */

import { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import {
  DatabaseUploadCard,
  DataPreviewCard,
  LogsCard,
} from '../../../components/shared/dashboard';

interface PreviewData {
  id: string | number;
  [key: string]: unknown;
}

export function AdminDatabaseImportView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Aquí se podría hacer una preview del archivo
    setPreviewData([]);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    try {
      // TODO: Implementar llamada al servicio de importación
      // await adminService.importDatabase(selectedFile);
      console.log('Importando archivo:', selectedFile.name);
    } catch (error) {
      console.error('Error al importar:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = () => {
    setSelectedFile(null);
    setPreviewData([]);
  };

  // Mock logs para demostración (tipado explícito)
  const mockLogs: {
    id: number | string;
    timestamp: string;
    action: string;
    user?: string;
    level?: 'info' | 'warning' | 'error';
    details?: string;
  }[] = [];

  return (
    <div className="space-y-6">
      {/* Layout principal - Grid responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        {/* Columna izquierda - Upload y Preview */}
        <div className="space-y-4 sm:space-y-6">
          {/* Card de carga de archivos */}
          <DatabaseUploadCard
            onFileSelect={handleFileSelect}
            acceptedFormats={['.sql', '.zip', '.csv', '.xlsx']}
          />

          {/* Preview de datos */}
          <DataPreviewCard
            data={previewData}
            emptyMessage="Aún no hay nada que mostrar"
          />
        </div>

        {/* Columna derecha - Logs (se oculta en móvil y se muestra abajo) */}
        <div className="hidden xl:block">
          <LogsCard
            logs={mockLogs}
            title="Logs"
            className="sticky top-0"
          />
        </div>
      </div>

      {/* Logs en móvil/tablet - Se muestra debajo */}
      <div className="xl:hidden">
        <LogsCard
          logs={mockLogs}
          title="Logs"
        />
      </div>

      {/* Botones de acción - Responsivos */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          className="bg-[#0B5A4A] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium hover:bg-[#0B5A4A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
        >
          {isImporting ? 'Importando...' : 'Importar'}
          <ExternalLink size={14} className="sm:w-4 sm:h-4" />
        </button>
        
        <button
          onClick={handleDelete}
          disabled={!selectedFile}
          className="bg-red-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
        >
          Eliminar <Trash2 size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}

export default AdminDatabaseImportView;
