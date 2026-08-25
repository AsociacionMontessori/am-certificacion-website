import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { getHistorialNiveles, getNivelActivo } from '../../utils/alumnos';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, CalendarIcon, DocumentDuplicateIcon, XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingButton from '../../components/LoadingButton';
import { formatearFechaLarga, formatearFechaInput, ETIQUETA_SIN_FECHA } from '../../utils/formatearFecha';
import {
  formatearValorCalificacion,
  obtenerColorCalificacion,
  buscarCalificacionDeMateria,
  coincideConMateria
} from '../../utils/calificaciones';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';

const GestionMaterias = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nivelDesdeUrl = searchParams.get('nivel');
  const canEdit = useCanEdit();
  const { success, error: showError, confirm } = useNotifications();
  const [alumno, setAlumno] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [calificacionEnEdicion, setCalificacionEnEdicion] = useState(null);
  const [calificacionBorrador, setCalificacionBorrador] = useState('');
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [bulkData, setBulkData] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [selectedMaterias, setSelectedMaterias] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    aula: '',
    estado: 'Pendiente',
    calificacion: '',
    nivelId: '',
    nivelNombre: ''
  });
  const [nivelesHistorial, setNivelesHistorial] = useState([]);
  const [nivelActivo, setNivelActivo] = useState(null);
  const [nivelFiltro, setNivelFiltro] = useState('todos');
  const [bulkNivelId, setBulkNivelId] = useState(null);

  const normalizarMaterias = (lista, historialLista, nivelActivoRef, alumnoRef) => {
    return lista.map((materia) => {
      const nivelIdDocumento = materia.nivelId || materia.nivelActualId || null;
      const nivelNombreDocumento = materia.nivelNombre || materia.nivel || null;
      const historialNivel = historialLista.find((nivel) => nivel.id === nivelIdDocumento) ||
        historialLista.find((nivel) => nivel.nombre === nivelNombreDocumento);
      const idFinal = historialNivel?.id || nivelIdDocumento || nivelActivoRef?.id || null;
      const nombreFinal = historialNivel?.nombre || nivelNombreDocumento || nivelActivoRef?.nombre || alumnoRef?.nivel || '';
      return {
        ...materia,
        nivelId: idFinal,
        nivelNombre: nombreFinal
      };
    });
  };

  const ordenarPorFecha = (lista) => {
    lista.sort((a, b) => {
      const fechaA = a.fechaInicio?.toDate ? a.fechaInicio.toDate() : null;
      const fechaB = b.fechaInicio?.toDate ? b.fechaInicio.toDate() : null;
      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1;
      if (!fechaB) return -1;
      return fechaA - fechaB;
    });
    return lista;
  };

  /**
   * Trae materias y calificaciones juntas: desde esta pantalla se capturan de
   * una sola vez, aunque sigan viviendo en colecciones separadas porque de ahí
   * comen el portal del alumno y el perfil público.
   */
  const cargarMateriasYCalificaciones = async (historialLista, nivelActivoRef, alumnoRef) => {
    const [materiasSnapshot, calificacionesSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'materias'), where('alumnoId', '==', id))),
      getDocs(query(collection(db, 'calificaciones'), where('alumnoId', '==', id)))
    ]);

    const materiasData = ordenarPorFecha(
      materiasSnapshot.docs.map((materiaDoc) => ({ id: materiaDoc.id, ...materiaDoc.data() }))
    );
    setMaterias(normalizarMaterias(materiasData, historialLista, nivelActivoRef, alumnoRef));
    setCalificaciones(
      calificacionesSnapshot.docs.map((calificacionDoc) => ({
        id: calificacionDoc.id,
        ...calificacionDoc.data()
      }))
    );
  };

  const nivelesOpciones = useMemo(() => {
    const lista = [];
    const historialOrdenado = [...nivelesHistorial];
    historialOrdenado.sort((a, b) => {
      const fechaA = a.fechaInicio ? new Date(a.fechaInicio) : null;
      const fechaB = b.fechaInicio ? new Date(b.fechaInicio) : null;
      if (fechaA && fechaB) {
        return fechaB - fechaA;
      }
      if (fechaA) return -1;
      if (fechaB) return 1;
      return 0;
    });
    historialOrdenado.forEach((nivel) => {
      if (!nivel?.nombre) {
        return;
      }
      if (!lista.find((item) => item.id === nivel.id && item.nombre === nivel.nombre)) {
        lista.push({
          id: nivel.id,
          nombre: nivel.nombre,
          estado: nivel.estado || 'completado'
        });
      }
    });
    if (!lista.length && (nivelActivo?.nombre || alumno?.nivel)) {
      lista.push({
        id: nivelActivo?.id || null,
        nombre: nivelActivo?.nombre || alumno?.nivel,
        estado: 'activo'
      });
    }
    return lista;
  }, [nivelesHistorial, nivelActivo, alumno]);

  const hayMateriasSinNivel = useMemo(() => materias.some((materia) => !materia.nivelId), [materias]);

  const materiasFiltradas = useMemo(() => {
    if (nivelFiltro === 'todos') {
      return materias;
    }
    if (nivelFiltro === 'sinNivel') {
      return materias.filter((materia) => !materia.nivelId);
    }
    return materias.filter((materia) => materia.nivelId === nivelFiltro);
  }, [materias, nivelFiltro]);

  const nivelActualNombre = nivelActivo?.nombre || alumno?.nivel || 'Sin nivel activo';
  const nivelFiltroEtiqueta = useMemo(() => {
    if (nivelFiltro === 'todos') {
      return 'Todos los niveles';
    }
    if (nivelFiltro === 'sinNivel') {
      return 'Sin nivel asignado';
    }
    const encontrado = nivelesOpciones.find((nivel) => nivel.id === nivelFiltro);
    return encontrado?.nombre || 'Nivel actual';
  }, [nivelFiltro, nivelesOpciones]);

  const obtenerClaseFiltro = (valor) =>
    valor === nivelFiltro
      ? 'px-3 py-1.5 text-sm font-semibold rounded-full bg-blue text-white shadow-sm'
      : 'px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';

  const nivelBulkSeleccionado = useMemo(() => {
    if (!bulkNivelId) {
      return nivelActivo || null;
    }
    return (
      nivelesOpciones.find((nivel) => nivel.id === bulkNivelId) ||
      nivelesHistorial.find((nivel) => nivel.id === bulkNivelId) ||
      nivelActivo ||
      null
    );
  }, [bulkNivelId, nivelesOpciones, nivelesHistorial, nivelActivo]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos del alumno
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          const alumnoData = { id: alumnoDoc.id, ...alumnoDoc.data() };
          setAlumno(alumnoData);
          const historial = getHistorialNiveles(alumnoData);
          setNivelesHistorial(historial);
          const nivelActivoActual = getNivelActivo(alumnoData);
          setNivelActivo(nivelActivoActual);
          const nivelInicial = nivelDesdeUrl || nivelActivoActual?.id || 'todos';
          setNivelFiltro(nivelInicial);
          setBulkNivelId(nivelActivoActual?.id || null);

          await cargarMateriasYCalificaciones(historial, nivelActivoActual, alumnoData);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadData();
    }
    // La carga solo debe repetirse al cambiar de alumno o de nivel en la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nivelDesdeUrl]);

  /**
   * Guarda la calificación de una materia en su propia colección. Vacío borra
   * la que hubiera: así el admin puede corregir una nota puesta por error.
   * Al renombrar una materia se busca por el nombre anterior para no dejar la
   * calificación huérfana, ya que ambas colecciones se unen por nombre.
   */
  const guardarCalificacionDeMateria = async ({ nombre, nombreAnterior, nivelId, nivelNombre, valor }) => {
    const referencia = {
      nombre: nombreAnterior || nombre,
      nivelId: nivelId || null,
      nivelNombre: nivelNombre || ''
    };
    const existente = calificaciones.find((calificacion) => coincideConMateria(calificacion, referencia));
    const texto = (valor ?? '').toString().trim();

    if (texto === '') {
      if (existente) {
        await deleteDoc(doc(db, 'calificaciones', existente.id));
      }
      return;
    }

    const numero = Number(texto);
    if (Number.isNaN(numero)) {
      return;
    }

    if (existente) {
      await updateDoc(doc(db, 'calificaciones', existente.id), {
        materia: nombre,
        calificacion: numero,
        nivel: nivelNombre || '',
        nivelId: nivelId || null,
        nivelNombre: nivelNombre || '',
        fechaActualizacion: serverTimestamp()
      });
      return;
    }

    await addDoc(collection(db, 'calificaciones'), {
      alumnoId: id,
      materia: nombre,
      calificacion: numero,
      nivel: nivelNombre || '',
      nivelId: nivelId || null,
      nivelNombre: nivelNombre || '',
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    });
  };

  /** Edición rápida de la nota desde la tarjeta de la materia. */
  const handleGuardarCalificacionInline = async (materia) => {
    setGuardandoCalificacion(true);
    try {
      await guardarCalificacionDeMateria({
        nombre: materia.nombre,
        nivelId: materia.nivelId || materia.nivelActualId || null,
        nivelNombre: materia.nivelNombre || materia.nivel || '',
        valor: calificacionBorrador
      });
      await cargarMateriasYCalificaciones(nivelesHistorial, nivelActivo, alumno);
      setCalificacionEnEdicion(null);
      setCalificacionBorrador('');
      success('Calificación actualizada');
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      showError('Error al guardar la calificación');
    } finally {
      setGuardandoCalificacion(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nivelSeleccionado = nivelesOpciones.find((nivel) => nivel.id === formData.nivelId) ||
        nivelesHistorial.find((nivel) => nivel.id === formData.nivelId) ||
        (formData.nivelNombre ? { id: formData.nivelId || null, nombre: formData.nivelNombre } : nivelActivo);
      const nivelNombreFinal = nivelSeleccionado?.nombre || formData.nivelNombre || nivelActivo?.nombre || alumno?.nivel || '';
      const nivelIdFinal = nivelSeleccionado?.id || formData.nivelId || nivelActivo?.id || null;

      // Las fechas son opcionales: una materia puede quedar sin fecha próxima
      // hasta que se programe.
      const fechaInicioFinal = formData.fechaInicio ? new Date(formData.fechaInicio) : null;
      const fechaFinFinal = formData.fechaFin ? new Date(formData.fechaFin) : null;

      const materiaData = {
        alumnoId: id,
        nombre: formData.nombre,
        nivel: nivelNombreFinal,
        nivelId: nivelIdFinal,
        nivelNombre: nivelNombreFinal,
        fechaInicio: fechaInicioFinal,
        fechaFin: fechaFinFinal,
        aula: formData.aula || null,
        estado: formData.estado,
        fechaActualizacion: serverTimestamp()
      };

      if (materiaEditando) {
        await updateDoc(doc(db, 'materias', materiaEditando.id), materiaData);
      } else {
        await addDoc(collection(db, 'materias'), {
          ...materiaData,
          fechaCreacion: serverTimestamp()
        });
      }

      await guardarCalificacionDeMateria({
        nombre: formData.nombre,
        nombreAnterior: materiaEditando?.nombre,
        nivelId: nivelIdFinal,
        nivelNombre: nivelNombreFinal,
        valor: formData.calificacion
      });

      await cargarMateriasYCalificaciones(nivelesHistorial, nivelActivo, alumno);

      setShowModal(false);
      setMateriaEditando(null);
      setFormData({
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        aula: '',
        estado: 'Pendiente',
        calificacion: '',
        nivelId: nivelActivo?.id || '',
        nivelNombre: nivelActivo?.nombre || ''
      });
    } catch (error) {
      console.error('Error al guardar materia:', error);
      showError('Error al guardar la materia');
    }
  };

  const handleEdit = (materia) => {
    setMateriaEditando(materia);
    const calificacionActual = buscarCalificacionDeMateria(calificaciones, materia);
    setFormData({
      nombre: materia.nombre,
      fechaInicio: formatearFechaInput(materia.fechaInicio),
      fechaFin: formatearFechaInput(materia.fechaFin),
      aula: materia.aula || '',
      estado: materia.estado || 'Pendiente',
      calificacion: calificacionActual ? String(calificacionActual.calificacion) : '',
      nivelId: materia.nivelId || materia.nivelActualId || '',
      nivelNombre: materia.nivelNombre || materia.nivel || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (materiaId) => {
    const confirmed = await confirm(
      '¿Estás seguro de eliminar esta materia?',
      {
        title: 'Confirmar eliminación',
        type: 'danger',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'materias', materiaId));
        setMaterias(materias.filter(m => m.id !== materiaId));
        success('Materia eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar materia:', error);
        showError('Error al eliminar la materia');
      }
    }
  };

  const handleToggleSelect = (materiaId) => {
    setSelectedMaterias(prev =>
      prev.includes(materiaId)
        ? prev.filter(id => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMaterias.length === materiasFiltradas.length) {
      setSelectedMaterias([]);
    } else {
      setSelectedMaterias(materiasFiltradas.map(m => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMaterias.length === 0) return;

    const confirmMessage = selectedMaterias.length === 1
      ? '¿Estás seguro de eliminar esta materia?'
      : `¿Estás seguro de eliminar ${selectedMaterias.length} materias?`;

    const confirmed = await confirm(
      confirmMessage,
      {
        title: 'Confirmar eliminación',
        type: 'danger',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (!confirmed) return;

    try {
      const batch = writeBatch(db);
      selectedMaterias.forEach(materiaId => {
        batch.delete(doc(db, 'materias', materiaId));
      });

      await batch.commit();

      const count = selectedMaterias.length;
      setMaterias(materias.filter(m => !selectedMaterias.includes(m.id)));
      setSelectedMaterias([]);
      setIsSelecting(false);
      success(`${count} materia(s) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error al eliminar materias:', error);
      showError('Error al eliminar las materias');
    }
  };

  // Funciones para agregar por lotes
  const parsearFecha = (fechaStr) => {
    if (!fechaStr || fechaStr.trim() === '') return null;

    // Intentar diferentes formatos de fecha comunes en Excel
    const fechaStrTrimmed = fechaStr.trim();

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStrTrimmed)) {
      return fechaStrTrimmed;
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY
    const formatoDMY = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
    const matchDMY = fechaStrTrimmed.match(formatoDMY);
    if (matchDMY) {
      const [, dia, mes, año] = matchDMY;
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Formato MM/DD/YYYY o MM-DD-YYYY
    const formatoMDY = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
    const matchMDY = fechaStrTrimmed.match(formatoMDY);
    if (matchMDY) {
      const [, mes, dia, año] = matchMDY;
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Intentar parsear como fecha de JavaScript
    const fecha = new Date(fechaStrTrimmed);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }

    return null;
  };

  const ESTADOS_VALIDOS = ['Pendiente', 'En curso', 'Con atraso', 'Completada'];

  const esEncabezado = (columnas) => {
    const primeras = columnas.slice(0, 2).map((col) => (col || '').toLowerCase());
    return primeras.some((col) =>
      col.includes('calific') ||
      col.includes('nota') ||
      col.includes('materia') ||
      col.includes('nombre') ||
      col.includes('asignatura')
    );
  };

  /**
   * Lee lo pegado desde Excel. El formato es
   * Calificación | Materia | Inicio | Fin | Aula | Estado, pero se sigue
   * aceptando el anterior (sin calificación) para no romper listas viejas:
   * si la primera columna no es un número, se asume que es el nombre.
   */
  const parsearBulkData = (texto) => {
    setBulkError('');
    const lineas = texto.split('\n').filter((linea) => linea.trim() !== '');
    const materiasParseadas = [];
    const nivelIdObjetivo = nivelBulkSeleccionado?.id || null;
    const nivelNombreObjetivo = nivelBulkSeleccionado?.nombre || alumno?.nivel || '';

    lineas.forEach((linea, index) => {
      const columnas = linea.split('\t').map((col) => col.trim());

      if (index === 0 && esEncabezado(columnas)) {
        return;
      }

      const traeCalificacion = columnas[0] === '' || !Number.isNaN(Number(columnas[0]));
      const [calificacionTexto, nombre, inicioTexto, finTexto, aula, estadoTexto] = traeCalificacion
        ? columnas
        : ['', ...columnas];

      if (!nombre) {
        setBulkError(`Error en línea ${index + 1}: Falta el nombre de la materia`);
        return;
      }

      let calificacion = null;
      if (calificacionTexto !== '' && calificacionTexto !== undefined) {
        const numero = Number(calificacionTexto);
        if (Number.isNaN(numero) || numero < 0 || numero > 10) {
          setBulkError(`Error en línea ${index + 1}: Calificación inválida: "${calificacionTexto}" (debe ser un número entre 0 y 10)`);
          return;
        }
        calificacion = numero;
      }

      const estado = ESTADOS_VALIDOS.includes(estadoTexto) ? estadoTexto : 'Pendiente';
      const existente = materias.find((materia) =>
        coincideConMateria(materia, {
          nombre,
          nivelId: nivelIdObjetivo,
          nivelNombre: nivelNombreObjetivo
        })
      );

      materiasParseadas.push({
        calificacion,
        nombre,
        fechaInicio: parsearFecha(inicioTexto),
        fechaFin: parsearFecha(finTexto),
        aula: aula || '',
        estado,
        materiaExistenteId: existente?.id || null
      });
    });

    setBulkPreview(materiasParseadas);
    return materiasParseadas;
  };

  const handleBulkPaste = (e) => {
    const texto = e.clipboardData.getData('text');
    setBulkData(texto);
    parsearBulkData(texto);
  };

  const handleBulkChange = (e) => {
    const texto = e.target.value;
    setBulkData(texto);
    if (texto.trim()) {
      parsearBulkData(texto);
    } else {
      setBulkPreview([]);
      setBulkError('');
    }
  };

  // Re-parsear datos cuando cambie el nivel seleccionado (solo si hay datos)
  useEffect(() => {
    if (bulkData.trim() && showBulkModal) {
      // Usar setTimeout para evitar problemas con el estado asíncrono
      const timeoutId = setTimeout(() => {
        parsearBulkData(bulkData);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkNivelId]);

  const handleBulkSubmit = async () => {
    if (bulkPreview.length === 0) {
      setBulkError('No hay materias válidas para agregar');
      return;
    }

    setBulkProcessing(true);
    setBulkError('');

    try {
      const batch = writeBatch(db);
      const materiasRef = collection(db, 'materias');
      const calificacionesRef = collection(db, 'calificaciones');
      const nivelBulkNombre = nivelBulkSeleccionado?.nombre || alumno?.nivel || '';
      const nivelBulkId = nivelBulkSeleccionado?.id || null;

      bulkPreview.forEach((materia) => {
        const datosMateria = {
          alumnoId: id,
          nombre: materia.nombre,
          nivel: nivelBulkNombre,
          nivelId: nivelBulkId,
          nivelNombre: nivelBulkNombre,
          fechaInicio: materia.fechaInicio ? new Date(materia.fechaInicio) : null,
          fechaFin: materia.fechaFin ? new Date(materia.fechaFin) : null,
          aula: materia.aula || null,
          estado: materia.estado,
          fechaActualizacion: serverTimestamp()
        };

        // Repegar la misma lista actualiza la materia en lugar de duplicarla.
        if (materia.materiaExistenteId) {
          batch.update(doc(materiasRef, materia.materiaExistenteId), datosMateria);
        } else {
          batch.set(doc(materiasRef), { ...datosMateria, fechaCreacion: serverTimestamp() });
        }

        // Una columna de calificación vacía no borra la nota que ya existía.
        if (materia.calificacion === null) {
          return;
        }

        const calificacionExistente = calificaciones.find((calificacion) =>
          coincideConMateria(calificacion, {
            nombre: materia.nombre,
            nivelId: nivelBulkId,
            nivelNombre: nivelBulkNombre
          })
        );
        const datosCalificacion = {
          alumnoId: id,
          materia: materia.nombre,
          calificacion: materia.calificacion,
          nivel: nivelBulkNombre,
          nivelId: nivelBulkId,
          nivelNombre: nivelBulkNombre,
          fechaActualizacion: serverTimestamp()
        };

        if (calificacionExistente) {
          batch.update(doc(calificacionesRef, calificacionExistente.id), datosCalificacion);
        } else {
          batch.set(doc(calificacionesRef), { ...datosCalificacion, fechaCreacion: serverTimestamp() });
        }
      });

      await batch.commit();

      await cargarMateriasYCalificaciones(nivelesHistorial, nivelActivo, alumno);

      const actualizadas = bulkPreview.filter((materia) => materia.materiaExistenteId).length;
      const nuevas = bulkPreview.length - actualizadas;
      setShowBulkModal(false);
      setBulkData('');
      setBulkPreview([]);
      success(
        actualizadas > 0
          ? `${nuevas} materia(s) agregada(s) y ${actualizadas} actualizada(s)`
          : `${nuevas} materias agregadas exitosamente`
      );
    } catch (error) {
      console.error('Error al agregar materias por lotes:', error);
      setBulkError('Error al guardar las materias: ' + error.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const nivelNombreActual = useMemo(() => {
    if (formData.nivelNombre) {
      return formData.nivelNombre;
    }
    if (formData.nivelId) {
      const nivelEncontrado = nivelesOpciones.find((nivel) => nivel.id === formData.nivelId) ||
        nivelesHistorial.find((nivel) => nivel.id === formData.nivelId);
      return nivelEncontrado?.nombre || nivelActivo?.nombre || alumno?.nivel || '';
    }
    return nivelActivo?.nombre || alumno?.nivel || '';
  }, [formData.nivelId, formData.nivelNombre, nivelesOpciones, nivelesHistorial, nivelActivo, alumno]);

  const materiasDisponibles = useMemo(() => {
    if (!nivelNombreActual) {
      return [];
    }
    return getMateriasPorNivel(nivelNombreActual);
  }, [nivelNombreActual]);

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="montessori"
        message="Cargando materias..."
        className="h-64"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={`/admin/alumno/${id}`}
            className="inline-flex items-center text-blue hover:text-blue/80 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver al alumno
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Gestión de Materias
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {alumno?.nombre} · Nivel actual: {nivelActualNombre}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            Mostrando: {nivelFiltroEtiqueta}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => {
                setMateriaEditando(null);
                const nivelDefault = nivelActivo?.id
                  ? { id: nivelActivo.id, nombre: nivelActivo.nombre }
                  : (nivelesOpciones[0] || { id: '', nombre: '' });
                setFormData({
                  nombre: '',
                  fechaInicio: '',
                  fechaFin: '',
                  aula: '',
                  estado: 'Pendiente',
                  calificacion: '',
                  nivelId: nivelDefault.id || '',
                  nivelNombre: nivelDefault.nombre || ''
                });
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white bg-blue rounded-lg shadow-sm hover:bg-blue/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Agregar Materia
            </button>
            <button
              onClick={() => {
                setShowBulkModal(true);
                setBulkData('');
                setBulkPreview([]);
                setBulkError('');
                setBulkNivelId(nivelActivo?.id || '');
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 bg-green rounded-lg shadow-sm hover:bg-green/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2 transition-all duration-200"
            >
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Agregar por Lotes
            </button>
          </div>
        )}
      </div>

      {/* Lista de materias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setNivelFiltro('todos')}
              className={obtenerClaseFiltro('todos')}
              type="button"
            >
              Todos
            </button>
            {nivelesOpciones
              .filter((nivel) => nivel.id)
              .map((nivel) => (
                <button
                  key={nivel.id}
                  onClick={() => setNivelFiltro(nivel.id)}
                  className={obtenerClaseFiltro(nivel.id)}
                  type="button"
                  title={nivel.estado === 'activo' ? 'Nivel activo' : 'Nivel histórico'}
                >
                  {nivel.estado === 'activo' ? 'Activo: ' : ''}{nivel.nombre}
                </button>
              ))}
            {hayMateriasSinNivel && (
              <button
                onClick={() => setNivelFiltro('sinNivel')}
                className={obtenerClaseFiltro('sinNivel')}
                type="button"
              >
                Sin nivel
              </button>
            )}
          </div>

          {/* Barra de acciones de selección múltiple */}
          {isSelecting && (
            <div className="mb-4 p-3 bg-blue/10 dark:bg-blue/20 rounded-lg border border-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue hover:text-blue/80"
                >
                  {selectedMaterias.length === materiasFiltradas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMaterias.length} de {materiasFiltradas.length} seleccionadas
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedMaterias.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red bg-red/10 hover:bg-red/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Eliminar ({selectedMaterias.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSelecting(false);
                    setSelectedMaterias([]);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botón para activar selección múltiple */}
          {!isSelecting && materiasFiltradas.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setIsSelecting(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Seleccionar múltiples
              </button>
            </div>
          )}

          {/* Agrupar materias por estado */}
          {(() => {
            const materiasPorEstado = {
              'Con atraso': materiasFiltradas.filter(m => (m.estado || 'Pendiente').toString().trim() === 'Con atraso'),
              'Pendiente': materiasFiltradas.filter(m => (m.estado || 'Pendiente').toString().trim() === 'Pendiente'),
              'En curso': materiasFiltradas.filter(m => (m.estado || 'Pendiente').toString().trim() === 'En curso'),
              'Completada': materiasFiltradas.filter(m => (m.estado || 'Pendiente').toString().trim() === 'Completada'),
              'Otros': materiasFiltradas.filter(m => {
                const estado = (m.estado || 'Pendiente').toString().trim();
                return !['Con atraso', 'Pendiente', 'En curso', 'Completada'].includes(estado);
              })
            };

            const renderTarjetaMateria = (materia) => {
              const estado = (materia.estado || 'Pendiente').toString().trim();
              const calificacionMateria = buscarCalificacionDeMateria(calificaciones, materia);
              let estadoClass = 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white';
              let borderColor = 'border-gray-200 dark:border-gray-600';
              let bgColor = 'bg-gray-50 dark:bg-gray-700/50';

              switch (estado) {
                case 'Completada':
                  estadoClass = 'bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900';
                  borderColor = 'border-green-300 dark:border-green-700';
                  bgColor = 'bg-green-50 dark:bg-green-900/20';
                  break;
                case 'En curso':
                  estadoClass = 'bg-blue text-white';
                  borderColor = 'border-blue-300 dark:border-blue-700';
                  bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                  break;
                case 'Con atraso':
                  estadoClass = 'bg-red text-white';
                  borderColor = 'border-red-300 dark:border-red-700';
                  bgColor = 'bg-red-50 dark:bg-red-900/20';
                  break;
                case 'Pendiente':
                  estadoClass = 'bg-yellow text-gray-900 dark:bg-yellow/80 dark:text-gray-900';
                  borderColor = 'border-yellow-300 dark:border-yellow-700';
                  bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                  break;
                default:
                  estadoClass = 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white';
              }

              return (
                <div key={materia.id} className={`${bgColor} rounded-lg p-4 border-2 ${borderColor} shadow-sm hover:shadow-md transition-shadow ${isSelecting && selectedMaterias.includes(materia.id) ? 'ring-2 ring-blue' : ''}`}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {materia.nombre}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass} flex items-center gap-1`}>
                        {estado}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nivel</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {materia.nivelNombre || 'Sin nivel asignado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Calificación</p>
                        {calificacionEnEdicion === materia.id ? (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              autoFocus
                              value={calificacionBorrador}
                              onChange={(e) => setCalificacionBorrador(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleGuardarCalificacionInline(materia);
                                }
                              }}
                              placeholder="0 a 10"
                              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                            />
                            <button
                              type="button"
                              onClick={() => handleGuardarCalificacionInline(materia)}
                              disabled={guardandoCalificacion}
                              className="px-2 py-1 text-xs font-semibold text-white bg-blue rounded-lg hover:bg-blue/90 disabled:opacity-60"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCalificacionEnEdicion(null);
                                setCalificacionBorrador('');
                              }}
                              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${calificacionMateria ? obtenerColorCalificacion(calificacionMateria.calificacion) : 'text-gray-500'}`}>
                              {calificacionMateria
                                ? formatearValorCalificacion(calificacionMateria.calificacion)
                                : 'Sin calificación'}
                            </p>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCalificacionEnEdicion(materia.id);
                                  setCalificacionBorrador(
                                    calificacionMateria ? String(calificacionMateria.calificacion) : ''
                                  );
                                }}
                                className="text-xs font-medium text-blue hover:underline"
                              >
                                {calificacionMateria ? 'Cambiar' : 'Poner'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de inicio</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {materia.fechaInicio ? formatearFechaLarga(materia.fechaInicio) : ETIQUETA_SIN_FECHA}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de fin</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {materia.fechaFin ? formatearFechaLarga(materia.fechaFin) : ETIQUETA_SIN_FECHA}
                          </p>
                        </div>
                        {materia.aula && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Aula</p>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              {materia.aula}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2 justify-end">
                      {isSelecting && (
                        <input
                          type="checkbox"
                          checked={selectedMaterias.includes(materia.id)}
                          onChange={() => handleToggleSelect(materia.id)}
                          className="w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue"
                        />
                      )}
                      {!isSelecting && canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(materia)}
                            className="inline-flex items-center px-3 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm"
                            title="Editar materia"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(materia.id)}
                            className="inline-flex items-center px-3 py-2 bg-red/10 text-red rounded-lg hover:bg-red/20 dark:hover:bg-red/30 transition-colors text-sm border border-red/20"
                            title="Eliminar materia"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* Materias con atraso */}
                {materiasPorEstado['Con atraso'].length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-red dark:text-red-400 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-6 h-6" />
                          Materias con Atraso ({materiasPorEstado['Con atraso'].length})
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materiasPorEstado['Con atraso'].map((materia) => renderTarjetaMateria(materia))}
                    </div>
                  </div>
                )}

                {/* Materias pendientes */}
                {materiasPorEstado['Pendiente'].length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-yellow dark:text-yellow-400 flex items-center gap-2">
                          <ClockIcon className="w-6 h-6" />
                          Materias Pendientes ({materiasPorEstado['Pendiente'].length})
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materiasPorEstado['Pendiente'].map((materia) => renderTarjetaMateria(materia))}
                    </div>
                  </div>
                )}

                {/* Materias en curso */}
                {materiasPorEstado['En curso'].length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-blue dark:text-blue-400 flex items-center gap-2">
                          <CalendarIcon className="w-6 h-6" />
                          Materias en Curso ({materiasPorEstado['En curso'].length})
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materiasPorEstado['En curso'].map((materia) => renderTarjetaMateria(materia))}
                    </div>
                  </div>
                )}

                {/* Materias completadas */}
                {materiasPorEstado['Completada'].length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-green dark:text-green-400 flex items-center gap-2">
                          <CheckCircleIcon className="w-6 h-6" />
                          Materias Completadas ({materiasPorEstado['Completada'].length})
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materiasPorEstado['Completada'].map((materia) => renderTarjetaMateria(materia))}
                    </div>
                  </div>
                )}

                {/* Otras materias */}
                {materiasPorEstado['Otros'].length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          Otras Materias ({materiasPorEstado['Otros'].length})
                        </h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materiasPorEstado['Otros'].map((materia) => renderTarjetaMateria(materia))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {materias.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No hay materias registradas para este alumno.
              </p>
            </div>
          ) : (
            materiasFiltradas.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay materias en el nivel seleccionado.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal para agregar/editar materia */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {materiaEditando ? 'Editar Materia' : 'Agregar Materia'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la materia *
                  </label>
                  <select
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                  >
                    <option value="">Selecciona una materia</option>
                    {materiasDisponibles.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nivel asociado
                  </label>
                  <select
                    value={formData.nivelId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setFormData({
                          ...formData,
                          nivelId: '',
                          nivelNombre: nivelActivo?.nombre || ''
                        });
                        return;
                      }
                      const seleccionado = nivelesOpciones.find((nivel) => nivel.id === value);
                      setFormData({
                        ...formData,
                        nivelId: seleccionado?.id || '',
                        nivelNombre: seleccionado?.nombre || ''
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                  >
                    <option value="">
                      {nivelActivo?.nombre ? `Nivel actual: ${nivelActivo.nombre}` : 'Sin nivel específico'}
                    </option>
                    {nivelesOpciones
                      .filter((nivel) => nivel.id)
                      .map((nivel) => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.estado === 'activo' ? 'Activo: ' : 'Histórico: '}
                          {nivel.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de inicio (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sin fecha, la materia se muestra como &laquo;{ETIQUETA_SIN_FECHA}&raquo;
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aula
                    </label>
                    <input
                      type="text"
                      value={formData.aula}
                      onChange={(e) => setFormData({ ...formData, aula: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      required
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En curso">En curso</option>
                      <option value="Con atraso">Con atraso</option>
                      <option value="Completada">Completada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calificación (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.calificacion}
                    onChange={(e) => setFormData({ ...formData, calificacion: e.target.value })}
                    placeholder="0 a 10"
                    className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    0 es &laquo;Por cursar&raquo; y 1 es &laquo;Cursando&raquo;. Déjalo vacío para quitar la calificación.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setMateriaEditando(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90"
                  >
                    {materiaEditando ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar por lotes */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Agregar Materias por Lotes
              </h2>

              <div className="mb-4 p-4 bg-blue/10 dark:bg-blue/20 rounded-lg border border-blue/20">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Instrucciones:</strong>
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                  <li>En Excel, selecciona las columnas: <strong>Calificación | Materia | Fecha Inicio | Fecha Fin | Aula | Estado</strong></li>
                  <li>Copia las celdas (Ctrl+C o Cmd+C)</li>
                  <li>Pega aquí abajo (Ctrl+V o Cmd+V)</li>
                  <li>Revisa la vista previa y guarda</li>
                </ol>
                <div className="mt-2 p-2 bg-green/10 dark:bg-green/20 rounded border border-green/20 space-y-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    💡 La calificación <strong>0</strong> es «Por cursar» y <strong>1</strong> es «Cursando». Cada renglón guarda la materia y su calificación de una sola vez.
                  </p>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    Las fechas pueden ir vacías: la materia queda como «{ETIQUETA_SIN_FECHA}». Si una materia ya existe en este nivel, se actualiza en lugar de duplicarse.
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Formatos de fecha aceptados: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. También se acepta la lista anterior, sin la columna de calificación.
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asignar al nivel
                  </label>
                  <select
                    value={bulkNivelId || ''}
                    onChange={(e) => {
                      setBulkNivelId(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                  >
                    <option value="">
                      {nivelActivo?.nombre ? `Nivel actual: ${nivelActivo.nombre}` : 'Sin nivel específico'}
                    </option>
                    {nivelesOpciones
                      .filter((nivel) => nivel.id)
                      .map((nivel) => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.estado === 'activo' ? 'Activo: ' : 'Histórico: '}
                          {nivel.nombre}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Se asignarán al nivel: <strong>{nivelBulkSeleccionado?.nombre || 'Sin nivel específico'}</strong>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pega los datos de Excel aquí:
                </label>
                <textarea
                  value={bulkData}
                  onChange={handleBulkChange}
                  onPaste={handleBulkPaste}
                  placeholder={"10\tFilosofía Montessori\t25/01/2023\t12/04/2023\tG219\tCompletada\n1\tNeuroeducación\t13/06/2026\t29/08/2026\tN17\tEn curso\n0\tDidáctica\t\t\t\tPendiente"}
                  rows={8}
                  className="w-full px-4 py-2.5 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                />
              </div>

              {bulkError && (
                <div className="mb-4 p-3 bg-red/10 dark:bg-red/20 border border-red/30 rounded-lg">
                  <p className="text-sm text-red dark:text-red-300">{bulkError}</p>
                </div>
              )}

              {bulkPreview.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vista previa ({bulkPreview.length} materias):
                  </p>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Calificación</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Materia</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Inicio</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fin</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Aula</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {bulkPreview.map((materia, index) => (
                          <tr key={index}>
                            <td className={`px-3 py-2 font-medium ${materia.calificacion === null ? 'text-gray-400' : obtenerColorCalificacion(materia.calificacion)}`}>
                              {materia.calificacion === null ? '-' : formatearValorCalificacion(materia.calificacion)}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{materia.nombre}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.fechaInicio || ETIQUETA_SIN_FECHA}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.fechaFin || ETIQUETA_SIN_FECHA}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.aula || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.estado}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              {materia.materiaExistenteId ? 'Actualiza' : 'Nueva'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkData('');
                    setBulkPreview([]);
                    setBulkError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={bulkProcessing}
                >
                  Cancelar
                </button>
                <LoadingButton
                  onClick={handleBulkSubmit}
                  isLoading={bulkProcessing}
                  variant="success"
                  disabled={bulkPreview.length === 0}
                >
                  Agregar {bulkPreview.length > 0 ? `${bulkPreview.length} ` : ''}Materias
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMaterias;
