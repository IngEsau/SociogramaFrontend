/**
 * Vista de Archivos .log - Admin
 *
 * Muestra la lista de archivos de logs del sistema (.log)
 * disponibles para visualizacion y descarga.
 *
 * TODO: Endpoint pendiente - GET /admin/archivos-log/ o similar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Search, Download, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTopbarStore } from '../../../store';

/** Interfaz de archivo de log */
interface LogFile {
  id: number;
  nombre: string;
  fecha_creacion: string;
  tamano: string;
  lineas: number;
  contenido: string;
}

type SortField = 'nombre' | 'fecha' | 'tamano';
type SortOrder = 'asc' | 'desc';

export function AdminArchivosView() {
  const [archivos, setArchivos] = useState<LogFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<LogFile | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  const fetchArchivos = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Descomentar cuando el endpoint este disponible
      // const data = await adminService.getLogFiles();
      // setArchivos(data);

      await new Promise((r) => setTimeout(r, 400));
      const mock = generateMockLogFiles();
      setArchivos(mock);
      if (mock.length > 0) {
        setSelectedFile(mock[0]);
      }
    } catch {
      const mock = generateMockLogFiles();
      setArchivos(mock);
      if (mock.length > 0) {
        setSelectedFile(mock[0]);
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

  const filteredAndSorted = archivos
    .filter((a) => a.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
      else if (sortField === 'fecha') cmp = new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime();
      else if (sortField === 'tamano') cmp = a.lineas - b.lineas;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const handleFileSelect = (file: LogFile) => {
    setSelectedFile(selectedFile?.id === file.id ? null : file);
  };

  const handleDeleteRequest = (file: LogFile) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      if (selectedFile?.id === fileToDelete.id) setSelectedFile(null);
      setArchivos(archivos.filter((a) => a.id !== fileToDelete.id));
    }
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  const handleDownload = (file: LogFile) => {
    const blob = new Blob([file.contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              placeholder="Buscar archivo .log"
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
                onClick={() => { setShowDeleteConfirm(false); setFileToDelete(null); }}
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
          {/* Lista de archivos .log */}
          <div className="flex-1 flex flex-col border border-[#0F7E3C]/50 rounded-lg shadow-md p-4 gap-4">
            <div className="flex items-center h-6 text-[20px] font-bold text-black tracking-[-0.1px]">
              <div className="flex-1 flex items-center gap-1 pl-2">
                <button onClick={() => handleSort('nombre')} className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1">
                  <span>Nombre</span>
                  <ChevronDown size={20} className={`transition-transform ${sortField === 'nombre' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'nombre' ? 'text-[#0F7E3C]' : 'text-black/40'}`} />
                </button>
              </div>
              <div className="flex-1 max-w-44 flex items-center justify-center gap-1">
                <button onClick={() => handleSort('fecha')} className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1">
                  <span>Fecha</span>
                  <ChevronDown size={20} className={`transition-transform ${sortField === 'fecha' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'fecha' ? 'text-[#0F7E3C]' : 'text-black/40'}`} />
                </button>
              </div>
              <div className="flex-1 max-w-24 flex items-center justify-center gap-1">
                <button onClick={() => handleSort('tamano')} className="hover:text-[#0F7E3C] transition-colors flex items-center gap-1">
                  <span>Tamano</span>
                  <ChevronDown size={20} className={`transition-transform ${sortField === 'tamano' && sortOrder === 'desc' ? 'rotate-180' : ''} ${sortField === 'tamano' ? 'text-[#0F7E3C]' : 'text-black/40'}`} />
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
              ) : filteredAndSorted.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No hay archivos .log disponibles</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAndSorted.map((archivo) => (
                    <div
                      key={archivo.id}
                      onClick={() => handleFileSelect(archivo)}
                      className={`flex items-center border cursor-pointer transition-colors ${
                        selectedFile?.id === archivo.id
                          ? 'bg-[#245C52]/24 border-[#0F7E3C]/50'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 flex items-center gap-2 px-2 py-1 min-w-0">
                        <LogFileIcon />
                        <p className="flex-1 text-[14px] text-black tracking-[-0.07px] overflow-hidden text-ellipsis whitespace-nowrap" title={archivo.nombre}>
                          {archivo.nombre}
                        </p>
                      </div>
                      <div className="flex-1 max-w-44 text-center">
                        <p className="text-[14px] text-black tracking-[-0.07px]">{formatDate(archivo.fecha_creacion)}</p>
                      </div>
                      <div className="flex-1 max-w-24 text-center">
                        <p className="text-[14px] text-black tracking-[-0.07px]">{archivo.tamano}</p>
                      </div>
                      <div className="flex-1 max-w-30 flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRequest(archivo); }}
                          className="bg-[#7A1501] border border-[#7A1501]/50 rounded-md shadow-md p-1.5 hover:bg-[#7A1501]/90 transition-colors"
                          title="Borrar"
                        >
                          <svg className="w-[19.2px] h-[19.2px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(archivo); }}
                          className="bg-[#0F7E3C] border border-[#0F7E3C]/50 rounded-md shadow-md p-1.5 hover:bg-[#0F7E3C]/90 transition-colors"
                          title="Descargar"
                        >
                          <Download size={19.2} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel de vista previa del contenido del .log */}
          <div className={`w-94.5 flex flex-col border rounded-lg shadow-md overflow-hidden transition-colors duration-300 ${
            darkMode ? 'bg-[#0F3B2E] border-[#0F7E3C]/60' : 'border-[#0F7E3C]/50'
          }`}>
            {selectedFile ? (
              <>
                {/* Header con nombre y toggle */}
                <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-300 ${
                  darkMode ? 'bg-[#0B2F24] border-[#0F7E3C]/40' : 'bg-gray-100 border-[#0F7E3C]/30'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <LogFileIcon />
                    <p className={`text-[14px] font-bold truncate transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-black'
                    }`}>
                      {selectedFile.nombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs transition-colors duration-300 ${darkMode ? 'text-white/50' : 'text-gray-400'}`}>
                      {selectedFile.lineas} lineas
                    </span>
                    <button
                      onClick={() => setDarkMode((prev) => !prev)}
                      className={`p-1.5 rounded-full transition-colors duration-300 ${
                        darkMode ? 'text-[#0F7E3C] hover:bg-white/10' : 'text-[#245C52] hover:bg-[#245C52]/10'
                      }`}
                      title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                    >
                      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                  </div>
                </div>

                {/* Detalles del archivo */}
                <div className={`px-4 py-2 border-b transition-colors duration-300 ${
                  darkMode ? 'bg-[#0B2F24]/50 border-[#0F7E3C]/30' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`transition-colors duration-300 ${darkMode ? 'text-white/60' : 'text-gray-500'}`}>
                      Fecha: {formatDateTime(selectedFile.fecha_creacion)}
                    </span>
                    <span className={`transition-colors duration-300 ${darkMode ? 'text-white/60' : 'text-gray-500'}`}>
                      {selectedFile.tamano}
                    </span>
                  </div>
                </div>

                {/* Contenido del log */}
                <div
                  ref={previewRef}
                  className={`flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs leading-relaxed transition-colors duration-300 ${
                    darkMode ? 'bg-[#06322B] text-[#FEFEFF]/80' : 'bg-white text-black/70'
                  }`}
                >
                  {selectedFile.contenido.split('\n').map((line, idx) => (
                    <div key={idx} className="flex gap-3 hover:bg-white/5">
                      <span className={`select-none shrink-0 w-8 text-right transition-colors duration-300 ${
                        darkMode ? 'text-[#0F7E3C]/60' : 'text-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="break-all">
                        <LogLine line={line} darkMode={darkMode} />
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <LogFileIcon size={48} />
                <div className="text-center">
                  <p className="text-[16px] font-bold text-black mb-2">Selecciona un archivo</p>
                  <p className="text-[14px] text-gray-600">Haz click en cualquier archivo .log para ver su contenido</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** Icono para archivos .log */
function LogFileIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#245C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

/** Resaltado de keywords en cada linea del log */
function LogLine({ line, darkMode }: { line: string; darkMode: boolean }) {
  const keywords = ['ERROR', 'WARNING', 'INFO', 'inicio sesion', 'cerrado sesion', 'finalizado', 'comenzado', 'creado', 'eliminado'];
  for (const kw of keywords) {
    const idx = line.indexOf(kw);
    if (idx !== -1) {
      const color = kw === 'ERROR'
        ? (darkMode ? 'text-red-400' : 'text-red-600')
        : kw === 'WARNING'
        ? (darkMode ? 'text-amber-400' : 'text-amber-600')
        : kw === 'INFO'
        ? (darkMode ? 'text-[#0F7E3C]' : 'text-[#0F7E3C]')
        : (darkMode ? 'text-white font-bold' : 'text-black font-bold');
      return (
        <>
          <span>{line.slice(0, idx)}</span>
          <span className={color}>{kw}</span>
          <span>{line.slice(idx + kw.length)}</span>
        </>
      );
    }
  }
  return <span>{line}</span>;
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

function generateMockLogFiles(): LogFile[] {
  const names = [
    'Carlos Rodriguez Sanchez',
    'Juan Hernandez Lopez',
    'Isabel Jimenez Soto',
    'Elena Vargas Reyes',
    'Patricia Serrano Delgado',
    'Laura Mendoza Silva',
  ];

  const actions = [
    'inicio sesion a realizar el formulario.',
    'comenzado a realizar el formulario.',
    'finalizado el formulario.',
    'cerrado sesion del sistema.',
  ];

  const files: LogFile[] = [];

  const groups = [
    { grupo: '9A', carrera: 'ING-DSM', fecha: '2025-09-20' },
    { grupo: '6D', carrera: 'TSU-IRD', fecha: '2025-03-07' },
    { grupo: '10B', carrera: 'ING-DSM', fecha: '2024-11-12' },
  ];

  groups.forEach((g, gIdx) => {
    const baseTime = new Date(`${g.fecha}T09:00:00`);
    const lines: string[] = [];

    for (let round = 0; round < 8; round++) {
      for (let i = 0; i < names.length; i++) {
        const time = new Date(baseTime.getTime() + (round * 180 + i * 25) * 1000);
        const ts = time.toISOString().replace('T', ' ').slice(0, 19);
        const action = actions[(round + i) % actions.length];
        lines.push(`[${ts}] [INFO] ${names[i]} ha ${action}`);
      }
    }

    lines.splice(5, 0, `[${g.fecha} 09:02:15] [WARNING] Timeout en la conexion con el servidor de base de datos.`);
    lines.splice(20, 0, `[${g.fecha} 09:08:30] [ERROR] Error al guardar respuesta del formulario - usuario ID 1042.`);

    const contenido = lines.join('\n');
    const sizeKb = Math.round(contenido.length / 1024 * 10) / 10;

    files.push({
      id: gIdx + 1,
      nombre: `registro_${g.carrera}_${g.grupo}_${g.fecha}.log`,
      fecha_creacion: `${g.fecha}T17:00:00`,
      tamano: `${sizeKb} KB`,
      lineas: lines.length,
      contenido,
    });
  });

  return files;
}

export default AdminArchivosView;
