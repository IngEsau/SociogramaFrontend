/**
 * Vista de Archivos - Tutor
 *
 * Muestra la lista de cuestionarios historicos del tutor (todos los periodos),
 * con 3 filas por entrada: PNG, PDF y CSV.
 *
 * Endpoints consumidos:
 *   GET /api/academic/archivos/cuestionarios/
 *   GET /api/academic/archivos/cuestionarios/{id}/sociograma/?grupo_id={id}
 *   GET /api/academic/archivos/cuestionarios/{id}/exportar/csv/?grupo_id={id}
 *   GET /api/academic/archivos/cuestionarios/{id}/exportar/pdf/?grupo_id={id}
 *   GET /api/academic/archivos/cuestionarios/{id}/exportar/imagen/?grupo_id={id}
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Search, Download, ChevronDown, AlertCircle } from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { useTopbarStore } from '../../../store';
import { tutorService } from '../services';
import sociogramIcon from '../../../core/assets/sociogram-icon.svg';
import pdfIcon from '../../../core/assets/pdf-icon.svg';
import excelIcon from '../../../core/assets/excel-icon.svg';
import type { ArchivosCuestionarioItem, SociogramaDataResponse } from '../types';
import { SociogramGraph, mapGrupoEstadisticasToSociogramData } from '../../sociogram';
import type { SociogramData } from '../../sociogram';

/** Tipo de archivo de sociograma */
type FileType = 'PNG' | 'PDF' | 'CSV';

/** Tipo de ordenamiento */
type SortField = 'nombre' | 'fecha' | 'tipo';
type SortOrder = 'asc' | 'desc';

/** Fila de archivo que se muestra en la tabla */
interface FileRow {
  id: string;
  nombre: string;
  fecha: string;
  tipo: FileType;
  cuestionarioId: number;
  grupoId: number;
  grupoClave: string;
  periodoNombre: string;
  periodoCodigo: string;
  totalAlumnos: number;
  completados: number;
}

/** Construye las 3 filas (JPG, PDF, CSV) a partir de un item del listado */
function buildFileRows(item: ArchivosCuestionarioItem): FileRow[] {
  const base = {
    nombre: `${item.cuestionario_titulo} - ${item.grupo_clave}`,
    fecha: item.fecha_cuestionario,
    cuestionarioId: item.cuestionario_id,
    grupoId: item.grupo_id,
    grupoClave: item.grupo_clave,
    periodoNombre: item.periodo_nombre,
    periodoCodigo: item.periodo_codigo,
    totalAlumnos: item.total_alumnos,
    completados: item.completados,
  };
  return (
    (['PNG', 'PDF', 'CSV'] as FileType[]).map((tipo) => ({
      ...base,
      id: `${item.cuestionario_id}-${item.grupo_id}-${tipo}`,
      tipo,
    }))
  );
}

/** Descarga un Blob con el nombre indicado */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TutorArchivosView() {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<FileRow | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<FileRow | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Estado para el panel de detalles del PNG (sociograma)
  const [sociogramaData, setSociogramaData] = useState<SociogramaDataResponse | null>(null);
  const [sociogramaGraphData, setSociogramaGraphData] = useState<SociogramData | null>(null);
  const [isLoadingSociograma, setIsLoadingSociograma] = useState(false);

  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const searchRef = useRef(searchTerm);
  searchRef.current = searchTerm;

  const fetchArchivos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tutorService.getArchivosListado();
      const allRows = data.archivos.flatMap(buildFileRows);
      setRows(allRows);
      if (allRows.length > 0 && !selectedRow) {
        setSelectedRow(allRows[0]);
      }
    } catch {
      setError('No se pudo cargar la lista de archivos. Verifica tu conexion e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchArchivos();
  }, [fetchArchivos]);

  // Cargar datos del sociograma cuando se selecciona una fila PNG
  useEffect(() => {
    if (!selectedRow || selectedRow.tipo !== 'PNG') {
      setSociogramaData(null);
      setSociogramaGraphData(null);
      return;
    }
    let cancelled = false;
    setIsLoadingSociograma(true);
    setSociogramaData(null);
    setSociogramaGraphData(null);
    tutorService
      .getSociogramaData(selectedRow.cuestionarioId, selectedRow.grupoId)
      .then((data) => {
        if (!cancelled) {
          setSociogramaData(data);
          // Convertir al formato interno del grafo usando el mismo adaptador que el panel
          const graphData = mapGrupoEstadisticasToSociogramData({
            grupo_id: data.grupo_id,
            grupo_clave: data.grupo_clave,
            total_alumnos: data.total_alumnos,
            respuestas_completas: data.respuestas_completas,
            nodos: data.nodos,
            conexiones: data.conexiones,
          });
          setSociogramaGraphData(graphData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSociogramaData(null);
          setSociogramaGraphData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSociograma(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRow]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSorted = rows
    .filter((row) =>
      row.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
      else if (sortField === 'fecha') cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      else if (sortField === 'tipo') cmp = a.tipo.localeCompare(b.tipo);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const handleRowSelect = (row: FileRow) => {
    setSelectedRow((prev) => (prev?.id === row.id ? null : row));
    setDownloadError(null);
  };

  const handleDeleteRequest = (row: FileRow) => {
    setRowToDelete(row);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDelete) {
      // Elimina solo la fila correspondiente (sin endpoint de borrado en la API actual)
      if (selectedRow?.id === rowToDelete.id) setSelectedRow(null);
      setRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
    }
    setShowDeleteConfirm(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRowToDelete(null);
  };

  const handleDownload = useCallback(async (row: FileRow) => {
    setDownloadingId(row.id);
    setDownloadError(null);
    try {
      if (row.tipo === 'CSV') {
        const blob = await tutorService.exportarCSV(row.cuestionarioId, row.grupoId);
        triggerDownload(blob, `sociograma_${row.grupoClave}_${row.cuestionarioId}.csv`);
      } else if (row.tipo === 'PDF') {
        const blob = await tutorService.exportarPDF(row.cuestionarioId, row.grupoId);
        triggerDownload(blob, `sociograma_${row.grupoClave}_${row.cuestionarioId}.pdf`);
      } else {
        // PNG: imagen generada directamente por el backend
        const blob = await tutorService.exportarImagen(row.cuestionarioId, row.grupoId);
        triggerDownload(blob, `sociograma_${row.grupoClave}_${row.cuestionarioId}.png`);
      }
    } catch {
      setDownloadError(`No se pudo descargar el archivo ${row.tipo}. Intenta de nuevo.`);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      infoText: null,
      customContent: (
        <div className="flex items-center gap-2">
          <button
            onClick={fetchArchivos}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={24} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 border border-[#0F7E3C]/50 rounded-lg px-3 py-2 shadow-md min-w-75">
            <input
              type="text"
              placeholder="Buscar reporte"
              defaultValue={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-black/40 font-bold text-[18px] tracking-[-0.1px] placeholder:text-black/40"
            />
            <Search size={24} className="text-gray-600" />
          </div>
        </div>
      ),
    });

    return () => resetTopbar();
  // Solo se reconfigura cuando cambia isLoading o fetchArchivos; el search se maneja con defaultValue
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTopbarConfig, resetTopbar, isLoading, fetchArchivos]);

  return (
    <>
      {/* Modal confirmacion de borrado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Confirmar eliminacion
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              ¿Deseas eliminar el archivo{' '}
              <span className="font-bold text-black">
                "{rowToDelete?.nombre} .{rowToDelete?.tipo}"
              </span>
              ?<br />
              Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelDelete}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-[#7A1501] text-white rounded-lg hover:bg-[#7A1501]/90 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 h-full">
        {/* Aviso de error de descarga */}
        {downloadError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{downloadError}</span>
            <button
              onClick={() => setDownloadError(null)}
              className="ml-auto text-red-500 hover:text-red-700 font-bold"
            >
              x
            </button>
          </div>
        )}

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Lista de archivos */}
          <div className="flex-1 flex flex-col border border-[#0F7E3C]/50 rounded-lg shadow-md p-4 gap-4">
            {/* Cabecera de columnas */}
            <div className="flex items-center h-6 text-[20px] font-bold text-black tracking-[-0.1px]">
              <div className="flex-1 flex items-center gap-1 pl-2">
                <button
                  onClick={() => handleSort('nombre')}
                  className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1"
                >
                  <span>Nombre</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${sortField === 'nombre' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'nombre' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
                  />
                </button>
              </div>
              <div className="flex-1 max-w-44 flex items-center justify-center gap-1">
                <button
                  onClick={() => handleSort('fecha')}
                  className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1"
                >
                  <span>Fecha realizado</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${sortField === 'fecha' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'fecha' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
                  />
                </button>
              </div>
              <div className="flex-1 max-w-24 flex items-center justify-center gap-1">
                <button
                  onClick={() => handleSort('tipo')}
                  className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1"
                >
                  <span>Tipo</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${sortField === 'tipo' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'tipo' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
                  />
                </button>
              </div>
              <div className="flex-1 max-w-30 text-center">
                <span>Acciones</span>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="md" className="text-[#0F7E3C]" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <AlertCircle size={32} className="text-red-500" />
                  <p className="text-sm text-gray-600 max-w-xs">{error}</p>
                  <button
                    onClick={fetchArchivos}
                    className="text-sm text-[#0B5A4A] hover:underline font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No hay archivos disponibles</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAndSorted.map((row) => (
                    <FileRowItem
                      key={row.id}
                      row={row}
                      isSelected={selectedRow?.id === row.id}
                      isDownloading={downloadingId === row.id}
                      onSelect={handleRowSelect}
                      onDelete={handleDeleteRequest}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel de detalles */}
          <div className="w-94.5 flex flex-col border border-[#0F7E3C]/50 rounded-lg shadow-md overflow-hidden">
            {selectedRow ? (
              <>
                <div className="bg-gray-200 border-b border-[#0F7E3C]/50 overflow-hidden" style={{ height: '348px' }}>
                  {selectedRow.tipo === 'PNG' ? (
                    isLoadingSociograma ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Spinner size="md" className="text-[#0F7E3C]" />
                      </div>
                    ) : sociogramaGraphData ? (
                      /* [&>div>div:last-of-type]:hidden oculta botones de zoom
                         [&_svg]:min-h-0 anula el min-h-105 del SVG para que respete
                         la altura del contenedor (348px) y quede centrado */
                      <div className="w-full h-full [&>div>div:last-of-type]:hidden [&_svg]:min-h-0">
                        <SociogramGraph
                          data={sociogramaGraphData}
                          className="w-full h-full pointer-events-none"
                          showNodeNames={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SociogramaPreviewFallback />
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                      <FileIcon tipo={selectedRow.tipo} size="lg" />
                      <span className="text-sm">Vista previa no disponible</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white p-4 flex flex-col gap-4 overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <FileIcon tipo={selectedRow.tipo} />
                    <p className="flex-1 font-bold text-[16px] text-black tracking-[-0.08px] wrap-break-word">
                      {selectedRow.nombre}
                    </p>
                  </div>

                  <div className="border-t pt-2">
                    <p className="font-bold text-[14px] text-black tracking-[-0.07px] mb-2">
                      Detalles
                    </p>
                    <div className="flex flex-col gap-2 text-[14px] text-black tracking-[-0.07px]">
                      <DetailRow label="Tipo:" value={`Archivo .${selectedRow.tipo.toLowerCase()}`} />
                      <DetailRow label="Grupo:" value={selectedRow.grupoClave} />
                      <DetailRow label="Periodo:" value={selectedRow.periodoNombre} />
                      <DetailRow label="Codigo:" value={selectedRow.periodoCodigo} />
                      <DetailRow label="Total alumnos:" value={String(selectedRow.totalAlumnos)} />
                      <DetailRow label="Completaron:" value={`${selectedRow.completados} / ${selectedRow.totalAlumnos}`} />
                      <DetailRow label="Fecha cuestionario:" value={formatDate(selectedRow.fecha)} />
                    </div>
                  </div>

                  {selectedRow.tipo === 'PNG' && sociogramaData && (
                    <div className="border-t pt-2">
                      <p className="font-bold text-[14px] text-black tracking-[-0.07px] mb-2">
                        Estadisticas
                      </p>
                      <div className="flex flex-col gap-2 text-[14px] text-black tracking-[-0.07px]">
                        <DetailRow label="Nodos:" value={String(sociogramaData.nodos.length)} />
                        <DetailRow label="Conexiones:" value={String(sociogramaData.conexiones.length)} />
                        <DetailRow
                          label="Aceptados:"
                          value={String(sociogramaData.nodos.filter((n) => n.tipo === 'ACEPTADO').length)}
                        />
                        <DetailRow
                          label="Rechazados:"
                          value={String(sociogramaData.nodos.filter((n) => n.tipo === 'RECHAZADO').length)}
                        />
                        <DetailRow
                          label="Invisibles:"
                          value={String(sociogramaData.nodos.filter((n) => n.tipo === 'INVISIBLE').length)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <p className="text-[16px] font-bold text-black">Selecciona un archivo</p>
                <p className="text-[14px] text-gray-600">
                  Haz clic en cualquier fila para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

interface FileRowItemProps {
  row: FileRow;
  isSelected: boolean;
  isDownloading: boolean;
  onSelect: (row: FileRow) => void;
  onDelete: (row: FileRow) => void;
  onDownload: (row: FileRow) => void;
}

function FileRowItem({ row, isSelected, isDownloading, onSelect, onDelete, onDownload }: FileRowItemProps) {
  return (
    <div
      onClick={() => onSelect(row)}
      className={`flex items-center border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#245C52]/24 border-[#0F7E3C]/50'
          : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex-1 flex items-center gap-2 px-2 py-1 min-w-0">
        <FileIcon tipo={row.tipo} />
        <p
          className="flex-1 text-[14px] text-black tracking-[-0.07px] overflow-hidden text-ellipsis whitespace-nowrap"
          title={row.nombre}
        >
          {row.nombre}
        </p>
      </div>
      <div className="flex-1 max-w-44 text-center">
        <p className="text-[14px] text-black tracking-[-0.07px]">{formatDate(row.fecha)}</p>
      </div>
      <div className="flex-1 max-w-24 text-center">
        <p className="text-[14px] text-black tracking-[-0.07px]">.{row.tipo.toLowerCase()}</p>
      </div>
      <div className="flex-1 max-w-30 flex items-center justify-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
          className="bg-[#7A1501] border border-[#7A1501]/50 rounded-md shadow-md p-1.5 hover:bg-[#7A1501]/90 transition-colors"
          title="Eliminar"
        >
          <svg className="w-[19.2px] h-[19.2px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(row); }}
          disabled={isDownloading}
          className="bg-[#0F7E3C] border border-[#0F7E3C]/50 rounded-md shadow-md p-1.5 hover:bg-[#0F7E3C]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          title="Descargar"
        >
          {isDownloading ? (
            <RefreshCw size={19.2} className="text-white animate-spin" />
          ) : (
            <Download size={19.2} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

function FileIcon({ tipo, size = 'sm' }: { tipo: FileType; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12' : 'w-4.5 h-4.5 shrink-0';
  if (tipo === 'PNG') {
    return <div className={cls}><img src={sociogramIcon} alt="Sociograma" className="w-full h-full" /></div>;
  }
  if (tipo === 'PDF') {
    return <div className={cls}><img src={pdfIcon} alt="PDF" className="w-full h-full" /></div>;
  }
  return <div className={cls}><img src={excelIcon} alt="Excel/CSV" className="w-full h-full" /></div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="shrink-0 text-gray-500">{label}</p>
      <p className="shrink-0 text-right font-medium">{value}</p>
    </div>
  );
}

function SociogramaPreviewFallback() {
  return (
    <svg viewBox="0 0 348 348" className="w-full h-full opacity-30">
      <circle cx="174" cy="174" r="40" fill="#245C52" />
      <circle cx="240" cy="120" r="30" fill="#245C52" />
      <circle cx="280" cy="200" r="26" fill="#245C52" />
      <circle cx="100" cy="240" r="22" fill="#7A1501" />
      <circle cx="80" cy="140" r="20" fill="#9CA3AF" />
      <line x1="174" y1="174" x2="240" y2="120" stroke="#666" strokeWidth="1" opacity="0.4" />
      <line x1="174" y1="174" x2="280" y2="200" stroke="#666" strokeWidth="1" opacity="0.4" />
      <line x1="174" y1="174" x2="100" y2="240" stroke="#666" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  try {
    // El formato del API es "YYYY-MM-DD" - parsearlo sin timezone para evitar desfase
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day} / ${month} / ${year}`;
  } catch {
    return dateString;
  }
}

export default TutorArchivosView;
