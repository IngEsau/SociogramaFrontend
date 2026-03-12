/**
 * Vista: Banco de Preguntas
 *
 * Reglas de pares sociometricos:
 * - Crear siempre genera un par (positiva + negativa), sin descripcion
 * - Eliminar borra el par completo (un solo boton por par)
 * - Editar texto es individual por pregunta (lapiz en cada pregunta)
 * - Editar descripcion es a nivel de par (se aplica la misma a ambas)
 * - No se permite cambiar la polaridad
 * - La descripcion se muestra al pasar el mouse sobre la pregunta
 */

import { useState, useEffect, useRef, useCallback, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Check, X, ArrowLeft, Save, RefreshCw, Info, Link2, MessageSquarePlus } from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { useTopbarStore, useToastStore } from '../../../store';
import { GreenBall, RedBall } from '../../../components/ui';
import { adminService } from '../services';
import type { PreguntaBanco } from '../types';

// ==========================================
// Tipos locales
// ==========================================

type Filtro = 'TODAS' | 'POSITIVA' | 'NEGATIVA';

interface ParPregunta {
  positiva: PreguntaBanco;
  negativa: PreguntaBanco;
}

// ==========================================
// Utilidades
// ==========================================

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

function agruparEnPares(preguntas: PreguntaBanco[]): { pares: ParPregunta[]; huerfanas: PreguntaBanco[] } {
  const yaAgrupadas = new Set<number>();
  const pares: ParPregunta[] = [];
  const huerfanas: PreguntaBanco[] = [];
  const preguntasMap = new Map(preguntas.map((p) => [p.id, p]));
  const ordenadas = [...preguntas].sort((a, b) => a.orden - b.orden);

  for (const pregunta of ordenadas) {
    if (yaAgrupadas.has(pregunta.id)) continue;
    if (pregunta.par_pregunta_id && preguntasMap.has(pregunta.par_pregunta_id)) {
      const par = preguntasMap.get(pregunta.par_pregunta_id)!;
      yaAgrupadas.add(pregunta.id);
      yaAgrupadas.add(par.id);
      const positiva = pregunta.polaridad === 'POSITIVA' ? pregunta : par;
      const negativa = pregunta.polaridad === 'NEGATIVA' ? pregunta : par;
      pares.push({ positiva, negativa });
    } else {
      huerfanas.push(pregunta);
    }
  }
  return { pares, huerfanas };
}

// ==========================================
// Componente principal
// ==========================================

export function AdminBancoPreguntasView() {
  const navigate = useNavigate();
  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  const [preguntas, setPreguntas] = useState<PreguntaBanco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [filtro, setFiltro] = useState<Filtro>('TODAS');

  // Edicion individual de texto (lapiz por pregunta)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Edicion de descripcion a nivel de par
  const [editingDescParIds, setEditingDescParIds] = useState<{ posId: number; negId: number } | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');

  // Confirmaciones
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [updateConfirmId, setUpdateConfirmId] = useState<number | null>(null);
  const [updateDescConfirm, setUpdateDescConfirm] = useState(false);

  // Formulario nuevo par
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPositivaText, setNewPositivaText] = useState('');
  const [newNegativaText, setNewNegativaText] = useState('');
  const [addError, setAddError] = useState('');

  // Tooltip
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Refs
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const addPositivaRef = useRef<HTMLTextAreaElement>(null);
  const editDescRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Fetch
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

  useEffect(() => { fetchBanco(); }, [fetchBanco]);

  // Topbar
  useEffect(() => {
    const totalPares = Math.floor(preguntas.length / 2);
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: createElement('div', { className: 'flex items-center gap-2' },
        createElement('div', {
          className: 'flex items-center gap-2 border border-[#0F7E3C]/50 rounded-lg px-3 py-1.5 sm:py-2 shadow-sm bg-white'
        },
          createElement('span', { className: 'text-xs sm:text-sm font-bold text-black whitespace-nowrap' },
            `${preguntas.length} preguntas (${totalPares} pares)`
          )
        ),
        createElement('button', {
          className: 'p-2 text-gray-500 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors',
          title: 'Recargar banco',
          onClick: () => fetchBanco()
        }, createElement(RefreshCw, { size: 16 })),
        createElement('button', {
          className: `flex items-center gap-2 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors ${preguntas.length >= 30 ? 'opacity-50 cursor-not-allowed' : ''}`,
          disabled: preguntas.length >= 30,
          onClick: () => { setShowAddForm(true); setEditingId(null); setEditingDescParIds(null); }
        }, createElement(Plus, { size: 16 }), 'Nuevo par')
      ),
    });
    return () => resetTopbar();
  }, [preguntas.length, setTopbarConfig, resetTopbar, fetchBanco]);

  useEffect(() => {
    if (editingId && editTextareaRef.current) editTextareaRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (showAddForm && addPositivaRef.current) addPositivaRef.current.focus();
  }, [showAddForm]);

  useEffect(() => {
    if (editingDescParIds && editDescRef.current) editDescRef.current.focus();
  }, [editingDescParIds]);

  // Bloqueo de cierre/recarga
  const hasUnsavedChanges = editingId !== null || showAddForm || editingDescParIds !== null;
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // ==========================================
  // Edicion individual de texto (lapiz)
  // ==========================================

  const handleStartEdit = (q: PreguntaBanco) => {
    setEditingId(q.id);
    setEditText(q.texto);
    setShowAddForm(false);
    setEditingDescParIds(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = (id: number) => {
    if (editText.trim().length < 10) {
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
      });
      showToast({ message: 'Texto actualizado', type: 'success' });
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

  // ==========================================
  // Edicion de descripcion a nivel de par
  // ==========================================

  const handleStartEditDesc = (par: ParPregunta) => {
    setEditingDescParIds({ posId: par.positiva.id, negId: par.negativa.id });
    // Toma la descripcion actual (ambas deberían ser iguales, o toma la que exista)
    setEditDescripcion(par.positiva.descripcion || par.negativa.descripcion || '');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleCancelEditDesc = () => {
    setEditingDescParIds(null);
    setEditDescripcion('');
  };

  const handleSaveDesc = () => {
    // Descripcion es opcional, puede ser vacía (para quitar una existente)
    setUpdateDescConfirm(true);
  };

  const handleConfirmUpdateDesc = async () => {
    if (!editingDescParIds) return;
    setIsActionLoading(true);
    try {
      const desc = editDescripcion.trim();
      // Actualizar ambas preguntas del par con la misma descripcion
      // Si esta vacio, enviamos string vacio para que el backend lo limpie
      await Promise.all([
        adminService.actualizarBancoPregunta(editingDescParIds.posId, { descripcion: desc }),
        adminService.actualizarBancoPregunta(editingDescParIds.negId, { descripcion: desc }),
      ]);
      showToast({ message: desc ? 'Descripcion actualizada en ambas preguntas' : 'Descripcion eliminada del par', type: 'success' });
      setEditingDescParIds(null);
      setEditDescripcion('');
      setUpdateDescConfirm(false);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al actualizar la descripcion');
      showToast({ message: msg, type: 'error' });
      setUpdateDescConfirm(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================
  // Eliminacion (par completo)
  // ==========================================

  const handleDeletePar = (par: ParPregunta) => {
    // Usamos el id de la positiva para disparar la eliminacion (el backend borra el par)
    setDeleteConfirmId(par.positiva.id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsActionLoading(true);
    try {
      const res = await adminService.eliminarBancoPregunta(deleteConfirmId);
      const parMsg = res.eliminadas?.par ? ' y su par vinculado' : '';
      showToast({ message: `Pregunta eliminada${parMsg}`, type: 'success' });
      if (editingId === deleteConfirmId) setEditingId(null);
      setDeleteConfirmId(null);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al eliminar');
      showToast({ message: msg, type: 'error' });
      setDeleteConfirmId(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================
  // Crear par (sin descripcion)
  // ==========================================

  const handleAddPair = async () => {
    const posText = newPositivaText.trim();
    const negText = newNegativaText.trim();

    if (posText.length < 10) { setAddError('La pregunta positiva debe tener al menos 10 caracteres'); return; }
    if (negText.length < 10) { setAddError('La pregunta negativa debe tener al menos 10 caracteres'); return; }

    setIsActionLoading(true);
    try {
      await adminService.crearParBancoPreguntas({
        positiva: {
          texto: posText,
          tipo: 'SELECCION_ALUMNO',
          max_elecciones: 3,
          orden: preguntas.length + 1,
        },
        negativa: {
          texto: negText,
          tipo: 'SELECCION_ALUMNO',
          max_elecciones: 3,
          orden: preguntas.length + 2,
        },
      });
      showToast({ message: 'Par de preguntas creado', type: 'success' });
      setNewPositivaText('');
      setNewNegativaText('');
      setAddError('');
      setShowAddForm(false);
      await fetchBanco();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al crear el par de preguntas');
      setAddError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setNewPositivaText('');
    setNewNegativaText('');
    setAddError('');
    setShowAddForm(false);
  };

  // ==========================================
  // Datos procesados
  // ==========================================

  const { pares, huerfanas } = agruparEnPares(preguntas);
  const totalPositivas = preguntas.filter((q) => q.polaridad === 'POSITIVA').length;
  const totalNegativas = preguntas.filter((q) => q.polaridad === 'NEGATIVA').length;

  const huerfanasFiltradas = filtro === 'TODAS'
    ? huerfanas
    : huerfanas.filter((q) => q.polaridad === filtro);

  // Datos para modal de eliminacion
  const preguntaAEliminar = deleteConfirmId ? preguntas.find((p) => p.id === deleteConfirmId) : null;
  const parDePreguntaAEliminar = preguntaAEliminar?.par_pregunta_id
    ? preguntas.find((p) => p.id === preguntaAEliminar.par_pregunta_id)
    : null;

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <Spinner size="lg" className="text-[#0B5A4A]" />
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
            {totalPositivas} positivas · {totalNegativas} negativas · {pares.length} pares · Limite: 30
          </p>
        </div>
      </div>

      {/* Aviso de pares */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <Link2 size={14} className="shrink-0 mt-0.5" />
        <span>
          <strong>Pares sociometricos.</strong> Cada pregunta positiva tiene su contraparte negativa vinculada.
          Al crear se genera el par automaticamente y al eliminar se borran ambas.
        </span>
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
            Para agregar nuevas, primero elimina algun par existente.
          </span>
        </div>
      )}

      {/* Formulario nuevo par — solo textos, sin descripcion */}
      {showAddForm && (
        <div className="bg-white border-2 border-[#0B5A4A]/30 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[#0B5A4A]" />
            <p className="text-sm font-semibold text-[#0B5A4A]">Nuevo par de preguntas</p>
          </div>

          {/* Positiva */}
          <div className="flex flex-col gap-2 p-3 bg-[#0B9624]/5 border border-[#0B9624]/20 rounded-lg">
            <div className="flex items-center gap-2">
              <GreenBall size={16} />
              <span className="text-xs font-bold text-[#0B9624]">Pregunta positiva</span>
            </div>
            <textarea
              ref={addPositivaRef}
              value={newPositivaText}
              onChange={(e) => { setNewPositivaText(e.target.value); setAddError(''); }}
              placeholder="Ej: ¿Con quien preferirias trabajar en equipo?"
              rows={2}
              className="w-full text-sm border border-[#0B9624]/20 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0B9624] bg-white"
            />
          </div>

          {/* Negativa */}
          <div className="flex flex-col gap-2 p-3 bg-[#7A1501]/5 border border-[#7A1501]/20 rounded-lg">
            <div className="flex items-center gap-2">
              <RedBall size={16} />
              <span className="text-xs font-bold text-[#7A1501]">Pregunta negativa</span>
            </div>
            <textarea
              value={newNegativaText}
              onChange={(e) => { setNewNegativaText(e.target.value); setAddError(''); }}
              placeholder="Ej: ¿Con quien preferirias NO trabajar en equipo?"
              rows={2}
              className="w-full text-sm border border-[#7A1501]/20 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#7A1501] bg-white"
            />
          </div>

          {addError && <p className="text-xs text-[#7A1501] font-medium">{addError}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAddPair}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
            >
              {isActionLoading ? <Spinner size="xs" className="text-white" /> : <Save size={14} />}
              Crear par
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

      {/* Lista de pares */}
      <div className="flex flex-col gap-3 pb-6">
        {pares.length === 0 && huerfanas.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            El banco de preguntas esta vacio.
          </div>
        )}

        {pares.map((par, idx) => {
          const isEditingPar = editingId === par.positiva.id || editingId === par.negativa.id;
          const isEditingDesc = editingDescParIds?.posId === par.positiva.id;
          const showPositiva = filtro === 'TODAS' || filtro === 'POSITIVA';
          const showNegativa = filtro === 'TODAS' || filtro === 'NEGATIVA';
          const parDescripcion = par.positiva.descripcion || par.negativa.descripcion || '';

          return (
            <div
              key={`par-${par.positiva.id}-${par.negativa.id}`}
              className={`bg-white rounded-xl border-2 transition-all duration-150 ${
                isEditingPar || isEditingDesc
                  ? 'border-[#0B5A4A] shadow-[0_4px_12px_rgba(11,90,74,0.12)]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Cabecera del par — boton de borrar y descripcion aqui */}
              <div className="px-3 sm:px-4 pt-2.5 pb-1.5 flex items-center gap-2 border-b border-gray-100">
                <Link2 size={13} className="text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Par {idx + 1}
                </span>

                {/* Badge de descripcion si existe */}
                {parDescripcion && !isEditingDesc && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-1">
                    <Info size={10} />
                    Con descripcion
                  </span>
                )}

                <div className="flex-1" />

                {/* Boton para agregar/editar descripcion del par */}
                <button
                  onClick={() => handleStartEditDesc(par)}
                  className="p-1.5 text-gray-400 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors"
                  title={parDescripcion ? 'Editar descripcion del par' : 'Agregar descripcion al par'}
                >
                  <MessageSquarePlus size={14} />
                </button>

                {/* Boton de eliminar par */}
                <button
                  onClick={() => handleDeletePar(par)}
                  className="p-1.5 text-gray-400 hover:text-[#7A1501] hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar par completo"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Formulario inline para editar descripcion del par */}
              {isEditingDesc && (
                <div className="px-3 sm:px-4 py-2.5 bg-[#0B5A4A]/3 border-b border-gray-100">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Info size={12} className="text-[#0B5A4A]" />
                      <span className="text-xs font-semibold text-[#0B5A4A]">
                        Descripcion del par (se aplica a ambas preguntas)
                      </span>
                    </div>
                    <input
                      ref={editDescRef}
                      type="text"
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      placeholder="Descripcion opcional — Se muestra al pasar el mouse sobre la pregunta"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0B5A4A] bg-white text-gray-700"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveDesc}
                        disabled={isActionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5A4A] text-white text-xs font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
                      >
                        <Check size={13} strokeWidth={3} />
                        {editDescripcion.trim() ? 'Guardar' : 'Quitar descripcion'}
                      </button>
                      <button
                        onClick={handleCancelEditDesc}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X size={13} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pregunta positiva */}
              {showPositiva && (
                <div className={showNegativa ? 'border-b border-gray-50' : ''}>
                  <PreguntaItem
                    pregunta={par.positiva}
                    index={idx * 2}
                    editingId={editingId}
                    editText={editText}
                    editTextareaRef={editTextareaRef}
                    hoveredId={hoveredId}
                    isActionLoading={isActionLoading}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onEditTextChange={setEditText}
                    onHover={setHoveredId}
                  />
                </div>
              )}

              {/* Pregunta negativa */}
              {showNegativa && (
                <PreguntaItem
                  pregunta={par.negativa}
                  index={idx * 2 + 1}
                  editingId={editingId}
                  editText={editText}
                  editTextareaRef={editTextareaRef}
                  hoveredId={hoveredId}
                  isActionLoading={isActionLoading}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onEditTextChange={setEditText}
                  onHover={setHoveredId}
                />
              )}
            </div>
          );
        })}

        {/* Preguntas huerfanas (legacy sin par) */}
        {huerfanasFiltradas.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Preguntas sin par (legacy)</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {huerfanasFiltradas.map((q, idx) => {
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
                  <PreguntaItem
                    pregunta={q}
                    index={pares.length * 2 + idx}
                    editingId={editingId}
                    editText={editText}
                    editTextareaRef={editTextareaRef}
                    hoveredId={hoveredId}
                    isActionLoading={isActionLoading}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onEditTextChange={setEditText}
                    onHover={setHoveredId}
                    showDelete
                    onDelete={(id) => setDeleteConfirmId(id)}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal: Eliminar par */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 size={20} className="text-[#7A1501]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Eliminar {parDePreguntaAEliminar ? 'par de preguntas' : 'pregunta'}
              </h3>
            </div>

            {preguntaAEliminar && (
              <div className="flex flex-col gap-2 mb-4">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    {preguntaAEliminar.polaridad === 'POSITIVA' ? <GreenBall size={12} /> : <RedBall size={12} />}
                    <span className="text-xs font-semibold text-gray-500">{preguntaAEliminar.polaridad}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{preguntaAEliminar.texto}</p>
                </div>
                {parDePreguntaAEliminar && (
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      {parDePreguntaAEliminar.polaridad === 'POSITIVA' ? <GreenBall size={12} /> : <RedBall size={12} />}
                      <span className="text-xs font-semibold text-gray-500">{parDePreguntaAEliminar.polaridad} (par vinculado)</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{parDePreguntaAEliminar.texto}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {parDePreguntaAEliminar
                ? 'Se eliminaran ambas preguntas del par. Los cuestionarios existentes no se veran afectados.'
                : 'Se eliminara esta pregunta. Los cuestionarios existentes no se veran afectados.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
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
                {isActionLoading && <Spinner size="xs" className="text-white" />}
                Eliminar {parDePreguntaAEliminar ? 'par' : 'pregunta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar actualizacion de texto */}
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
              ¿Seguro que deseas actualizar el texto de esta pregunta?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setUpdateConfirmId(null)}
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
                {isActionLoading && <Spinner size="xs" className="text-white" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar actualizacion de descripcion */}
      {updateDescConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#0B5A4A]/10 rounded-lg">
                <Info size={20} className="text-[#0B5A4A]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {editDescripcion.trim() ? 'Guardar descripcion' : 'Quitar descripcion'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {editDescripcion.trim()
                ? 'La descripcion se aplicara a ambas preguntas del par (positiva y negativa).'
                : 'Se eliminara la descripcion de ambas preguntas del par.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setUpdateDescConfirm(false)}
                disabled={isActionLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdateDesc}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B5A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
              >
                {isActionLoading && <Spinner size="xs" className="text-white" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Subcomponente: PreguntaItem
// Solo muestra texto + bolita + lapiz de edicion individual
// El boton de borrar y la descripcion se manejan a nivel de par
// ==========================================

function PreguntaItem({
  pregunta,
  index,
  editingId,
  editText,
  editTextareaRef,
  hoveredId,
  isActionLoading,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTextChange,
  onHover,
  showDelete = false,
  onDelete,
}: {
  pregunta: PreguntaBanco;
  index: number;
  editingId: number | null;
  editText: string;
  editTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  hoveredId: number | null;
  isActionLoading: boolean;
  onStartEdit: (q: PreguntaBanco) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onEditTextChange: (text: string) => void;
  onHover: (id: number | null) => void;
  /** Solo para huerfanas legacy que no tienen par */
  showDelete?: boolean;
  onDelete?: (id: number) => void;
}) {
  const isPos = pregunta.polaridad === 'POSITIVA';
  const isEditing = editingId === pregunta.id;
  const isHovered = hoveredId === pregunta.id;

  return (
    <div className="flex items-start gap-3 p-3 sm:p-3.5 relative">
      {/* Numero + bolita */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <span className={`text-xs font-bold tabular-nums ${isPos ? 'text-[#0B9624]' : 'text-[#7A1501]'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div title={`Polaridad: ${pregunta.polaridad} (no modificable)`}>
          {isPos ? <GreenBall size={18} /> : <RedBall size={18} />}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={editTextareaRef}
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0B5A4A] bg-white"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onSaveEdit(pregunta.id)}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5A4A] text-white text-xs font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50"
              >
                <Check size={13} strokeWidth={3} />
                Guardar
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={13} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => onHover(pregunta.id)}
            onMouseLeave={() => onHover(null)}
          >
            <p className="text-sm font-medium text-gray-800 leading-snug wrap-break-word">
              {pregunta.texto}
            </p>

            {/* Badge de polaridad */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isPos
                  ? 'bg-[#0B9624]/10 text-[#0B9624]'
                  : 'bg-[#7A1501]/10 text-[#7A1501]'
              }`}>
                {isPos ? 'Positiva' : 'Negativa'}
              </span>
              {pregunta.descripcion && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 cursor-default">
                  <Info size={10} />
                  Hover para ver descripcion
                </span>
              )}
            </div>

            {/* Tooltip de descripcion */}
            {isHovered && pregunta.descripcion && (
              <div className="absolute left-0 top-full mt-1 z-40 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-sm pointer-events-none">
                <p className="font-medium mb-0.5 text-gray-300">Descripcion:</p>
                <p className="leading-relaxed">{pregunta.descripcion}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones: solo lapiz para editar texto individual */}
      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStartEdit(pregunta)}
            className="p-1.5 text-gray-400 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors"
            title="Editar texto de esta pregunta"
          >
            <Pencil size={14} />
          </button>
          {/* Boton de borrar solo para huerfanas legacy */}
          {showDelete && onDelete && (
            <button
              onClick={() => onDelete(pregunta.id)}
              className="p-1.5 text-gray-400 hover:text-[#7A1501] hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar pregunta"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
