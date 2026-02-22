/**
 * Vista de Cuestionarios - Admin
 *
 * El admin crea cuestionarios, agrega/elimina preguntas,
 * previsualiza y cambia el estado (borrador / activo).
 * - Si el cuestionario NO esta activo, los tutores no lo ven.
 * - Una vez activo, no se puede editar (pero si eliminar y previsualizar).
 * - Las fechas las asigna el tutor, no el admin.
 * - Las preguntas tienen indicador positiva (verde) / negativa (rojo).
 *
 * Endpoints:
 * - GET    /api/admin/cuestionarios/                             - Listar
 * - GET    /api/admin/cuestionarios/:id/                         - Detalle
 * - POST   /api/admin/cuestionarios/crear/                       - Crear
 * - POST   /api/admin/cuestionarios/:id/activar/                 - Activar
 * - POST   /api/admin/cuestionarios/:id/desactivar/              - Desactivar
 * - POST   /api/admin/cuestionarios/:id/agregar-pregunta/        - Agregar pregunta
 * - DELETE  /api/admin/cuestionarios/:id/remover-pregunta/:pId/  - Remover pregunta
 * - DELETE  /api/admin/cuestionarios/:id/eliminar/               - Eliminar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Eye,
  AlertTriangle,
  ArrowLeft,
  Send,
  GripVertical,
  FileText,
  Edit3,
  Lock,
  Check,
  Loader2,
  Calendar,
  Pencil,
  Users,
  X,
} from 'lucide-react';
import { useTopbarStore, useToastStore } from '../../../store';
import { GreenBall, RedBall } from '../../../components/ui';
import { adminService } from '../services';
import {
  SurveyHeader,
  SurveyForm,
  DecorativeCircles,
} from '../../student/form/components';
import type { Question, QuestionAnswer, Student } from '../../student/types/studentForm.types';
import type {
  Cuestionario,
  CuestionarioPregunta,
  Period,
  PreguntaInput,
  PreguntaPolaridad,
  PreguntaBanco,
} from '../types';

type ViewMode = 'list' | 'create' | 'detail' | 'preview';

// ==========================================
// Tipo local del banco usado en la vista de creacion
// ==========================================

/**
 * BankQuestion extiende PreguntaBanco con un campo `selected` local
 * para controlar que preguntas se incluyen en el cuestionario.
 * Las preguntas personalizadas usan id negativo temporal.
 */
interface BankQuestion extends PreguntaBanco {
  selected: boolean;
}


/** Extrae mensaje legible de un error de Axios o generico */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosErr.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.message === 'string') return data.message;
      // Errores de validacion de Django: { campo: ["msg", ...] }
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

export function AdminCuestionariosView() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [periodoActivo, setPeriodoActivo] = useState<Period | null>(null);
  const [periodos, setPeriodos] = useState<Period[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCuestionario, setSelectedCuestionario] = useState<Cuestionario | null>(null);

  // --- Crear cuestionario ---
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [questionBank, setQuestionBank] = useState<BankQuestion[]>([]);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionPolaridad, setNewQuestionPolaridad] = useState<PreguntaPolaridad>('POSITIVA');

  // Modal de confirmacion
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activar' | 'desactivar' | 'eliminar';
    cuestionario: Cuestionario;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Agregar pregunta (en detalle) — ahora las operaciones son locales, no hay loading
  const isAddingPregunta = false; // Siempre false, las operaciones son instantaneas
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [addMode, setAddMode] = useState<'select' | 'custom' | 'bank' | null>(null);
  const [bankForDetail, setBankForDetail] = useState<PreguntaBanco[]>([]);
  const [isBankDetailLoading, setIsBankDetailLoading] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());
  // Pregunta personalizada en par (positiva + negativa)
  const [customPairText, setCustomPairText] = useState('');
  const [customPairTextNeg, setCustomPairTextNeg] = useState('');
  // Edicion inline de pregunta copia
  const [editingCopyId, setEditingCopyId] = useState<number | null>(null);
  const [editCopyText, setEditCopyText] = useState('');

  // Copia local de preguntas durante el modo edicion.
  // Todas las ediciones (borrar, texto, polaridad, reorden) se aplican aqui.
  // Solo al "Confirmar cambios" se envian al backend.
  const [editablePreguntas, setEditablePreguntas] = useState<CuestionarioPregunta[] | null>(null);
  const [isConfirmingEdits, setIsConfirmingEdits] = useState(false);

  // Drag & Drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Proteccion contra perdida de progreso en creacion
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasUnsavedCreate = viewMode === 'create' && (titulo.trim().length > 0 || questionBank.some((q) => q.selected));

  const { setTopbarConfig, resetTopbar } = useTopbarStore();
  const { showToast } = useToastStore();

  // Prevenir perdida de datos al cerrar o recargar pestana
  useEffect(() => {
    if (!hasUnsavedCreate && !isEditingDetail) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedCreate, isEditingDetail]);

  // Prevenir navegacion con boton atras del navegador cuando esta en modo edicion
  useEffect(() => {
    if (!isEditingDetail) return;
    // Pushear un estado extra para interceptar el popstate
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      // Re-pushear para mantener en la misma pagina
      window.history.pushState(null, '', window.location.href);
      setShowEditExitConfirm(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isEditingDetail]);

  // ==========================================
  // Fetch
  // ==========================================

  const fetchCuestionarios = useCallback(async (periodoId?: number) => {
    setIsLoading(true);
    try {
      const res = await adminService.getCuestionarios(periodoId);
      setCuestionarios(res.cuestionarios || []);
    } catch {
      showToast({ message: 'Error al cargar cuestionarios', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const fetchPeriodoActivo = useCallback(async () => {
    try {
      const periodo = await adminService.getPeriodoActivo();
      setPeriodoActivo(periodo);
      if (periodo) {
        setSelectedPeriodoId(periodo.id);
      }
    } catch {
      setPeriodoActivo(null);
    }
  }, []);

  const fetchPeriodos = useCallback(async () => {
    try {
      const data = await adminService.getPeriodos();
      setPeriodos(data);
    } catch {
      setPeriodos([]);
    }
  }, []);

  useEffect(() => {
    fetchPeriodoActivo();
    fetchPeriodos();
  }, [fetchPeriodoActivo, fetchPeriodos]);

  /** Carga las preguntas del banco desde la API y marca las primeras 20 como seleccionadas */
  const fetchBancoPreguntas = useCallback(async () => {
    setIsBankLoading(true);
    try {
      const res = await adminService.getBancoPreguntas();
      const preguntas = res.preguntas || [];
      setQuestionBank(
        preguntas.map((p, idx) => ({ ...p, selected: idx < 20 }))
      );
    } catch {
      showToast({ message: 'Error al cargar banco de preguntas', type: 'error' });
      setQuestionBank([]);
    } finally {
      setIsBankLoading(false);
    }
  }, [showToast]);

  // Cargar cuestionarios al cambiar de periodo
  useEffect(() => {
    if (selectedPeriodoId !== null) {
      fetchCuestionarios(selectedPeriodoId);
    } else {
      fetchCuestionarios();
    }
  }, [selectedPeriodoId, fetchCuestionarios]);

  const handlePeriodoChange = useCallback((periodoId: number | null) => {
    setSelectedPeriodoId(periodoId);
  }, []);

  // Cargar banco de preguntas al entrar en modo crear
  useEffect(() => {
    if (viewMode === 'create' && questionBank.length === 0) {
      fetchBancoPreguntas();
    }
  }, [viewMode, questionBank.length, fetchBancoPreguntas]);

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      customContent: (
        <PeriodoSelector
          periodos={periodos}
          selectedId={selectedPeriodoId}
          periodoActivo={periodoActivo}
          onChange={handlePeriodoChange}
        />
      ),
    });
    return () => resetTopbar();
  }, [setTopbarConfig, resetTopbar, periodos, selectedPeriodoId, periodoActivo, handlePeriodoChange]);

  // ==========================================
  // Acciones
  // ==========================================

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, cuestionario } = confirmAction;
    setIsConfirmLoading(true);
    try {
      if (type === 'activar') {
        const res = await adminService.activarCuestionario(cuestionario.id);
        showToast({
          message: `Cuestionario activado. ${res.estados_creados ?? 0} estados creados.`,
          type: 'success',
        });
        // Tras activar exitosamente, volver a la lista
        setSelectedCuestionario(null);
        setViewMode('list');
      } else if (type === 'desactivar') {
        await adminService.desactivarCuestionario(cuestionario.id);
        showToast({ message: 'Cuestionario desactivado.', type: 'info' });
      } else if (type === 'eliminar') {
        await adminService.eliminarCuestionario(cuestionario.id);
        showToast({ message: 'Cuestionario eliminado.', type: 'success' });
        if (selectedCuestionario?.id === cuestionario.id) {
          setSelectedCuestionario(null);
          setViewMode('list');
        }
      }
      await fetchCuestionarios(selectedPeriodoId ?? undefined);
      // Refrescar detalle si seguimos en esa vista (desactivar)
      if (selectedCuestionario && type === 'desactivar') {
        await refreshDetalle(selectedCuestionario.id);
      }
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al ejecutar la accion');
      console.error(`[AdminCuestionarios] Error en accion "${type}":`, error);
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsConfirmLoading(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const openConfirm = (type: 'activar' | 'desactivar' | 'eliminar', cuestionario: Cuestionario) => {
    setConfirmAction({ type, cuestionario });
    setShowConfirmModal(true);
  };

  const handleVerDetalle = async (cuestionario: Cuestionario) => {
    try {
      const detalle = await adminService.getCuestionario(cuestionario.id);
      setSelectedCuestionario(detalle);
      setViewMode('detail');
    } catch {
      showToast({ message: 'Error al cargar detalle', type: 'error' });
    }
  };

  const refreshDetalle = async (id: number) => {
    try {
      const detalle = await adminService.getCuestionario(id);
      setSelectedCuestionario(detalle);
    } catch {
      showToast({ message: 'Error al actualizar detalle', type: 'error' });
    }
  };

  // ==========================================
  // Acciones del banco de preguntas (crear)
  // ==========================================

  const selectedCount = questionBank.filter((q) => q.selected).length;

  const handleToggleQuestion = (id: number) => {
    setQuestionBank((prev) => prev.map((q) => q.id === id ? { ...q, selected: !q.selected } : q));
  };

  const handleTogglePolaridad = (id: number) => {
    setQuestionBank((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, polaridad: q.polaridad === 'POSITIVA' ? 'NEGATIVA' : 'POSITIVA' } : q
      )
    );
  };

  /** Agrega pregunta personalizada (inline, no se guarda en el banco del backend) */
  const handleAddCustomQuestion = () => {
    if (newQuestionText.trim().length < 10) {
      showToast({ message: 'La pregunta debe tener al menos 10 caracteres', type: 'error' });
      return;
    }
    // Usamos ID negativo temporal para distinguir de preguntas reales del banco
    const tempId = -(Date.now());
    setQuestionBank((prev) => [
      ...prev,
      {
        id: tempId,
        texto: newQuestionText.trim(),
        polaridad: newQuestionPolaridad,
        tipo: 'SELECCION_ALUMNO' as const,
        max_elecciones: 3,
        orden: prev.length + 1,
        activa: true,
        selected: true,
      },
    ]);
    setNewQuestionText('');
    setNewQuestionPolaridad('POSITIVA');
    setShowNewQuestionForm(false);
    showToast({ message: 'Pregunta agregada al banco', type: 'success' });
  };

  const handleRemoveBankQuestion = (id: number) => {
    setQuestionBank((prev) => prev.filter((q) => q.id !== id));
  };

  // Drag & drop para reordenar
  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }
    const items = [...questionBank];
    const draggedItem = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItem);
    setQuestionBank(items);
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Crear cuestionario (con preguntas inline)
  const handleCrear = async () => {
    const errors: Record<string, string> = {};
    if (!titulo.trim()) errors.titulo = 'El titulo es obligatorio';
    if (selectedCount < 20) errors.preguntas = `Selecciona al menos 20 preguntas (tienes ${selectedCount})`;
    if (!periodoActivo && !selectedPeriodoId) errors.periodo = 'No hay periodo activo';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    const periodoId = selectedPeriodoId ?? periodoActivo?.id;
    try {
      const selected = questionBank.filter((q) => q.selected);
      // Preguntas del banco (id > 0) → se clonan vía preguntas_ids
      const bancoIds = selected.filter((q) => q.id > 0).map((q) => q.id);
      // Preguntas custom (id < 0) → se envían como preguntas inline
      const preguntasPayload: PreguntaInput[] = selected
        .filter((q) => q.id < 0)
        .map((q) => ({
          texto: q.texto,
          tipo: 'SELECCION_ALUMNO' as const,
          polaridad: q.polaridad,
          max_elecciones: 3,
        }));

      const res = await adminService.crearCuestionario({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        periodo: periodoId!,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        activo: false,
        preguntas_ids: bancoIds,
        preguntas: preguntasPayload.length > 0 ? preguntasPayload : undefined,
      });
      showToast({ message: 'Cuestionario creado correctamente.', type: 'success' });
      setTitulo('');
      setDescripcion('');
      setFormErrors({});
      setQuestionBank([]);
      const created = res.cuestionario;
      if (created) {
        setSelectedCuestionario(created);
        setViewMode('detail');
      } else {
        setViewMode('list');
      }
      await fetchCuestionarios(selectedPeriodoId ?? undefined);
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al crear el cuestionario');
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Carga preguntas del banco que NO estan en el cuestionario actual */
  const fetchMissingBankQuestions = useCallback(async () => {
    if (!selectedCuestionario) return;
    setIsBankDetailLoading(true);
    try {
      const res = await adminService.getBancoPreguntas();
      const allBank = res.preguntas || [];
      // Usar editablePreguntas si estamos en modo edicion, sino las del cuestionario
      const currentPreguntas = editablePreguntas || selectedCuestionario.preguntas || [];
      // IDs de preguntas ya en el cuestionario (basado en texto para evitar fallos por clonacion)
      const existingTexts = new Set(
        currentPreguntas.map((cp) => cp.pregunta.texto.toLowerCase().trim())
      );
      const missing = allBank.filter((bp) => !existingTexts.has(bp.texto.toLowerCase().trim()));
      setBankForDetail(missing);
      setSelectedBankIds(new Set());
    } catch {
      showToast({ message: 'Error al cargar banco de preguntas', type: 'error' });
      setBankForDetail([]);
    } finally {
      setIsBankDetailLoading(false);
    }
  }, [selectedCuestionario, editablePreguntas, showToast]);

  /** Agregar preguntas seleccionadas del banco al cuestionario — local durante edicion */
  const handleAddFromBank = () => {
    if (!selectedCuestionario || selectedBankIds.size === 0 || !editablePreguntas) return;
    // Obtener preguntas del banco seleccionadas
    const selectedBankQuestions = bankForDetail.filter((bp) => selectedBankIds.has(bp.id));
    if (selectedBankQuestions.length === 0) return;

    // Agregar a la copia local usando IDs negativos temporales para diferenciarlas
    let nextOrden = editablePreguntas.length;
    const newEntries: CuestionarioPregunta[] = selectedBankQuestions.map((bp) => {
      nextOrden += 1;
      return {
        id: -bp.id, // ID negativo temporal (se resolverá al confirmar)
        pregunta: {
          id: -bp.id,
          texto: bp.texto,
          tipo: bp.tipo || 'SELECCION_ALUMNO',
          polaridad: bp.polaridad as PreguntaPolaridad,
          max_elecciones: bp.max_elecciones || 3,
          descripcion: bp.descripcion,
          es_sociometrica: bp.es_sociometrica ?? true,
        },
        orden: nextOrden,
        _bankId: bp.id, // Guardar ID real del banco para asociar al confirmar
      } as CuestionarioPregunta & { _bankId: number };
    });

    setEditablePreguntas([...editablePreguntas, ...newEntries]);
    showToast({ message: `${selectedBankIds.size} pregunta(s) agregada(s) (sin guardar)`, type: 'info' });
    setSelectedBankIds(new Set());
    setAddMode(null);
    setShowAddForm(false);
  };

  /** Agregar par de preguntas personalizadas (positiva + negativa) — local durante edicion */
  const handleAddCustomPair = () => {
    if (!selectedCuestionario || !editablePreguntas) return;
    if (customPairText.trim().length < 10) {
      showToast({ message: 'La pregunta positiva debe tener al menos 10 caracteres', type: 'error' });
      return;
    }
    if (customPairTextNeg.trim().length < 10) {
      showToast({ message: 'La pregunta negativa debe tener al menos 10 caracteres', type: 'error' });
      return;
    }

    const baseOrder = editablePreguntas.length;
    // Usamos IDs negativos únicos para las preguntas temporales
    const tempIdPos = -(Date.now());
    const tempIdNeg = -(Date.now() + 1);

    const newPosEntry: CuestionarioPregunta = {
      id: tempIdPos,
      pregunta: {
        id: tempIdPos,
        texto: customPairText.trim(),
        tipo: 'SELECCION_ALUMNO',
        polaridad: 'POSITIVA',
        max_elecciones: 3,
        es_sociometrica: true,
      },
      orden: baseOrder + 1,
    };
    const newNegEntry: CuestionarioPregunta = {
      id: tempIdNeg,
      pregunta: {
        id: tempIdNeg,
        texto: customPairTextNeg.trim(),
        tipo: 'SELECCION_ALUMNO',
        polaridad: 'NEGATIVA',
        max_elecciones: 3,
        es_sociometrica: true,
      },
      orden: baseOrder + 2,
    };

    setEditablePreguntas([...editablePreguntas, newPosEntry, newNegEntry]);
    showToast({ message: 'Par de preguntas agregadas (sin guardar)', type: 'info' });
    setCustomPairText('');
    setCustomPairTextNeg('');
    setAddMode(null);
    setShowAddForm(false);
  };

  /** Editar texto de una pregunta — opera sobre la copia local, no va al backend */
  const handleSaveCopyEdit = (preguntaId: number) => {
    if (editCopyText.trim().length < 10) {
      showToast({ message: 'La pregunta debe tener al menos 10 caracteres', type: 'error' });
      return;
    }
    setEditablePreguntas((prev) => {
      if (!prev) return prev;
      return prev.map((cp) =>
        cp.pregunta.id === preguntaId
          ? { ...cp, pregunta: { ...cp.pregunta, texto: editCopyText.trim() } }
          : cp
      );
    });
    showToast({ message: 'Texto editado (sin guardar)', type: 'info' });
    setEditingCopyId(null);
    setEditCopyText('');
  };

  /** Cambiar la polaridad de una pregunta — opera sobre la copia local */
  const handleToggleCopyPolaridad = (preguntaId: number, currentPolaridad: string) => {
    const newPolaridad = currentPolaridad === 'POSITIVA' ? 'NEGATIVA' : 'POSITIVA';
    setEditablePreguntas((prev) => {
      if (!prev) return prev;
      return prev.map((cp) =>
        cp.pregunta.id === preguntaId
          ? { ...cp, pregunta: { ...cp.pregunta, polaridad: newPolaridad as 'POSITIVA' | 'NEGATIVA' } }
          : cp
      );
    });
    showToast({ message: `Polaridad cambiada a ${newPolaridad.toLowerCase()} (sin guardar)`, type: 'info' });
  };

  /** Drag & drop para reordenar preguntas en el detalle */
  const detailDragItem = useRef<number | null>(null);
  const detailDragOverItem = useRef<number | null>(null);
  const [detailDraggingIndex, setDetailDraggingIndex] = useState<number | null>(null);
  const [detailDragOverIndex, setDetailDragOverIndex] = useState<number | null>(null);

  const handleDetailDragStart = (index: number) => {
    detailDragItem.current = index;
    setDetailDraggingIndex(index);
  };
  const handleDetailDragEnter = (index: number) => {
    detailDragOverItem.current = index;
    setDetailDragOverIndex(index);
  };
  const handleDetailDragEnd = () => {
    if (
      detailDragItem.current === null ||
      detailDragOverItem.current === null ||
      detailDragItem.current === detailDragOverItem.current ||
      !editablePreguntas
    ) {
      detailDragItem.current = null;
      detailDragOverItem.current = null;
      setDetailDraggingIndex(null);
      setDetailDragOverIndex(null);
      return;
    }
    // Reordenar sobre la copia local
    const items = [...editablePreguntas];
    const draggedItem = items[detailDragItem.current];
    items.splice(detailDragItem.current, 1);
    items.splice(detailDragOverItem.current, 0, draggedItem);
    const reordered = items.map((item, idx) => ({ ...item, orden: idx + 1 }));
    setEditablePreguntas(reordered);
    detailDragItem.current = null;
    detailDragOverItem.current = null;
    setDetailDraggingIndex(null);
    setDetailDragOverIndex(null);
  };

  // Estado para confirmacion de eliminacion de pregunta individual
  const [pendingDeletePreguntaId, setPendingDeletePreguntaId] = useState<number | null>(null);

  /** Solicitar confirmacion antes de eliminar pregunta */
  const requestDeletePregunta = (preguntaId: number) => {
    setPendingDeletePreguntaId(preguntaId);
  };

  /** Confirmar y ejecutar la eliminacion — opera sobre la copia local, no va al backend */
  const confirmDeletePregunta = () => {
    if (pendingDeletePreguntaId === null) return;
    setEditablePreguntas((prev) => {
      if (!prev) return prev;
      return prev
        .filter((cp) => cp.pregunta.id !== pendingDeletePreguntaId)
        .map((cp, idx) => ({ ...cp, orden: idx + 1 }));
    });
    showToast({ message: 'Pregunta eliminada (sin guardar)', type: 'info' });
    setPendingDeletePreguntaId(null);
  };

  // Estado para modal de salida del modo edicion
  const [showEditExitConfirm, setShowEditExitConfirm] = useState(false);

  /**
   * Confirmar cambios — calcula diff entre editablePreguntas (local) y las preguntas
   * originales del backend (selectedCuestionario.preguntas), y envía solo los cambios.
   */
  const handleConfirmEdits = async () => {
    if (!selectedCuestionario || !editablePreguntas) return;
    setIsConfirmingEdits(true);
    try {
      const original = selectedCuestionario.preguntas || [];
      const edited = editablePreguntas;

      // 1) Detectar preguntas eliminadas (están en original pero no en editablePreguntas)
      const editedIds = new Set(edited.map((cp) => cp.pregunta.id));
      const deletedCps = original.filter((cp) => !editedIds.has(cp.pregunta.id));

      // 2) Detectar preguntas modificadas (texto o polaridad cambiados)
      const originalMap = new Map(original.map((cp) => [cp.pregunta.id, cp]));
      const modifiedCps = edited.filter((cp) => {
        const orig = originalMap.get(cp.pregunta.id);
        if (!orig) return false; // es nueva, no modificada
        return (
          orig.pregunta.texto !== cp.pregunta.texto ||
          orig.pregunta.polaridad !== cp.pregunta.polaridad
        );
      });

      // 3) Detectar preguntas nuevas (están en editablePreguntas pero no en original)
      const originalIds = new Set(original.map((cp) => cp.pregunta.id));
      const newCps = edited.filter((cp) => !originalIds.has(cp.pregunta.id));

      // Ejecutar eliminaciones
      for (const cp of deletedCps) {
        await adminService.removerPregunta(selectedCuestionario.id, cp.pregunta.id);
      }

      // Ejecutar modificaciones (texto y/o polaridad)
      for (const cp of modifiedCps) {
        const orig = originalMap.get(cp.pregunta.id)!;
        const payload: { texto?: string; polaridad?: PreguntaPolaridad } = {};
        if (orig.pregunta.texto !== cp.pregunta.texto) {
          payload.texto = cp.pregunta.texto;
        }
        if (orig.pregunta.polaridad !== cp.pregunta.polaridad) {
          payload.polaridad = cp.pregunta.polaridad as PreguntaPolaridad;
        }
        await adminService.editarCopiaPregunta(cp.pregunta.id, payload);
      }

      // Ejecutar adiciones de preguntas nuevas (las que vinieron del banco localmente)
      for (const cp of newCps) {
        // Si tiene _bankId es una pregunta asociada del banco, si no es custom
        const bankId = (cp as unknown as { _bankId?: number })._bankId;
        if (bankId) {
          await adminService.asociarPregunta(selectedCuestionario.id, { pregunta_id: bankId });
        } else {
          await adminService.agregarPregunta(selectedCuestionario.id, {
            texto: cp.pregunta.texto,
            tipo: cp.pregunta.tipo || 'SELECCION_ALUMNO',
            polaridad: (cp.pregunta.polaridad as PreguntaPolaridad) || 'POSITIVA',
            max_elecciones: cp.pregunta.max_elecciones || 3,
          });
        }
      }

      // Limpiar estado de edicion
      setIsEditingDetail(false);
      setShowAddForm(false);
      setAddMode(null);
      setEditingCopyId(null);
      setEditCopyText('');
      setEditablePreguntas(null);

      // Recargar desde backend para tener IDs reales y estado correcto
      await refreshDetalle(selectedCuestionario.id);
      await fetchCuestionarios(selectedPeriodoId ?? undefined);

      showToast({ message: 'Cambios guardados exitosamente', type: 'success' });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, 'Error al guardar los cambios');
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsConfirmingEdits(false);
    }
  };

  /**
   * Cancelar edicion — descarta la copia local y recarga el detalle real del backend.
   * Como NADA fue al backend durante la edicion, simplemente se descarta todo.
   */
  const handleCancelEditing = async () => {
    setIsEditingDetail(false);
    setShowAddForm(false);
    setAddMode(null);
    setEditingCopyId(null);
    setEditCopyText('');
    setShowEditExitConfirm(false);
    setEditablePreguntas(null);
    // Recargar desde el backend para asegurar que se muestra el estado real
    if (selectedCuestionario) {
      await refreshDetalle(selectedCuestionario.id);
    }
    showToast({ message: 'Cambios descartados', type: 'info' });
  };

  // ==========================================
  // RENDER: Crear cuestionario
  // ==========================================

  if (viewMode === 'create') {
    return (
      <div className="flex flex-col gap-5 h-full">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (hasUnsavedCreate) {
                  setShowExitConfirm(true);
                } else {
                  setTitulo(''); setDescripcion(''); setFormErrors({});
                  setQuestionBank([]);
                  setViewMode('list');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-black">Nuevo cuestionario</h2>
          </div>
          <button
            onClick={handleCrear}
            disabled={isSubmitting || selectedCount < 20}
            className="flex items-center gap-2 bg-[#0F7E3C] text-white px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? 'Creando...' : 'Crear cuestionario'}
          </button>
        </div>

        {/* Modal de confirmacion de salida */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExitConfirm(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-black">Cambios sin guardar</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Tienes cambios sin guardar en el cuestionario. Si sales ahora perderas todo el progreso.
                ¿Seguro que deseas salir?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Seguir editando
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setTitulo(''); setDescripcion(''); setFormErrors({});
                    setQuestionBank([]);
                    setViewMode('list');
                  }}
                  className="px-5 py-2.5 bg-[#7A1501] text-white rounded-lg text-sm font-bold hover:bg-[#7A1501]/90 transition-colors"
                >
                  Salir sin guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Titulo + Descripcion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Nombre del cuestionario <span className="text-[#7A1501]">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Cuestionario Sociometrico Febrero 2026"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all bg-white ${
                formErrors.titulo
                  ? 'border-[#7A1501] bg-red-50/50'
                  : 'border-gray-200 focus:border-[#0F7E3C] focus:ring-2 focus:ring-[#0F7E3C]/10'
              }`}
            />
            {formErrors.titulo && <span className="text-xs text-[#7A1501] font-medium">{formErrors.titulo}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Descripcion (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripcion breve del proposito"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0F7E3C] focus:ring-2 focus:ring-[#0F7E3C]/10 transition-all bg-white"
            />
          </div>
        </div>

        {/* Card de preguntas */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-[#F7F8FA] border border-[#0F7E3C]/40 rounded-lg shadow-md overflow-hidden">
            {/* Header de la card */}
            <div className="p-4 sm:p-5 border-b border-[#0F7E3C]/15">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F7E3C] mb-3">
                Preguntas del Sociograma
              </h3>
              <div className="text-sm sm:text-base text-black leading-relaxed space-y-1 mb-3">
                <p>1. Seleccione las preguntas que seran asignadas al sociograma. Debe elegir un <strong>minimo de 20 preguntas</strong> para proceder.</p>
                <p>2. Haga clic en las casillas de verificacion para agregar las preguntas deseadas.</p>
                <p>3. Puede reorganizar el orden de las preguntas utilizando el icono de lineas.</p>
              </div>

              {/* Nota destacada sobre la polaridad */}
              <div className="flex items-start gap-3 bg-[#0F7E3C]/8 border border-[#0F7E3C]/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <GreenBall size={16} />
                  <RedBall size={16} />
                </div>
                <p className="text-sm font-semibold text-[#06322B] leading-snug">
                  El circulo <span className="text-[#0F7E3C]">verde</span> indica puntaje POSITIVO y el{' '}
                  <span className="text-[#7A1501]">rojo</span> puntaje NEGATIVO.{' '}
                  <span className="underline decoration-dotted cursor-default">
                    Haz clic en el circulo para cambiar la polaridad de la pregunta.
                  </span>
                </p>
              </div>

              {/* Contador y boton agregar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${selectedCount >= 20 ? 'text-[#0F7E3C]' : 'text-[#7A1501]'}`}>
                    {selectedCount} / {questionBank.length} seleccionadas
                  </span>
                  {selectedCount < 20 && (
                    <span className="text-xs text-[#7A1501] font-medium">
                      (faltan {20 - selectedCount} mas)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#0F7E3C] hover:text-[#0a6630] transition-colors"
                >
                  <Plus size={16} />
                  Crear pregunta personalizada
                </button>
              </div>

              {formErrors.preguntas && (
                <p className="text-xs text-[#7A1501] font-medium mt-2">{formErrors.preguntas}</p>
              )}
            </div>

            {/* Formulario nueva pregunta personalizada */}
            {showNewQuestionForm && (
              <div className="px-4 sm:px-5 py-4 bg-white/60 border-b border-[#0F7E3C]/15">
                <div className="flex flex-col gap-3 max-w-3xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Texto de la pregunta *</label>
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Ej: ¿A quien elegirias para coordinar un evento?"
                      className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0F7E3C] focus:ring-2 focus:ring-[#0F7E3C]/10 transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Polaridad</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewQuestionPolaridad('POSITIVA')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            newQuestionPolaridad === 'POSITIVA'
                              ? 'bg-[#0b9624]/10 border-[#0b9624] text-[#0b9624]'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <GreenBall size={12} /> Positiva
                        </button>
                        <button
                          onClick={() => setNewQuestionPolaridad('NEGATIVA')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            newQuestionPolaridad === 'NEGATIVA'
                              ? 'bg-[#7A1501]/10 border-[#7A1501] text-[#7A1501]'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <RedBall size={12} /> Negativa
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowNewQuestionForm(false); setNewQuestionText(''); }}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddCustomQuestion}
                        disabled={newQuestionText.trim().length < 10}
                        className="flex items-center gap-1.5 bg-[#0F7E3C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de preguntas */}
            <div className="flex flex-col p-3 sm:p-4">
              {isBankLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-[#0F7E3C]" size={28} />
                  <span className="ml-2 text-sm text-gray-500">Cargando banco de preguntas…</span>
                </div>
              ) : questionBank.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No hay preguntas en el banco. Agrega una pregunta personalizada.
                </div>
              ) : questionBank.map((q, index) => {
                const isNeg = q.polaridad === 'NEGATIVA';
                const num = index + 1;
                const isDragging = draggingIndex === index;
                const isDragTarget = dragOverIndex === index && draggingIndex !== index;

                // Borde de la card segun polaridad (solo si esta seleccionada)
                const cardBorderColor = q.selected
                  ? isNeg
                    ? 'border-[#7A1501] shadow-[0_4px_8px_rgba(122,21,1,0.12)]'
                    : 'border-[#0B9624] shadow-[0_4px_8px_rgba(0,0,0,0.10)]'
                  : isNeg
                    ? 'border-[#7A1501]/30 shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
                    : 'border-[#0F7E3C]/30 shadow-[0_2px_4px_rgba(0,0,0,0.06)]';

                return (
                  <div key={q.id}>
                    {/* Espaciador que se abre cuando este item es el destino del drag */}
                    <div
                      className="transition-all duration-200 overflow-hidden"
                      style={{ height: isDragTarget ? '52px' : '0px', marginBottom: isDragTarget ? '8px' : '0px' }}
                    >
                      {isDragTarget && (
                        <div className="h-full rounded-lg border-2 border-dashed border-[#0F7E3C]/50 bg-[#0F7E3C]/5 flex items-center justify-center">
                          <span className="text-xs font-medium text-[#0F7E3C]/60">Soltar aqui</span>
                        </div>
                      )}
                    </div>

                    {/* Item de pregunta */}
                    <div
                      className={`flex items-center gap-2 sm:gap-3 rounded-lg mb-2 transition-all duration-200 ${
                        isDragging
                          ? 'opacity-40 scale-[0.97] cursor-grabbing'
                          : 'opacity-100 scale-100'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {/* Drag handle */}
                      <div className={`shrink-0 cursor-grab active:cursor-grabbing hidden sm:block transition-colors ${
                        isDragTarget ? 'text-[#0F7E3C]' : 'text-gray-300 hover:text-gray-400'
                      }`}>
                        <GripVertical size={20} />
                      </div>

                      {/* Checkbox (siempre verde) */}
                      <button
                        onClick={() => handleToggleQuestion(q.id)}
                        className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                          q.selected
                            ? 'bg-[#0B9624] border-[#0B9624] text-white'
                            : 'border-[#0F7E3C]/50 bg-white hover:border-[#0F7E3C] hover:bg-[#0F7E3C]/5'
                        }`}
                      >
                        {q.selected && <Check size={18} strokeWidth={3} />}
                      </button>

                      {/* Card de pregunta — borde segun polaridad */}
                      <div
                        className={`flex-1 p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                          q.selected ? 'bg-white' : 'bg-white/60'
                        } ${cardBorderColor}`}
                      >
                        <p className={`text-base sm:text-xl font-bold mb-0.5 transition-colors duration-300 ${
                          isNeg ? 'text-[#7A1501]' : 'text-[#0F7E3C]'
                        }`}>
                          Pregunta {num}.
                        </p>
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleTogglePolaridad(q.id)}
                            className="shrink-0 mt-1 cursor-pointer transition-transform duration-200 hover:scale-125 active:scale-95"
                            title="Clic para cambiar polaridad"
                          >
                            <span className="block transition-all duration-300">
                              {isNeg ? <RedBall size={20} /> : <GreenBall size={20} />}
                            </span>
                          </button>
                          <p className="text-sm sm:text-base font-semibold text-[#245C52] leading-snug">
                            {q.texto}
                          </p>
                        </div>
                      </div>

                      {/* Eliminar (solo preguntas custom) */}
                      {q.id < 0 && (
                        <button
                          onClick={() => handleRemoveBankQuestion(q.id)}
                          className="shrink-0 p-1.5 text-[#7A1501] hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar pregunta personalizada"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: Previsualizacion
  // ==========================================

  if (viewMode === 'preview' && selectedCuestionario) {
    return (
      <PreviewView
        cuestionario={selectedCuestionario}
        onBack={() => setViewMode('detail')}
      />
    );
  }

  // ==========================================
  // RENDER: Detalle + gestion de preguntas
  // ==========================================

  if (viewMode === 'detail' && selectedCuestionario) {
    const canEdit = !selectedCuestionario.activo && selectedCuestionario.total_respuestas === 0;
    const isEditable = canEdit && isEditingDetail;

    return (
      <>
        {showConfirmModal && confirmAction && (
          <ConfirmModal
            action={confirmAction}
            isLoading={isConfirmLoading}
            onConfirm={handleConfirmAction}
            onCancel={() => { if (!isConfirmLoading) { setShowConfirmModal(false); setConfirmAction(null); } }}
          />
        )}

        {/* Modal de confirmacion para eliminar pregunta individual */}
        {pendingDeletePreguntaId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPendingDeletePreguntaId(null)}>
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={20} className="text-[#7A1501]" />
                </div>
                <div>
                  <h3 className="font-bold text-black">Eliminar pregunta</h3>
                  <p className="text-sm text-gray-500">Esta accion no se puede deshacer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                ¿Estas seguro de que deseas eliminar esta pregunta del cuestionario?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPendingDeletePreguntaId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeletePregunta}
                  className="flex items-center gap-1.5 bg-[#7A1501] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#7A1501]/90 transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmacion para cancelar edicion */}
        {showEditExitConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditExitConfirm(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black">Descartar cambios</h3>
                  <p className="text-sm text-gray-500">Los cambios no se han guardado</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                ¿Estas seguro de que deseas salir del modo edicion? Todos los cambios pendientes (eliminaciones, ediciones de texto y polaridad) se descartaran.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditExitConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Seguir editando
                </button>
                <button
                  onClick={handleCancelEditing}
                  className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="flex flex-col gap-5 h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isEditingDetail) {
                  setShowEditExitConfirm(true);
                } else {
                  setSelectedCuestionario(null); setShowAddForm(false); setIsEditingDetail(false); setViewMode('list');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-black truncate">{selectedCuestionario.titulo}</h2>
                <StatusBadge activo={selectedCuestionario.activo} />
              </div>
              {selectedCuestionario.descripcion && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{selectedCuestionario.descripcion}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-11 sm:ml-0">
            {/* Previsualizar — oculto en modo edicion */}
            {!isEditingDetail && (
              <button
                onClick={() => setViewMode('preview')}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="Previsualizar cuestionario"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Previsualizar</span>
              </button>
            )}

            {/* Activar / Desactivar — oculto en modo edicion */}
            {!isEditingDetail && (
              <>
                {selectedCuestionario.activo ? (
                  <button
                    onClick={() => openConfirm('desactivar', selectedCuestionario)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    <PowerOff size={16} />
                    <span className="hidden sm:inline">Desactivar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openConfirm('activar', selectedCuestionario)}
                    disabled={selectedCuestionario.total_preguntas === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0F7E3C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedCuestionario.total_preguntas === 0 ? 'Agrega al menos una pregunta' : ''}
                  >
                    <Power size={16} />
                    <span className="hidden sm:inline">Activar</span>
                  </button>
                )}
              </>
            )}

            {/* Editar (solo borrador sin respuestas, fuera de modo edicion) */}
            {canEdit && !isEditingDetail && (
              <button
                onClick={() => {
                  // Crear copia local de preguntas para editar sin tocar el backend
                  if (selectedCuestionario?.preguntas) {
                    setEditablePreguntas(
                      selectedCuestionario.preguntas.map((cp) => ({
                        ...cp,
                        pregunta: { ...cp.pregunta },
                      }))
                    );
                  }
                  setIsEditingDetail(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                title="Editar cuestionario"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {/* En modo edicion: Confirmar cambios + Cancelar cambios */}
            {isEditingDetail && (
              <>
                <button
                  disabled={isConfirmingEdits}
                  onClick={handleConfirmEdits}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0F7E3C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirmingEdits ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span className="hidden sm:inline">{isConfirmingEdits ? 'Guardando...' : 'Confirmar cambios'}</span>
                </button>
                <button
                  onClick={handleCancelEditing}
                  disabled={isConfirmingEdits}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#7A1501] text-white rounded-lg text-sm font-semibold hover:bg-[#5c1001] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Cancelar cambios</span>
                </button>
              </>
            )}

            {/* Eliminar — oculto en modo edicion */}
            {!isEditingDetail && selectedCuestionario.total_respuestas === 0 && (
              <button
                onClick={() => openConfirm('eliminar', selectedCuestionario)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#7A1501] text-white rounded-lg text-sm font-semibold hover:bg-[#7A1501]/90 transition-colors"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de estadisticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 ml-11 sm:ml-0">
          <MiniInfoCard
            label="Cantidad de preguntas"
            value={isEditingDetail && editablePreguntas ? editablePreguntas.length : selectedCuestionario.total_preguntas}
            icon={<FileText size={16} className="text-[#0F7E3C]" />}
          />
          <MiniInfoCard
            label="Cantidad de respuestas realizadas"
            value={selectedCuestionario.total_respuestas}
            icon={<Check size={16} className={selectedCuestionario.activo ? 'text-[#0F7E3C]' : 'text-gray-300'} />}
            locked={!selectedCuestionario.activo}
          />
          <MiniInfoCard
            label="Grupos asignados"
            value={selectedCuestionario.total_grupos}
            icon={<Users size={16} className="text-[#0F7E3C]" />}
          />
          <MiniInfoCard
            label="Periodo"
            value={selectedCuestionario.periodo_nombre || selectedCuestionario.periodo_codigo || '-'}
            isText
            icon={<Calendar size={16} className="text-[#0F7E3C]" />}
          />
        </div>

        {/* Aviso si esta activo */}
        {selectedCuestionario.activo && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 ml-11 sm:ml-0">
            <Lock size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Este cuestionario esta activo y visible para los tutores. No se puede editar mientras este activo.
            </p>
          </div>
        )}

        {/* Lista de preguntas */}
        <div className="flex-1 overflow-y-auto ml-11 sm:ml-0">
          <div className="bg-white border border-[#0F7E3C]/20 rounded-xl overflow-hidden">
            {/* Header preguntas */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-black text-sm">
                Preguntas del sociograma ({(isEditingDetail && editablePreguntas ? editablePreguntas.length : selectedCuestionario.preguntas?.length) ?? 0})
              </h3>
              {isEditable && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#0F7E3C] hover:text-[#0a6630] transition-colors"
                >
                  <Plus size={16} />
                  Agregar pregunta
                </button>
              )}
            </div>

            {/* Panel para agregar preguntas */}
            {showAddForm && isEditable && (
              <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100">
                {/* Selector de modo */}
                {addMode === null || addMode === 'select' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-gray-700">¿Como deseas agregar preguntas?</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => { setAddMode('bank'); fetchMissingBankQuestions(); }}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#0F7E3C] rounded-lg text-sm font-semibold text-[#0F7E3C] hover:bg-[#0F7E3C]/5 transition-colors"
                      >
                        <FileText size={16} />
                        Desde el banco de preguntas
                      </button>
                      <button
                        onClick={() => setAddMode('custom')}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-amber-500 rounded-lg text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Plus size={16} />
                        Crear par personalizado
                      </button>
                    </div>
                    <button
                      onClick={() => { setShowAddForm(false); setAddMode(null); }}
                      className="self-start text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : addMode === 'bank' ? (
                  /* Modo banco: seleccionar preguntas faltantes */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Preguntas disponibles del banco</p>
                      <button
                        onClick={() => { setAddMode('select'); setSelectedBankIds(new Set()); }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Volver
                      </button>
                    </div>

                    {isBankDetailLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0F7E3C] border-t-transparent" />
                      </div>
                    ) : bankForDetail.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Todas las preguntas del banco ya estan en este cuestionario.</p>
                    ) : (
                      <>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {bankForDetail.map((bp) => {
                            const isSelected = selectedBankIds.has(bp.id);
                            const bpNeg = bp.polaridad === 'NEGATIVA';
                            return (
                              <label
                                key={bp.id}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#0F7E3C]/5' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const next = new Set(selectedBankIds);
                                    if (isSelected) next.delete(bp.id);
                                    else next.add(bp.id);
                                    setSelectedBankIds(next);
                                  }}
                                  className="accent-[#0F7E3C] w-4 h-4"
                                />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {bpNeg ? <RedBall size={12} /> : <GreenBall size={12} />}
                                  <span className="text-sm text-gray-800 truncate">{bp.texto}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase shrink-0 ${bpNeg ? 'text-[#7A1501]' : 'text-[#0B9624]'}`}>
                                  {bp.polaridad}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-gray-400">{selectedBankIds.size} seleccionadas</span>
                          <button
                            onClick={handleAddFromBank}
                            disabled={selectedBankIds.size === 0 || isAddingPregunta}
                            className="flex items-center gap-1.5 bg-[#0F7E3C] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={14} />
                            {isAddingPregunta ? 'Agregando...' : `Agregar ${selectedBankIds.size > 0 ? `(${selectedBankIds.size})` : ''}`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Modo personalizado: crear par positiva + negativa */
                  <div className="flex flex-col gap-3 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Crear par de preguntas (positiva + negativa)</p>
                      <button
                        onClick={() => { setAddMode('select'); setCustomPairText(''); setCustomPairTextNeg(''); }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Volver
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#0B9624] flex items-center gap-1.5">
                          <GreenBall size={10} /> Pregunta positiva *
                        </label>
                        <input
                          type="text"
                          value={customPairText}
                          onChange={(e) => setCustomPairText(e.target.value)}
                          placeholder="Ej: ¿A quien elegirias para realizar un proyecto?"
                          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0B9624] focus:ring-2 focus:ring-[#0B9624]/10 transition-all"
                        />
                        {customPairText.length > 0 && customPairText.trim().length < 10 && (
                          <p className="text-[11px] text-red-500">Minimo 10 caracteres</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#7A1501] flex items-center gap-1.5">
                          <RedBall size={10} /> Pregunta negativa *
                        </label>
                        <input
                          type="text"
                          value={customPairTextNeg}
                          onChange={(e) => setCustomPairTextNeg(e.target.value)}
                          placeholder="Ej: ¿A quien NO elegirias para realizar un proyecto?"
                          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7A1501] focus:ring-2 focus:ring-[#7A1501]/10 transition-all"
                        />
                        {customPairTextNeg.length > 0 && customPairTextNeg.trim().length < 10 && (
                          <p className="text-[11px] text-red-500">Minimo 10 caracteres</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => { setShowAddForm(false); setAddMode(null); setCustomPairText(''); setCustomPairTextNeg(''); }}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddCustomPair}
                        disabled={isAddingPregunta || customPairText.trim().length < 10 || customPairTextNeg.trim().length < 10}
                        className="flex items-center gap-1.5 bg-[#0F7E3C] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                        {isAddingPregunta ? 'Agregando...' : 'Agregar par'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista de preguntas — mismo estilo visual que el banco de preguntas */}
            <div className="flex flex-col gap-2 p-3 sm:p-4 pb-6">
              {(() => {
                // En modo edicion usamos la copia local, fuera de edicion usamos las del backend
                const displayPreguntas = isEditingDetail && editablePreguntas
                  ? editablePreguntas
                  : selectedCuestionario.preguntas;
                return displayPreguntas && displayPreguntas.length > 0 ? (
                  displayPreguntas.map((cp, idx) => (
                    <DetailQuestionRow
                      key={cp.pregunta.id}
                      cp={cp}
                      index={idx}
                      isNegative={cp.pregunta.polaridad === 'NEGATIVA'}
                      canDelete={isEditable}
                      canDrag={isEditable}
                      canEdit={isEditable}
                      isEditingText={editingCopyId === cp.pregunta.id}
                      editText={editingCopyId === cp.pregunta.id ? editCopyText : ''}
                      isDragging={detailDraggingIndex === idx}
                      isDragTarget={detailDragOverIndex === idx && detailDraggingIndex !== idx}
                      onStartEdit={() => { setEditingCopyId(cp.pregunta.id); setEditCopyText(cp.pregunta.texto); }}
                      onCancelEdit={() => { setEditingCopyId(null); setEditCopyText(''); }}
                      onSaveEdit={() => handleSaveCopyEdit(cp.pregunta.id)}
                      onEditTextChange={setEditCopyText}
                      onDelete={requestDeletePregunta}
                      onTogglePolaridad={() => handleToggleCopyPolaridad(cp.pregunta.id, cp.pregunta.polaridad || 'POSITIVA')}
                      onDragStart={handleDetailDragStart}
                      onDragEnter={handleDetailDragEnter}
                      onDragEnd={handleDetailDragEnd}
                    />
                  ))
                ) : (
                  <div className="px-5 py-10 text-center">
                    <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">No hay preguntas todavia</p>
                    {isEditable && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 text-sm font-semibold text-[#0F7E3C] hover:underline"
                      >
                        Agregar la primera pregunta
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // ==========================================
  // RENDER: Lista de cuestionarios
  // ==========================================
  return (
    <>
      {showConfirmModal && confirmAction && (
        <ConfirmModal
          action={confirmAction}
          isLoading={isConfirmLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => { if (!isConfirmLoading) { setShowConfirmModal(false); setConfirmAction(null); } }}
        />
      )}

      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Cuestionarios</h2>
          <button
            onClick={() => setViewMode('create')}
            className="flex items-center gap-2 bg-[#0F7E3C] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nuevo cuestionario
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0F7E3C] border-t-transparent" />
            </div>
          ) : cuestionarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F7E3C]/10 flex items-center justify-center">
                <FileText size={28} className="text-[#0F7E3C]" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-medium mb-1">No hay cuestionarios creados</p>
                <p className="text-sm text-gray-400">Crea un cuestionario y agrega las preguntas del sociograma</p>
              </div>
              <button
                onClick={() => setViewMode('create')}
                className="flex items-center gap-2 bg-[#0F7E3C] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a6630] transition-colors"
              >
                <Plus size={16} />
                Crear cuestionario
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {cuestionarios.map((c) => (
                <CuestionarioListCard
                  key={c.id}
                  cuestionario={c}
                  onView={handleVerDetalle}
                  onActivar={(q) => openConfirm('activar', q)}
                  onDesactivar={(q) => openConfirm('desactivar', q)}
                  onEliminar={(q) => openConfirm('eliminar', q)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==========================================
// Componentes auxiliares
// ==========================================

// ---- Pregunta en la vista de detalle ----

interface DetailQuestionRowProps {
  cp: CuestionarioPregunta;
  index: number;
  isNegative: boolean;
  canDelete: boolean;
  canDrag: boolean;
  canEdit: boolean;
  isEditingText: boolean;
  editText: string;
  isDragging: boolean;
  isDragTarget: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditTextChange: (text: string) => void;
  onDelete: (id: number) => void;
  onTogglePolaridad: () => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

function DetailQuestionRow({
  cp, index, isNegative, canDelete, canDrag, canEdit,
  isEditingText, editText, isDragging, isDragTarget,
  onStartEdit, onCancelEdit, onSaveEdit, onEditTextChange,
  onDelete, onTogglePolaridad, onDragStart, onDragEnter, onDragEnd
}: DetailQuestionRowProps) {
  const isPos = !isNegative;

  return (
    <div>
      {/* Espaciador animado — aparece cuando este item es destino del drag */}
      {canDrag && (
        <div
          className="transition-all duration-200 overflow-hidden"
          style={{ height: isDragTarget ? '52px' : '0px', marginBottom: isDragTarget ? '8px' : '0px' }}
        >
          {isDragTarget && (
            <div className="h-full rounded-lg border-2 border-dashed border-[#0F7E3C]/50 bg-[#0F7E3C]/5 flex items-center justify-center">
              <span className="text-xs font-medium text-[#0F7E3C]/60">Soltar aqui</span>
            </div>
          )}
        </div>
      )}

    <div
      className={`flex items-start gap-2 sm:gap-3 py-1 group transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-[0.97] cursor-grabbing' : 'opacity-100 scale-100'
      }`}
      draggable={canDrag}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Drag handle */}
      {canDrag && (
        <div className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors mt-3">
          <GripVertical size={20} />
        </div>
      )}

      {/* Card de pregunta — mismo estilo que AdminBancoPreguntasView */}
      <div
        className={`flex-1 bg-white rounded-xl border-2 transition-all duration-150 ${
          isEditingText
            ? 'border-[#0B5A4A] shadow-[0_4px_12px_rgba(11,90,74,0.12)]'
            : isPos
              ? 'border-[#0B9624]/30 hover:border-[#0B9624]/60'
              : 'border-[#7A1501]/30 hover:border-[#7A1501]/60'
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-3 sm:p-4">
          {/* Numero + bolita */}
          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
            <span className={`text-xs font-bold tabular-nums ${isPos ? 'text-[#0B9624]' : 'text-[#7A1501]'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
            {canEdit ? (
              <button
                onClick={onTogglePolaridad}
                className="transition-transform duration-200 hover:scale-125 active:scale-95"
                title={`Polaridad: ${isPos ? 'POSITIVA' : 'NEGATIVA'}. Clic para cambiar`}
              >
                {isPos ? <GreenBall size={20} /> : <RedBall size={20} />}
              </button>
            ) : (
              isPos ? <GreenBall size={20} /> : <RedBall size={20} />
            )}
          </div>

          {/* Texto o campo de edicion */}
          <div className="flex-1 min-w-0">
            {isEditingText ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => onEditTextChange(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0B5A4A] bg-white"
                />
                {editText.trim().length > 0 && editText.trim().length < 10 && (
                  <p className="text-[11px] text-red-500">Minimo 10 caracteres</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onSaveEdit}
                    disabled={editText.trim().length < 10}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5A4A] text-white text-xs font-semibold rounded-lg hover:bg-[#084438] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <>
                <p className="text-sm font-medium text-gray-800 leading-snug wrap-break-word">
                  {cp.pregunta.texto}
                </p>
                {cp.pregunta.descripcion && (
                  <p className="text-xs text-gray-500 mt-1">
                    {cp.pregunta.descripcion} | Max. elecciones: {cp.pregunta.max_elecciones}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Acciones editar / eliminar */}
          {canEdit && !isEditingText && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onStartEdit}
                className="p-1.5 text-gray-400 hover:text-[#0B5A4A] hover:bg-[#0B5A4A]/5 rounded-lg transition-colors"
                title="Editar pregunta"
              >
                <Pencil size={15} />
              </button>
              {canDelete && (
                <button
                  onClick={() => onDelete(cp.pregunta.id)}
                  className="p-1.5 text-gray-400 hover:text-[#7A1501] hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar pregunta"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Badge de polaridad */}
        {!isEditingText && (
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
    </div>
    </div>
  );
}

// ---- Tarjeta de cuestionario en la lista ----

interface CuestionarioListCardProps {
  cuestionario: Cuestionario;
  onView: (c: Cuestionario) => void;
  onActivar: (c: Cuestionario) => void;
  onDesactivar: (c: Cuestionario) => void;
  onEliminar: (c: Cuestionario) => void;
}

function CuestionarioListCard({ cuestionario, onView, onActivar, onDesactivar, onEliminar }: CuestionarioListCardProps) {
  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-sm cursor-pointer ${
        cuestionario.activo ? 'border-[#0F7E3C] shadow-sm' : 'border-gray-200'
      }`}
      onClick={() => onView(cuestionario)}
    >
      {/* Barra de estado superior */}
      <div className={`h-1 ${cuestionario.activo ? 'bg-[#0F7E3C]' : 'bg-gray-200'}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold text-black truncate">{cuestionario.titulo}</h3>
              <StatusBadge activo={cuestionario.activo} />
            </div>
            {cuestionario.descripcion && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-1">{cuestionario.descripcion}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{cuestionario.total_preguntas} preguntas</span>
              <span>{cuestionario.total_respuestas} respuestas</span>
              <span>{cuestionario.total_grupos} grupos</span>
              <span>{cuestionario.periodo_nombre || `Periodo ${cuestionario.periodo}`}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onView(cuestionario)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ver detalle"
            >
              <Edit3 size={16} className="text-gray-500" />
            </button>

            {cuestionario.activo ? (
              <button
                onClick={() => onDesactivar(cuestionario)}
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                title="Desactivar"
              >
                <PowerOff size={16} className="text-amber-600" />
              </button>
            ) : (
              <button
                onClick={() => onActivar(cuestionario)}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                title="Activar"
              >
                <Power size={16} className="text-[#0F7E3C]" />
              </button>
            )}

            {cuestionario.total_respuestas === 0 && (
              <button
                onClick={() => onEliminar(cuestionario)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} className="text-[#7A1501]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Badge de estado ----

function StatusBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="shrink-0 bg-[#0F7E3C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Activo
    </span>
  ) : (
    <span className="shrink-0 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Borrador
    </span>
  );
}

// ---- Mini info card ----

interface MiniInfoCardProps {
  label: string;
  value: number | string;
  isText?: boolean;
  icon?: React.ReactNode;
  locked?: boolean;
}

function MiniInfoCard({ label, value, isText, icon, locked }: MiniInfoCardProps) {
  return (
    <div className={`relative flex items-center gap-3 border rounded-lg px-3 py-2.5 transition-colors ${
      locked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
    }`}>
      {icon && (
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          locked ? 'bg-gray-100' : 'bg-[#0F7E3C]/8'
        }`}>
          {locked ? <Lock size={14} className="text-gray-400" /> : icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold leading-tight">{label}</p>
        {locked ? (
          <p className="text-sm font-bold text-gray-300 select-none">--</p>
        ) : (
          <p className={`font-bold text-black leading-tight ${isText ? 'text-xs truncate' : 'text-lg'}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Modal de confirmacion ----

interface ConfirmModalProps {
  action: { type: 'activar' | 'desactivar' | 'eliminar'; cuestionario: Cuestionario };
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ action, isLoading, onConfirm, onCancel }: ConfirmModalProps) {
  const titles = {
    activar: 'Activar cuestionario',
    desactivar: 'Desactivar cuestionario',
    eliminar: 'Eliminar cuestionario',
  };

  const descriptions = {
    activar: (
      <>
        Al activar <strong>"{action.cuestionario.titulo}"</strong> los tutores podran verlo y asignarlo
        a sus grupos.
        <strong> Una vez activo no se podra editar.</strong>
      </>
    ),
    desactivar: (
      <>
        Desactivar <strong>"{action.cuestionario.titulo}"</strong>. Los tutores dejaran de verlo
        y podras editarlo de nuevo.
      </>
    ),
    eliminar: (
      <>
        Eliminar <strong>"{action.cuestionario.titulo}"</strong> y todas sus preguntas.
        Esta accion no se puede deshacer.
      </>
    ),
  };

  const buttonStyles = {
    activar: 'bg-[#0F7E3C] hover:bg-[#0a6630]',
    desactivar: 'bg-amber-600 hover:bg-amber-700',
    eliminar: 'bg-[#7A1501] hover:bg-[#7A1501]/90',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            action.type === 'eliminar' ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <AlertTriangle size={20} className={action.type === 'eliminar' ? 'text-[#7A1501]' : 'text-amber-600'} />
          </div>
          <h3 className="text-lg font-bold text-black">{titles[action.type]}</h3>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {descriptions[action.type]}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${buttonStyles[action.type]}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading
              ? (action.type === 'activar' ? 'Activando...' : action.type === 'desactivar' ? 'Desactivando...' : 'Eliminando...')
              : action.type.charAt(0).toUpperCase() + action.type.slice(1)
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Selector de periodo para el Topbar ----

interface PeriodoSelectorProps {
  periodos: Period[];
  selectedId: number | null;
  periodoActivo: Period | null;
  onChange: (id: number | null) => void;
}

function PeriodoSelector({ periodos, selectedId, periodoActivo, onChange }: PeriodoSelectorProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 border border-[#0F7E3C]/50 rounded-lg px-3 py-1.5 sm:py-2 shadow-sm bg-white">
        <span className="text-xs sm:text-sm font-semibold text-gray-600 shrink-0">Periodo:</span>
        <select
          value={selectedId ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="text-xs sm:text-sm font-bold text-black bg-transparent outline-none cursor-pointer border-none pr-1"
        >
          {periodos.length === 0 && !periodoActivo && (
            <option value="">Sin periodos</option>
          )}
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.activo ? '(Activo)' : ''}
            </option>
          ))}
        </select>
      </div>
      {periodoActivo && selectedId !== periodoActivo.id && (
        <button
          onClick={() => onChange(periodoActivo.id)}
          className="text-xs font-medium text-[#0F7E3C] hover:underline whitespace-nowrap"
        >
          Ir al activo
        </button>
      )}
    </div>
  );
}

// ==========================================
// Vista de Previsualizacion (estilo Figma real)
// ==========================================

/** 40 alumnos ficticios para la previsualizacion */
const PREVIEW_STUDENTS: Student[] = [
  { id: '1', name: 'Jesus Aguilar Perez Osorno' },
  { id: '2', name: 'Ana Maria Martinez Sanchez' },
  { id: '3', name: 'Carlos Eduardo Ramirez Lopez' },
  { id: '4', name: 'Luis Fernando Hernandez Garcia' },
  { id: '5', name: 'Maria Guadalupe Gonzalez Torres' },
  { id: '6', name: 'Pedro Antonio Lopez Ramirez' },
  { id: '7', name: 'Sofia Isabella Diaz Morales' },
  { id: '8', name: 'Jose Manuel Garcia Ruiz' },
  { id: '9', name: 'Laura Patricia Fernandez Castro' },
  { id: '10', name: 'Miguel Angel Sanchez Perez' },
  { id: '11', name: 'Carmen Elena Rodriguez Silva' },
  { id: '12', name: 'Roberto Carlos Jimenez Ortiz' },
  { id: '13', name: 'Patricia Lorena Torres Vega' },
  { id: '14', name: 'Fernando Javier Alvarez Rojas' },
  { id: '15', name: 'Isabel Cristina Romero Navarro' },
  { id: '16', name: 'Andres Felipe Munoz Castillo' },
  { id: '17', name: 'Gabriela Alejandra Cruz Mendoza' },
  { id: '18', name: 'Diego Armando Vargas Herrera' },
  { id: '19', name: 'Valentina Maria Reyes Campos' },
  { id: '20', name: 'Ricardo Alberto Flores Guerrero' },
  { id: '21', name: 'Daniela Sofia Medina Aguilar' },
  { id: '22', name: 'Javier Enrique Molina Rios' },
  { id: '23', name: 'Andrea Carolina Gutierrez Leon' },
  { id: '24', name: 'Alejandro David Castro Ramos' },
  { id: '25', name: 'Natalia Fernanda Ortiz Delgado' },
  { id: '26', name: 'Emilio Sebastian Pena Carrillo' },
  { id: '27', name: 'Carolina Victoria Vazquez Salazar' },
  { id: '28', name: 'Sergio Ivan Mendez Cortes' },
  { id: '29', name: 'Paola Andrea Ruiz Montero' },
  { id: '30', name: 'Raul Eduardo Dominguez Paredes' },
  { id: '31', name: 'Lucia Fernanda Herrera Espinoza' },
  { id: '32', name: 'Omar Alejandro Moreno Fuentes' },
  { id: '33', name: 'Diana Marcela Soto Villanueva' },
  { id: '34', name: 'Hector Manuel Rios Sandoval' },
  { id: '35', name: 'Monica Patricia Duran Cabrera' },
  { id: '36', name: 'Eduardo Jose Estrada Pineda' },
  { id: '37', name: 'Rosa Maria Juarez Contreras' },
  { id: '38', name: 'Victor Hugo Cervantes Ibarra' },
  { id: '39', name: 'Mariana Isabela Lara Montes' },
  { id: '40', name: 'Jorge Luis Acosta Velazquez' },
];

interface PreviewViewProps {
  cuestionario: Cuestionario;
  onBack: () => void;
}

function PreviewView({ cuestionario, onBack }: PreviewViewProps) {
  // Convertir preguntas del cuestionario al formato del formulario de estudiante
  const questions: Question[] = (cuestionario.preguntas || []).map((cp) => ({
    id: cp.pregunta.id,
    text: cp.pregunta.texto,
    type: cp.pregunta.polaridad === 'NEGATIVA' ? 'negative' as const : 'positive' as const,
  }));

  // Estado local para las respuestas de la previsualizacion
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>(() => {
    const initial: Record<number, QuestionAnswer> = {};
    questions.forEach((q) => {
      initial[q.id] = { firstPlace: null, secondPlace: null, thirdPlace: null };
    });
    return initial;
  });

  const handleAnswerChange = (
    questionId: number,
    place: 'firstPlace' | 'secondPlace' | 'thirdPlace',
    studentId: string | null
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [place]: studentId,
      },
    }));
  };

  // El boton de enviar no hace nada en la previsualizacion
  const handleSubmitPreview = () => {
    // No-op: es solo previsualizacion
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header con boton de regreso */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-black">Previsualizacion</h2>
            <p className="text-xs text-gray-400">Asi veran el cuestionario los alumnos. Puedes interactuar pero no se enviara nada.</p>
          </div>
        </div>
      </div>

      {/* Contenedor del formulario real - estilo Figma */}
      <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full min-h-full relative bg-white overflow-hidden">
          {/* Circulos decorativos de fondo */}
          <DecorativeCircles />

          {/* Contenido principal */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 sm:py-12 md:py-16 lg:py-20 flex flex-col items-center gap-6 sm:gap-8">
            {/* Header con logos, titulo e instrucciones */}
            <SurveyHeader groupName="10ºA" />

            {/* Formulario con preguntas - si hay preguntas */}
            {questions.length > 0 ? (
              <SurveyForm
                studentName="Jesus Aguilar Perez Osorno"
                studentId="preview-student"
                questions={questions}
                students={PREVIEW_STUDENTS}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmitPreview}
                isSubmitting={false}
              />
            ) : (
              <div className="w-full p-8 rounded-2xl border border-[#0F7E3C] bg-white/60 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-gray-500 font-medium">
                  No hay preguntas en este cuestionario
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Agrega preguntas para ver la previsualizacion del formulario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
