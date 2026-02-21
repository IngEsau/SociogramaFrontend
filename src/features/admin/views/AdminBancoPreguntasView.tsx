/**
 * Vista: Banco de Preguntas
 */

import { useState, useEffect, useRef, useCallback, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Check, X, ArrowLeft, Save, Loader2, RefreshCw } from 'lucide-react';
import { useTopbarStore, useToastStore } from '../../../store';
import { GreenBall, RedBall } from '../../../components/ui';
import { adminService } from '../services';
import type { PreguntaBanco, PreguntaPolaridad } from '../types';

// Tipo de filtro activo
type Filtro = 'TODAS' | 'POSITIVA' | 'NEGATIVA';

/** Extrae mensaje legible de un error de Axios o generico */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosErr.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.detail === 'string') return data.detail;
      const firstField = Object.keys(data).find(
        (k) => Array.isArray(data[k]) && (data[k] as string[]).length > 0
      );
      if (firstField) {
        const msgs = data[firstField] as string[];
        return `${firstField}: ${msgs[0]}`;
      }
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function AdminBancoPreguntasView() {
  const navigate = useNavigate();
  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  // Estado principal del banco (datos del backend)
  const [preguntas, setPreguntas] = useState<PreguntaBanco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filtro de visualizacion
  const [filtro, setFiltro] = useState<Filtro>('TODAS');

  // Estado de edicion
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editPolaridad, setEditPolaridad] = useState<PreguntaPolaridad>('POSITIVA');

  // Dialogos de confirmacion
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [updateConfirmId, setUpdateConfirmId] = useState<number | null>(null);

  // Formulario de nueva pregunta
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPolaridad, setNewPolaridad] = useState<PreguntaPolaridad>('POSITIVA');
  const [addError, setAddError] = useState('');

  // Refs
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const addTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ==========================================
  // Fetch del banco
  // ==========================================

  const fetchBanco = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getBancoPreguntas();
      setPreguntas(res.preguntas || []);
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al cargar el banco de preguntas');
      showToast({ message: msg, type: 'error' });
      setPreguntas([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBanco();
  }, [fetchBanco]);

  // Topbar con botones de refrescar y nueva pregunta
  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: createElement('div', { className: 'flex items-center gap-2' },
        createElement('div', {
          className: 'flex items-center gap-2 border border-[#0F7E3C]/50 rounded-lg px-3 py-1.5 sm:py-2 shadow-sm bg-white'
        },
          createElement('span', { className: 'text-xs sm:text-sm font-bold text-black whitespace-nowrap' }, `${preguntas.length} preguntas en el banco`)
        ),
        createElement('button', {
          className: 'p-2 text-gray-500 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors',
          title: 'Recargar banco',
          onClick: () => fetchBanco()
        }, createElement(RefreshCw, { size: 16 })),
        createElement('button', {
          className: `flex items-center gap-2 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors ${preguntas.length >= 30 ? 'opacity-50 cursor-not-allowed' : ''}`,
          disabled: preguntas.length >= 30,
          onClick: () => { setShowAddForm(true); setEditingId(null); }
        }, createElement(Plus, { size: 16 }), 'Nueva pregunta')
      ),
    });
    return () => resetTopbar();
  }, [preguntas.length, setTopbarConfig, resetTopbar, fetchBanco]);

  // Autofocus
  useEffect(() => {
    if (editingId && editTextareaRef.current) editTextareaRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (showAddForm && addTextareaRef.current) addTextareaRef.current.focus();
  }, [showAddForm]);

  // Bloqueo de cierre/recarga cuando hay cambios sin guardar
  const hasUnsavedChanges = editingId !== null || showAddForm;
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // ==========================================
  // Handlers
  // ==========================================

  const handleStartEdit = (q: PreguntaBanco) => {
    setEditingId(q.id);
    setEditText(q.texto);
    setEditPolaridad(q.polaridad);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = (id: number) => {
    const trimmed = editText.trim();
    if (trimmed.length < 10) {
      showToast({ message: 'La pregunta debe tener al menos 10 caracteres', type: 'error' });
      return;
    }
    setUpdateConfirmId(id);
  };

  const handleConfirmUpdate = async () => {
    if (!updateConfirmId) return;
    setIsActionLoading(true);
    try {
      await adminService.actualizarBancoPregunta(updateConfirmId, {
        texto: editText.trim(),
        polaridad: editPolaridad,
      });
      showToast({ message: 'Pregunta actualizada', type: 'success' });
      setEditingId(null);
      setEditText('');
      setUpdateConfirmId(null);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al actualizar la pregunta');
      showToast({ message: msg, type: 'error' });
      setUpdateConfirmId(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelUpdate = () => { setUpdateConfirmId(null); };

  const handleTogglePolaridad = async (q: PreguntaBanco) => {
    if (editingId === q.id) return;
    const nuevaPolaridad: PreguntaPolaridad = q.polaridad === 'POSITIVA' ? 'NEGATIVA' : 'POSITIVA';
    try {
      await adminService.actualizarBancoPregunta(q.id, { polaridad: nuevaPolaridad });
      setPreguntas((prev) =>
        prev.map((p) => (p.id === q.id ? { ...p, polaridad: nuevaPolaridad } : p))
      );
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al cambiar polaridad');
      showToast({ message: msg, type: 'error' });
    }
  };

  const handleDelete = (id: number) => { setDeleteConfirmId(id); };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsActionLoading(true);
    try {
      await adminService.eliminarBancoPregunta(deleteConfirmId);
      showToast({ message: 'Pregunta eliminada del banco', type: 'success' });
      if (editingId === deleteConfirmId) setEditingId(null);
      setDeleteConfirmId(null);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al eliminar la pregunta');
      showToast({ message: msg, type: 'error' });
      setDeleteConfirmId(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelDelete = () => { setDeleteConfirmId(null); };

  const handleAddQuestion = async () => {
    const trimmed = newText.trim();
    if (trimmed.length < 10) {
      setAddError('La pregunta debe tener al menos 10 caracteres');
      return;
    }
    setIsActionLoading(true);
    try {
      await adminService.crearBancoPregunta({
        texto: trimmed,
        tipo: 'SELECCION_ALUMNO',
        polaridad: newPolaridad,
        max_elecciones: 3,
        orden: preguntas.length + 1,
      });
      showToast({ message: 'Pregunta agregada al banco', type: 'success' });
      setNewText('');
      setNewPolaridad('POSITIVA');
      setAddError('');
      setShowAddForm(false);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al crear la pregunta');
      setAddError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setNewText('');
    setAddError('');
    setShowAddForm(false);
  };

  // ==========================================
  // Datos filtrados
  // ==========================================

  const preguntasFiltradas =
    filtro === 'TODAS' ? preguntas : preguntas.filter((q) => q.polaridad === filtro);

  const totalPositivas = preguntas.filter((q) => q.polaridad === 'POSITIVA').length;
  const totalNegativas = preguntas.filter((q) => q.polaridad === 'NEGATIVA').length;

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm">Cargando banco de preguntas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/cuestionarios')}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Volver a cuestionarios"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-black">Banco de preguntas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalPositivas} positivas · {totalNegativas} negativas · Limite: 30
          </p>
        </div>
      </div>

      {/* Aviso limite */}
      {preguntas.length >= 30 && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6.5V9.5" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="#92400e" />
          </svg>
          <span>
            <strong>Limite alcanzado.</strong> El banco tiene el maximo de 30 preguntas.
            Para agregar nuevas, primero elimina alguna existente.
          </span>
        </div>
      )}

      {/* Formulario agregar pregunta */}
      {showAddForm && (
        <div className="bg-white border-2 border-[#0B5A4A]/30 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-[#0B5A4A]">Nueva pregunta</p>

          <textarea
            ref={addTextareaRef}
            value={newText}
            onChange={(e) => { setNewText(e.target.value); setAddError(''); }}
            placeholder="Escribe el texto de la pregunta..."
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0B5A4A] bg-white"
          />
          {addError && <p className="text-xs text-[#7A1501]">{addError}</p>}

          {/* Selector de polaridad */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Polaridad:</span>
            <button
              onClick={() => setNewPolaridad('POSITIVA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                newPolaridad === 'POSITIVA'
                  ? 'bg-[#0B9624]/10 border-[#0B9624] text-[#0B9624]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <GreenBall size={14} />
              Positiva
            </button>
            <button
              onClick={() => setNewPolaridad('NEGATIVA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                newPolaridad === 'NEGATIVA'
                  ? 'bg-[#7A1501]/10 border-[#7A1501] text-[#7A1501]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <RedBall size={14} />
              Negativa
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAddQuestion}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
            <button
              onClick={handleCancelAdd}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2">
        {(['TODAS', 'POSITIVA', 'NEGATIVA'] as const).map((f) => {
          const label = f === 'TODAS' ? `Todas (${preguntas.length})` : f === 'POSITIVA' ? `Positivas (${totalPositivas})` : `Negativas (${totalNegativas})`;
          const isActive = filtro === f;
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                isActive
                  ? f === 'NEGATIVA'
                    ? 'bg-[#7A1501]/10 border-[#7A1501] text-[#7A1501]'
                    : f === 'POSITIVA'
                      ? 'bg-[#0B9624]/10 border-[#0B9624] text-[#0B9624]'
                      : 'bg-[#0B5A4A]/10 border-[#0B5A4A] text-[#0B5A4A]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Lista de preguntas */}
      <div className="flex flex-col gap-2 pb-6">
        {preguntasFiltradas.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            {preguntas.length === 0 ? 'El banco de preguntas esta vacio.' : 'No hay preguntas para el filtro seleccionado.'}
          </div>
        )}

        {preguntasFiltradas.map((q, idx) => {
          const isPos = q.polaridad === 'POSITIVA';
          const isEditing = editingId === q.id;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl border-2 transition-all duration-150 ${
                isEditing
                  ? 'border-[#0B5A4A] shadow-[0_4px_12px_rgba(11,90,74,0.12)]'
                  : isPos
                    ? 'border-[#0B9624]/30 hover:border-[#0B9624]/60'
                    : 'border-[#7A1501]/30 hover:border-[#7A1501]/60'
              }`}
            >
              {/* Cabecera de la pregunta */}
              <div className="flex items-start gap-3 p-3 sm:p-4">
                {/* Numero + bolita */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span className={`text-xs font-bold tabular-nums ${isPos ? 'text-[#0B9624]' : 'text-[#7A1501]'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => !isEditing && handleTogglePolaridad(q)}
                    className="transition-transform duration-200 hover:scale-125 active:scale-95"
                    title={`Polaridad: ${q.polaridad}. Clic para cambiar`}
                  >
                    {isPos ? <GreenBall size={20} /> : <RedBall size={20} />}
                  </button>
                </div>

                {/* Texto o campo de edicion */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        ref={editTextareaRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0B5A4A] bg-white"
                      />

                      {/* Selector polaridad en edicion */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Polaridad:</span>
                        <button
                          onClick={() => setEditPolaridad('POSITIVA')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            editPolaridad === 'POSITIVA'
                              ? 'bg-[#0B9624]/10 border-[#0B9624] text-[#0B9624]'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <GreenBall size={13} />
                          Positiva
                        </button>
                        <button
                          onClick={() => setEditPolaridad('NEGATIVA')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            editPolaridad === 'NEGATIVA'
                              ? 'bg-[#7A1501]/10 border-[#7A1501] text-[#7A1501]'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <RedBall size={13} />
                          Negativa
                        </button>
                      </div>

                      {/* Acciones guardar/cancelar */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(q.id)}
                          disabled={isActionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5A4A] text-white text-xs font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
                        >
                          <Check size={13} strokeWidth={3} />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X size={13} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-800 leading-snug wrap-break-word">
                      {q.texto}
                    </p>
                  )}
                </div>

                {/* Acciones editar / eliminar */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(q)}
                      className="p-1.5 text-gray-400 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors"
                      title="Editar pregunta"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-gray-400 hover:text-[#7A1501] hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar pregunta"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Badge de polaridad */}
              {!isEditing && (
                <div className="px-4 pb-2.5 flex items-center gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isPos
                      ? 'bg-[#0B9624]/10 text-[#0B9624]'
                      : 'bg-[#7A1501]/10 text-[#7A1501]'
                  }`}>
                    {isPos ? 'Positiva' : 'Negativa'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmacion de eliminacion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 size={20} className="text-[#7A1501]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Eliminar pregunta</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              ¿Seguro que deseas eliminar esta pregunta del banco? Los cuestionarios existentes
              no se veran afectados porque usan copias independientes.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                disabled={isActionLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#7A1501] text-white text-sm font-semibold rounded-lg hover:bg-[#5c1001] transition-colors disabled:opacity-50"
              >
                {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmacion de actualizacion */}
      {updateConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#0B5A4A]/10 rounded-lg">
                <Save size={20} className="text-[#0B5A4A]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Guardar cambios</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              ¿Seguro que deseas actualizar esta pregunta? Los cuestionarios existentes
              no se veran afectados.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelUpdate}
                disabled={isActionLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdate}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
              >
                {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
