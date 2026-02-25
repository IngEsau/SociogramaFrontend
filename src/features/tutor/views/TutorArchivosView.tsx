/**
 * Vista de Archivos - Tutor
 *
 * Muestra la lista de archivos de sociogramas generados (JPG, PDF, CSV)
 * disponibles para visualizacion y descarga. Los archivos mostrados corresponden
 * a los sociogramas de los ultimos 7 dias.
 *
 * NOTA: Los archivos de mas de 7 dias se archivan automaticamente en el backend
 * y tienen un periodo de retencion de 3 dias adicionales antes de eliminacion.
 *
 * TODO: Endpoint pendiente - GET /academic/archivos/ o similar
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Download, ChevronDown } from 'lucide-react';
import { useTopbarStore } from '../../../store';
import sociogramIcon from '../../../core/assets/sociogram-icon.svg';
import pdfIcon from '../../../core/assets/pdf-icon.svg';
import excelIcon from '../../../core/assets/excel-icon.svg';

/** Tipo de archivo de sociograma */
type FileType = 'JPG' | 'PDF' | 'CSV';

/** Tipo de ordenamiento */
type SortField = 'nombre' | 'fecha' | 'tipo';
type SortOrder = 'asc' | 'desc';

/** Interfaz de archivo de sociograma */
interface SociogramaFile {
  id: number;
  nombre: string;
  fecha_realizado: string;
  tipo: FileType;
  url?: string;
  grupo: string;
  carrera: string;
  turno: string;
  periodo: string;
  tamano?: string;
  dimensiones?: string;
  fecha_creacion?: string;
}

export function TutorArchivosView() {
  const [archivos, setArchivos] = useState<SociogramaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<SociogramaFile | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SociogramaFile | null>(null);
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  // Cargar archivos
  // NOTA: El endpoint aun no esta disponible. Se usan datos mock mientras tanto.
  const fetchArchivos = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Descomentar cuando el endpoint este disponible
      // const data = await tutorService.getSociogramaFiles();
      // setArchivos(data);

      await new Promise((r) => setTimeout(r, 400));
      setArchivos(generateMockFiles());
      if (generateMockFiles().length > 0) {
        setSelectedFile(generateMockFiles()[0]);
      }
    } catch {
      setArchivos(generateMockFiles());
      if (generateMockFiles().length > 0) {
        setSelectedFile(generateMockFiles()[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivos();
  }, [fetchArchivos]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedArchivos = archivos
    .filter((archivo) =>
      archivo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let compareValue = 0;
      if (sortField === 'nombre') {
        compareValue = a.nombre.localeCompare(b.nombre);
      } else if (sortField === 'fecha') {
        compareValue = new Date(a.fecha_realizado).getTime() - new Date(b.fecha_realizado).getTime();
      } else if (sortField === 'tipo') {
        compareValue = a.tipo.localeCompare(b.tipo);
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleFileSelect = (file: SociogramaFile) => {
    if (selectedFile?.id === file.id) {
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleDeleteRequest = (file: SociogramaFile) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      // TODO: Implementar logica de borrado cuando el endpoint este disponible
      if (selectedFile?.id === fileToDelete.id) {
        setSelectedFile(null);
      }
      setArchivos(archivos.filter(a => a.id !== fileToDelete.id));
    }
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  const handleDownload = (file: SociogramaFile) => {
    // TODO: Implementar descarga real cuando el endpoint este disponible
    console.log('Descargar archivo:', file.nombre);
  };

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-black/40 font-bold text-[18px] tracking-[-0.1px] placeholder:text-black/40"
            />
            <Search size={24} className="text-gray-600" />
          </div>
        </div>
      ),
    });

    return () => resetTopbar();
  }, [setTopbarConfig, resetTopbar, searchTerm, isLoading, fetchArchivos]);

  return (
    <>
      {/* Modal de confirmacion de borrado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              ¿Estas seguro?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              ¿Deseas borrar el archivo <span className="font-bold text-black">"{fileToDelete?.nombre}"</span>?
              <br />
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
                Borrar archivo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 h-full">
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Lista de archivos */}
          <div className="flex-1 flex flex-col border border-[#0F7E3C]/50 rounded-lg shadow-md p-4 gap-4">
            <div className="flex items-center h-6 text-[20px] font-bold text-black tracking-[-0.1px]">
              <div className="flex-1 flex items-center gap-1 relative pl-2">
                <button
                  onClick={() => handleSort('nombre')}
                  className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1"
                >
                  <span>Nombre</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      sortField === 'nombre' && sortOrder === 'desc' ? 'rotate-180' : ''
                    } ${sortField === 'nombre' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
                  />
                </button>
              </div>
              <div className="flex-1 max-w-44 flex items-center justify-center gap-1 relative">
                <button
                  onClick={() => handleSort('fecha')}
                  className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1"
                >
                  <span>Fecha realizado</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      sortField === 'fecha' && sortOrder === 'desc' ? 'rotate-180' : ''
                    } ${sortField === 'fecha' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
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
                    className={`transition-transform ${
                      sortField === 'tipo' && sortOrder === 'desc' ? 'rotate-180' : ''
                    } ${sortField === 'tipo' ? 'text-[#0F7E3C]' : 'text-black/40'}`}
                  />
                </button>
              </div>
              <div className="flex-1 max-w-30 text-center">
                <span>Acciones</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={32} className="animate-spin text-[#0F7E3C]" />
                </div>
              ) : filteredAndSortedArchivos.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No hay archivos disponibles</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAndSortedArchivos.map((archivo) => (
                    <FileRow
                      key={archivo.id}
                      archivo={archivo}
                      isSelected={selectedFile?.id === archivo.id}
                      onSelect={handleFileSelect}
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
            {selectedFile ? (
              <>
                <div className="bg-gray-200 border-b border-[#0F7E3C]/50 flex items-center justify-center p-4">
                  <div className="w-87 h-87 flex items-center justify-center">
                    {selectedFile.tipo === 'JPG' ? (
                      <SociogramPreview />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <span>Vista previa no disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-white p-4 flex flex-col gap-4">
                  <div className="flex items-start gap-2">
                    <FileIcon tipo={selectedFile.tipo} />
                    <p className="flex-1 font-bold text-[16px] text-black tracking-[-0.08px] wrap-break-word">
                      {selectedFile.nombre}
                    </p>
                  </div>

                  <div className="border-t pt-2">
                    <p className="font-bold text-[14px] text-black tracking-[-0.07px] mb-2">
                      Detalles
                    </p>
                    <div className="flex flex-col gap-2 text-[14px] text-black tracking-[-0.07px]">
                      <DetailRow label="Tipo:" value={`Archivo ${selectedFile.tipo}`} />
                      <DetailRow label="Tamano:" value={selectedFile.tamano || '1.2 MB'} />
                      <DetailRow label="Dimensiones:" value={selectedFile.dimensiones || '800 x 920'} />
                      <DetailRow label="Grupo:" value={selectedFile.grupo} />
                      <DetailRow label="Turno:" value={selectedFile.turno} />
                      <DetailRow label="Periodo:" value={selectedFile.periodo} />
                      <DetailRow label="Fecha de Creacion" value={selectedFile.fecha_creacion || formatDateTime(selectedFile.fecha_realizado)} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center">
                  <p className="text-[16px] font-bold text-black mb-2">
                    Selecciona un archivo
                  </p>
                  <p className="text-[14px] text-gray-600">
                    Haz click en cualquier archivo para ver sus detalles y vista previa
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface FileRowProps {
  archivo: SociogramaFile;
  isSelected: boolean;
  onSelect: (file: SociogramaFile) => void;
  onDelete: (file: SociogramaFile) => void;
  onDownload: (file: SociogramaFile) => void;
}

function FileRow({ archivo, isSelected, onSelect, onDelete, onDownload }: FileRowProps) {
  return (
    <div
      onClick={() => onSelect(archivo)}
      className={`flex items-center border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#245C52]/24 border-[#0F7E3C]/50'
          : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex-1 flex items-center gap-2 px-2 py-1 min-w-0">
        <FileIcon tipo={archivo.tipo} />
        <p
          className="flex-1 text-[14px] text-black tracking-[-0.07px] overflow-hidden text-ellipsis whitespace-nowrap"
          title={archivo.nombre}
        >
          {archivo.nombre}
        </p>
      </div>
      <div className="flex-1 max-w-44 text-center">
        <p className="text-[14px] text-black tracking-[-0.07px]">
          {formatDate(archivo.fecha_realizado)}
        </p>
      </div>
      <div className="flex-1 max-w-24 text-center">
        <p className="text-[14px] text-black tracking-[-0.07px]">
          .{archivo.tipo}
        </p>
      </div>
      <div className="flex-1 max-w-30 flex items-center justify-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(archivo); }}
          className="bg-[#7A1501] border border-[#7A1501]/50 rounded-md shadow-md p-1.5 hover:bg-[#7A1501]/90 transition-colors"
          title="Borrar"
        >
          <svg className="w-[19.2px] h-[19.2px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(archivo); }}
          className="bg-[#0F7E3C] border border-[#0F7E3C]/50 rounded-md shadow-md p-1.5 hover:bg-[#0F7E3C]/90 transition-colors"
          title="Descargar"
        >
          <Download size={19.2} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function FileIcon({ tipo }: { tipo: FileType }) {
  if (tipo === 'JPG') {
    return (
      <div className="w-4.5 h-4.5 shrink-0">
        <img src={sociogramIcon} alt="Sociograma" className="w-full h-full" />
      </div>
    );
  }
  if (tipo === 'PDF') {
    return (
      <div className="w-4.5 h-4.5 shrink-0">
        <img src={pdfIcon} alt="PDF" className="w-full h-full" />
      </div>
    );
  }
  return (
    <div className="w-4.5 h-4.5 shrink-0">
      <img src={excelIcon} alt="Excel" className="w-full h-full" />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="shrink-0">{label}</p>
      <p className="shrink-0 text-right">{value}</p>
    </div>
  );
}

function SociogramPreview() {
  return (
    <svg viewBox="0 0 348 348" className="w-full h-full">
      <g>
        <circle cx="174" cy="174" r="40" fill="#245C52" />
        <circle cx="240" cy="120" r="35" fill="#245C52" />
        <circle cx="280" cy="200" r="32" fill="#245C52" />
        <circle cx="200" cy="260" r="30" fill="#245C52" />
        <circle cx="100" cy="240" r="28" fill="#245C52" />
        <circle cx="80" cy="140" r="26" fill="#245C52" />
        <circle cx="220" cy="80" r="24" fill="#0F7E3C" />
        <circle cx="300" cy="140" r="22" fill="#0F7E3C" />
        <circle cx="290" cy="260" r="20" fill="#0F7E3C" />
        <circle cx="140" cy="280" r="18" fill="#0F7E3C" />
        <circle cx="60" cy="200" r="18" fill="#0F7E3C" />
        <circle cx="120" cy="100" r="16" fill="#7A1501" />
        <circle cx="280" cy="100" r="14" fill="#7A1501" />
        <circle cx="320" cy="180" r="12" fill="#7A1501" />
        <circle cx="260" cy="300" r="12" fill="#7A1501" />
        <circle cx="180" cy="60" r="10" fill="#666" />
        <circle cx="320" cy="240" r="8" fill="#666" />
        <circle cx="100" cy="320" r="8" fill="#666" />
        <circle cx="40" cy="160" r="8" fill="#666" />
        <line x1="174" y1="174" x2="240" y2="120" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="174" y1="174" x2="280" y2="200" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="174" y1="174" x2="200" y2="260" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="174" y1="174" x2="100" y2="240" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="174" y1="174" x2="80" y2="140" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="240" y1="120" x2="220" y2="80" stroke="#666" strokeWidth="1" opacity="0.3"/>
        <line x1="280" y1="200" x2="300" y2="140" stroke="#666" strokeWidth="1" opacity="0.3"/>
      </g>
    </svg>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} hrs`;
  } catch {
    return dateString;
  }
}

function generateMockFiles(): SociogramaFile[] {
  const files: SociogramaFile[] = [];

  const grupos = [
    { nombre: '9A ING. Desarrollo y Gestion de Software', grupo: '9A', carrera: 'ING. Desarrollo y Gestion de Software', turno: 'Vespertino', periodo: '| Mayo - Agosto | 2025', fecha: '2025-09-20T17:02:00' },
    { nombre: '6D TSU. Infraestructura de Redes Digitales', grupo: '6D', carrera: 'TSU. Infraestructura de Redes Digitales', turno: 'Matutino', periodo: '| Enero - Abril | 2025', fecha: '2025-03-07T10:15:00' },
    { nombre: '10B ING. Desarrollo y Gestion de Software', grupo: '10B', carrera: 'ING. Desarrollo y Gestion de Software', turno: 'Vespertino', periodo: '| Septiembre - Diciembre | 2024', fecha: '2024-11-12T16:30:00' },
    { nombre: '6E TSU. Desarrollo de Software Multiplataforma', grupo: '6E', carrera: 'TSU. Desarrollo de Software Multiplataforma', turno: 'Matutino', periodo: '| Enero - Abril | 2024', fecha: '2024-06-01T09:45:00' },
  ];

  let id = 1;
  grupos.forEach((grupo) => {
    ['JPG', 'PDF', 'CSV'].forEach((tipo) => {
      files.push({
        id: id++,
        nombre: `Sociograma ${grupo.nombre}`,
        fecha_realizado: grupo.fecha,
        tipo: tipo as FileType,
        grupo: grupo.grupo,
        carrera: grupo.carrera,
        turno: grupo.turno,
        periodo: grupo.periodo,
        fecha_creacion: formatDateTime(grupo.fecha),
      });
    });
  });

  return files;
}

export default TutorArchivosView;
