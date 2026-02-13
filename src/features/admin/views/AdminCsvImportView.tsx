/**
 * Vista de Importación CSV - Admin
 *
 * Vista reutilizable para importar archivos CSV según el tipo:
 * - csv: /api/admin/import-csv/
 * - docentes: /api/admin/import-docentes/
 * - alumnos: /api/admin/import-alumnos/
 *
 * Se determina el tipo por el parámetro de ruta.
 */

import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Upload,
  FileText,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services';
import { useToastStore } from '../../../store';
import type { CsvImportResponse } from '../types';

/**
 * Extrae un mensaje legible desde un error de axios o genérico.
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;

    if (data) {
      if (typeof data === 'string') return data;
      if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      if (data.errors && Array.isArray(data.errors)) return data.errors.join('. ');
      const fallback = JSON.stringify(data);
      if (fallback !== '{}') return fallback;
    }

    if (status === 400) return 'El archivo no tiene el formato esperado. Verifica que sea un CSV valido.';
    if (status === 413) return 'El archivo es demasiado grande para ser procesado.';
    if (status === 415) return 'Formato de archivo no soportado. Solo se aceptan archivos .csv';
    if (status === 500) return 'Error interno del servidor. Intenta de nuevo mas tarde.';

    return error.message || 'Error de conexion con el servidor';
  }

  if (error instanceof Error) return error.message;
  return 'Ocurrio un error inesperado';
}

type CsvType = 'csv' | 'docentes' | 'alumnos';

const CONFIG: Record<CsvType, { title: string; description: string; icon: React.ReactNode; endpoint: string }> = {
  csv: {
    title: 'Importar CSV general',
    description: 'Carga masiva de datos desde un archivo CSV con formato estándar.',
    icon: <FileText size={20} />,
    endpoint: 'import-csv',
  },
  docentes: {
    title: 'Importar Docentes',
    description: 'Importa el listado de docentes/tutores desde un archivo CSV.',
    icon: <Users size={20} />,
    endpoint: 'import-docentes',
  },
  alumnos: {
    title: 'Importar Alumnos',
    description: 'Importa el listado de alumnos desde un archivo CSV.',
    icon: <GraduationCap size={20} />,
    endpoint: 'import-alumnos',
  },
};

export function AdminCsvImportView() {
  const { type = 'csv' } = useParams<{ type: string }>();
  const csvType = (Object.keys(CONFIG).includes(type) ? type : 'csv') as CsvType;
  const config = CONFIG[csvType];

  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<CsvImportResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      let response: CsvImportResponse;

      switch (csvType) {
        case 'docentes':
          response = await adminService.importDocentes(selectedFile);
          break;
        case 'alumnos':
          response = await adminService.importAlumnos(selectedFile);
          break;
        default:
          response = await adminService.importCsv(selectedFile);
      }

      setResult(response);
      showToast({
        message: response.message || 'Importación completada',
        type: response.success ? 'success' : 'error',
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      showToast({ message, type: 'error' });
      setResult({ success: false, message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/import')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Volver"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#313131]">
            {config.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Card principal */}
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-[#0B5A4A]">
            {config.icon}
            <h2 className="text-base sm:text-lg font-semibold text-[#313131]">
              {config.title}
            </h2>
          </div>

          {/* Zona de upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 bg-gray-50/50 transition-colors"
          >
            <Upload size={36} className="text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 text-center">
              Haz click para seleccionar un archivo CSV
            </p>
            <p className="text-xs text-gray-400 mt-1">Solo archivos .csv</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Archivo seleccionado */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
                title="Quitar archivo"
              >
                <X size={16} className="text-emerald-600" />
              </button>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div
              className={`flex items-start gap-3 rounded-lg p-4 ${
                result.success
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {result.success ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    result.success ? 'text-emerald-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </p>
                {result.registros_procesados !== undefined && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {result.registros_procesados} registros procesados
                  </p>
                )}
                {result.errores && result.errores.length > 0 && (
                  <ul className="text-xs text-red-600 mt-2 space-y-0.5">
                    {result.errores.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Botón importar */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full bg-[#0B5A4A] text-white py-2.5 rounded-lg text-sm font-medium
              hover:bg-[#0B5A4A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importando...
              </>
            ) : (
              'Importar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
