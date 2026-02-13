/**
 * Vista de Importación Excel - Admin
 *
 * Flujo de 3 pasos:
 * 1. Subir archivo Excel (.xlsx)
 * 2. Vista previa + seleccionar periodo + opciones
 * 3. Progreso de importación y resultados
 *
 * Consume los endpoints:
 * - POST /api/admin/importacion/analizar/
 * - POST /api/admin/importacion/ejecutar/
 * - GET /api/admin/periodos/
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../services';
import { useToastStore } from '../../../store';
import type {
  ExcelAnalysisResponse,
  ExcelExecuteResponse,
  Period,
} from '../types';

// Pasos del wizard
type Step = 'upload' | 'configure' | 'result';

/**
 * Extrae un mensaje legible desde un error de axios o genérico.
 * El backend puede devolver { error: "..." }, { detail: "..." }, { message: "..." }
 * o incluso un array de errores.
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;

    if (data) {
      // El backend puede usar diferentes claves
      if (typeof data === 'string') return data;
      if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      if (data.errors && Array.isArray(data.errors)) return data.errors.join('. ');
      // Si nada coincide, serializar lo que haya
      const fallback = JSON.stringify(data);
      if (fallback !== '{}') return fallback;
    }

    // Mensajes por código HTTP si no hay body útil
    if (status === 400) return 'El archivo no tiene el formato esperado. Verifica que sea un Excel válido con los 4 libros requeridos (relación, inscritos, alumnos, grupos).';
    if (status === 413) return 'El archivo es demasiado grande para ser procesado.';
    if (status === 415) return 'Formato de archivo no soportado. Solo se aceptan archivos .xlsx';
    if (status === 500) return 'Error interno del servidor. Intenta de nuevo más tarde.';

    return error.message || 'Error de conexión con el servidor';
  }

  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}

export function AdminExcelImportView() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del wizard
  const [step, setStep] = useState<Step>('upload');

  // Paso 1: Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Paso 2: Configuración
  const [analysis, setAnalysis] = useState<ExcelAnalysisResponse | null>(null);
  const [periodos, setPeriodos] = useState<Period[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [desactivarAnteriores, setDesactivarAnteriores] = useState(true);
  const [generarReporte, setGenerarReporte] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Paso 3: Resultados
  const [result, setResult] = useState<ExcelExecuteResponse | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [showFullLog, setShowFullLog] = useState(false);

  // Progreso simulado durante la ejecución
  const [progressSteps, setProgressSteps] = useState<
    { label: string; status: 'pending' | 'loading' | 'done'; percent?: number }[]
  >([]);

  // -------------------------------------------
  // Paso 1: Subir archivo
  // -------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
    } else {
      showToast({ message: 'Solo se aceptan archivos .xlsx', type: 'error' });
    }
  }, [showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const [analysisResult, periodosResult] = await Promise.all([
        adminService.analyzeExcel(selectedFile),
        adminService.getPeriodos(),
      ]);

      // Log para debug (temporal - remover en producción)
      console.log('Respuesta del análisis:', analysisResult);

      // Validar que la respuesta tenga la estructura esperada
      if (!analysisResult || typeof analysisResult !== 'object') {
        console.error('Respuesta inválida del servidor:', analysisResult);
        throw new Error('El servidor devolvió una respuesta inválida. Verifica que el archivo Excel tenga el formato correcto.');
      }

      if (!analysisResult.archivo_id) {
        console.error('Falta archivo_id en la respuesta:', analysisResult);
        throw new Error('El servidor no pudo procesar el archivo. Intenta de nuevo o contacta al administrador.');
      }

      if (!analysisResult.resumen) {
        console.error('Falta resumen en la respuesta:', analysisResult);
        throw new Error('No se pudo analizar el contenido del archivo. Asegúrate de que contenga los 4 libros requeridos: Alumnos, Grupos, Tutores y Relación Inscritos.');
      }

      setAnalysis(analysisResult);
      setPeriodos(periodosResult);

      // Pre-seleccionar el periodo activo si existe
      const periodoActivo = periodosResult.find((p) => p.activo);
      if (periodoActivo) {
        setSelectedPeriodoId(periodoActivo.id);
      }

      setStep('configure');
    } catch (error) {
      console.error('Error completo al analizar:', error);
      const message = extractErrorMessage(error);
      setAnalyzeError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -------------------------------------------
  // Paso 2: Configurar y ejecutar
  // -------------------------------------------

  const handleExecute = async () => {
    if (!analysis || !selectedPeriodoId) return;

    setIsExecuting(true);
    setStep('result');

    // Inicializar pasos de progreso
    const steps = [
      { label: 'Desactivando periodo anterior...', status: 'pending' as const },
      { label: 'Importando tutores', status: 'pending' as const },
      { label: 'Importando grupos', status: 'pending' as const },
      { label: 'Importando alumnos...', status: 'pending' as const },
      { label: 'Creando inscripciones', status: 'pending' as const },
    ];
    setProgressSteps(steps);

    // Simular progreso visual mientras el backend procesa
    const simulateProgress = async () => {
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setProgressSteps((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx < i ? 'done' : idx === i ? 'loading' : 'pending',
            percent: idx < i ? 100 : idx === i ? 50 : undefined,
          }))
        );
      }
    };

    try {
      const progressPromise = simulateProgress();

      const executeResult = await adminService.executeExcelImport({
        archivo_id: analysis.archivo_id,
        periodo_id: selectedPeriodoId,
        crear_periodo: false,
        desactivar_anteriores: desactivarAnteriores,
      });

      // Esperar a que termine la animación mínima
      await progressPromise;

      // Marcar todos como completados
      setProgressSteps((prev) =>
        prev.map((s) => ({ ...s, status: 'done' as const, percent: 100 }))
      );

      setResult(executeResult);
      showToast({
        message: executeResult.message || 'Importación completada',
        type: executeResult.success ? 'success' : 'error',
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      setExecuteError(message);
      showToast({ message, type: 'error' });

      // Marcar el último paso como error visual
      setProgressSteps((prev) =>
        prev.map((s) =>
          s.status === 'loading'
            ? { ...s, status: 'done' as const, percent: 0 }
            : s
        )
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = () => {
    setStep('upload');
    setAnalysis(null);
    setPeriodos([]);
    setSelectedPeriodoId(null);
  };

  // -------------------------------------------
  // Paso 3: Cerrar / volver
  // -------------------------------------------

  const handleClose = () => {
    navigate('/admin/import');
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setAnalysis(null);
    setResult(null);
    setExecuteError(null);
    setAnalyzeError(null);
    setProgressSteps([]);
    setShowFullLog(false);
  };

  // -------------------------------------------
  // Render
  // -------------------------------------------

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
            Importar desde Excel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Importación completa de datos desde archivo .xlsx
          </p>
        </div>
      </div>

      {/* Stepper */}
      <StepIndicator currentStep={step} />

      {/* Contenido según paso */}
      {step === 'upload' && (
        <StepUpload
          selectedFile={selectedFile}
          isDragging={isDragging}
          isAnalyzing={isAnalyzing}
          analyzeError={analyzeError}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onClickUpload={() => fileInputRef.current?.click()}
          onClearFile={() => { setSelectedFile(null); setAnalyzeError(null); }}
          onAnalyze={handleAnalyze}
        />
      )}

      {step === 'configure' && analysis && (
        <StepConfigure
          analysis={analysis}
          periodos={periodos}
          selectedPeriodoId={selectedPeriodoId}
          desactivarAnteriores={desactivarAnteriores}
          generarReporte={generarReporte}
          isExecuting={isExecuting}
          onSelectPeriodo={setSelectedPeriodoId}
          onToggleDesactivar={setDesactivarAnteriores}
          onToggleReporte={setGenerarReporte}
          onExecute={handleExecute}
          onCancel={handleCancel}
        />
      )}

      {step === 'result' && (
        <StepResult
          progressSteps={progressSteps}
          result={result}
          executeError={executeError}
          isExecuting={isExecuting}
          showFullLog={showFullLog}
          onToggleLog={() => setShowFullLog(!showFullLog)}
          onClose={handleClose}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// ===========================================================
// Componente: Indicador de pasos
// ===========================================================

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'upload', label: 'Subir archivo', number: 1 },
    { key: 'configure', label: 'Seleccionar periodo', number: 2 },
    { key: 'result', label: 'Progreso y resultados', number: 3 },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors ${
                i < currentIndex
                  ? 'bg-[#0B5A4A] text-white'
                  : i === currentIndex
                    ? 'bg-[#0B5A4A] text-white ring-2 ring-[#0B5A4A]/30 ring-offset-2'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < currentIndex ? (
                <CheckCircle2 size={16} />
              ) : (
                s.number
              )}
            </div>
            <span
              className={`hidden sm:inline text-xs sm:text-sm font-medium ${
                i <= currentIndex ? 'text-[#313131]' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 ${
                i < currentIndex ? 'bg-[#0B5A4A]' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// Paso 1: Subir archivo
// ===========================================================

interface StepUploadProps {
  selectedFile: File | null;
  isDragging: boolean;
  isAnalyzing: boolean;
  analyzeError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClickUpload: () => void;
  onClearFile: () => void;
  onAnalyze: () => void;
}

function StepUpload({
  selectedFile,
  isDragging,
  isAnalyzing,
  analyzeError,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onClickUpload,
  onClearFile,
  onAnalyze,
}: StepUploadProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-[#0B5A4A]" />
          <h2 className="text-base sm:text-lg font-semibold text-[#313131]">
            Importar Datos desde Excel
          </h2>
        </div>

        {/* Zona de drag & drop */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClickUpload}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#0B5A4A] bg-[#0B5A4A]/5'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
          }`}
        >
          <Upload
            size={40}
            className={`mb-3 ${isDragging ? 'text-[#0B5A4A]' : 'text-gray-400'}`}
          />
          <p className="text-sm text-gray-600 text-center">
            Arrastra el archivo Excel o haz click para seleccionar
          </p>
          <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={onFileChange}
          className="hidden"
        />

        {/* Archivo seleccionado */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet size={18} className="text-emerald-600 shrink-0" />
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
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
              title="Quitar archivo"
            >
              <X size={16} className="text-emerald-600" />
            </button>
          </div>
        )}

        {/* Error del análisis */}
        {analyzeError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Error al analizar el archivo
              </p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {analyzeError}
              </p>
            </div>
          </div>
        )}

        {/* Botón analizar */}
        <button
          onClick={onAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className="w-full bg-[#0B5A4A] text-white py-2.5 rounded-lg text-sm font-medium
            hover:bg-[#0B5A4A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analizando archivo...
            </>
          ) : (
            'Analizar Archivo'
          )}
        </button>
      </div>
    </div>
  );
}

// ===========================================================
// Paso 2: Configurar periodo y opciones
// ===========================================================

interface StepConfigureProps {
  analysis: ExcelAnalysisResponse;
  periodos: Period[];
  selectedPeriodoId: number | null;
  desactivarAnteriores: boolean;
  generarReporte: boolean;
  isExecuting: boolean;
  onSelectPeriodo: (id: number) => void;
  onToggleDesactivar: (v: boolean) => void;
  onToggleReporte: (v: boolean) => void;
  onExecute: () => void;
  onCancel: () => void;
}

function StepConfigure({
  analysis,
  periodos,
  selectedPeriodoId,
  desactivarAnteriores,
  generarReporte,
  onSelectPeriodo,
  onToggleDesactivar,
  onToggleReporte,
  onExecute,
  onCancel,
}: StepConfigureProps) {
  // Validación defensiva: asegurarse que resumen existe
  const resumen = analysis.resumen || {
    total_alumnos: 0,
    total_grupos: 0,
    total_tutores: 0,
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Resumen del análisis */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Archivo válido - {resumen.total_alumnos.toLocaleString()}{' '}
              alumnos detectados
            </p>
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Vista previa:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              {resumen.total_alumnos.toLocaleString()} alumnos
            </li>
            <li>
              {resumen.total_grupos.toLocaleString()} grupos
            </li>
            <li>
              {resumen.total_tutores.toLocaleString()} tutores
            </li>
          </ul>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                Advertencias
              </span>
            </div>
            <ul className="text-xs text-amber-700 space-y-0.5 ml-6">
              {analysis.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Selección de periodo */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Selecciona el periodo
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {periodos.map((periodo) => (
              <label
                key={periodo.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPeriodoId === periodo.id
                    ? 'border-[#0B5A4A] bg-[#0B5A4A]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="periodo"
                  checked={selectedPeriodoId === periodo.id}
                  onChange={() => onSelectPeriodo(periodo.id)}
                  className="mt-1 accent-[#0B5A4A]"
                />
                <div>
                  <p className="text-sm font-medium text-[#313131]">
                    {periodo.codigo} - {periodo.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {periodo.activo ? (
                      <span className="text-emerald-600 font-medium">
                        (Activo)
                      </span>
                    ) : (
                      <span className="text-gray-400">(Inactivo)</span>
                    )}
                    {periodo.alumnos_count !== undefined &&
                      periodo.alumnos_count > 0 && (
                        <>
                          {' - '}
                          <span className="text-amber-600">
                            Tiene {periodo.alumnos_count.toLocaleString()} alumnos
                            inscritos
                          </span>
                        </>
                      )}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Opciones */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Opciones
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={desactivarAnteriores}
                onChange={(e) => onToggleDesactivar(e.target.checked)}
                className="accent-[#0B5A4A] rounded"
              />
              <span className="text-sm text-gray-700">
                Desactivar periodos anteriores
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generarReporte}
                onChange={(e) => onToggleReporte(e.target.checked)}
                className="accent-[#0B5A4A] rounded"
              />
              <span className="text-sm text-gray-700">
                Generar reporte de bajas
              </span>
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onExecute}
            disabled={!selectedPeriodoId}
            className="bg-[#0B5A4A] text-white px-5 py-2.5 rounded-lg text-sm font-medium
              hover:bg-[#0B5A4A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importar Datos
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Paso 3: Progreso y resultados
// ===========================================================

interface StepResultProps {
  progressSteps: { label: string; status: 'pending' | 'loading' | 'done'; percent?: number }[];
  result: ExcelExecuteResponse | null;
  executeError: string | null;
  isExecuting: boolean;
  showFullLog: boolean;
  onToggleLog: () => void;
  onClose: () => void;
  onReset: () => void;
}

function StepResult({
  progressSteps,
  result,
  executeError,
  isExecuting,
  showFullLog,
  onToggleLog,
  onClose,
  onReset,
}: StepResultProps) {
  // Calcular progreso general
  const completedSteps = progressSteps.filter((s) => s.status === 'done').length;
  const totalSteps = progressSteps.length;
  const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Header del resultado */}
        <div
          className={`flex items-start gap-3 rounded-lg p-4 ${
            result?.success
              ? 'bg-emerald-50 border border-emerald-200'
              : isExecuting
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-red-50 border border-red-200'
          }`}
        >
          {isExecuting ? (
            <Loader2 size={20} className="text-blue-600 animate-spin shrink-0 mt-0.5" />
          ) : result?.success ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                result?.success
                  ? 'text-emerald-800'
                  : isExecuting
                    ? 'text-blue-800'
                    : 'text-red-800'
              }`}
            >
              {isExecuting
                ? 'Importando datos...'
                : result?.success
                  ? 'Importacion Completada'
                  : 'Error en la importación'}
            </p>
            {/* Mostrar detalle del error */}
            {!isExecuting && !result?.success && (executeError || result?.message) && (
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {executeError || result?.message}
              </p>
            )}
          </div>
        </div>

        {/* Pasos de progreso */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Importando datos...
          </p>
          {progressSteps.map((ps, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="shrink-0">
                {ps.status === 'done' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : ps.status === 'loading' ? (
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span
                className={`text-sm flex-1 ${
                  ps.status === 'done'
                    ? 'text-gray-700'
                    : ps.status === 'loading'
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-400'
                }`}
              >
                {ps.label}
              </span>
              {ps.percent !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    ps.percent === 100 ? 'text-emerald-600' : 'text-gray-500'
                  }`}
                >
                  [{ps.percent}%]
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Barra de progreso general */}
        <div className="space-y-1">
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0B5A4A] rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{overallPercent}%</p>
        </div>

        {/* Resumen de resultados */}
        {result?.success && result.detalle && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Cambios en alumnado
            </h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>{result.detalle.tutores_nuevos} tutores nuevos</li>
              <li>{result.detalle.grupos_creados} grupos creados</li>
              <li>{result.detalle.alumnos_nuevos} alumnos nuevos</li>
              <li>
                {result.detalle.inscripciones_creadas.toLocaleString()} inscripciones
                creadas
              </li>
              <li>{result.detalle.bajas} bajas de alumnos</li>
            </ul>
          </div>
        )}

        {/* Log completo */}
        {result?.log_completo && result.log_completo.length > 0 && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#0B5A4A] hover:underline">
              <input
                type="checkbox"
                checked={showFullLog}
                onChange={onToggleLog}
                className="accent-[#0B5A4A]"
              />
              Descargar Log Completo
            </label>
            {showFullLog && (
              <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {result.log_completo.map((line, i) => (
                  <p key={i} className="text-xs text-gray-600 font-mono">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones finales */}
        {!isExecuting && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onReset}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Nueva importación
            </button>
            <button
              onClick={onClose}
              className="bg-[#0B5A4A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0B5A4A]/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
