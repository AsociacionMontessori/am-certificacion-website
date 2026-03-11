import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { getHistorialNiveles, getNivelActivo } from '../../utils/alumnos';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ChartBarIcon, DocumentDuplicateIcon, XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingButton from '../../components/LoadingButton';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';

const GestionCalificaciones = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nivelDesdeUrl = searchParams.get('nivel');
  const canEdit = useCanEdit();
  const { success, error: showError, confirm } = useNotifications();
  const [alumno, setAlumno] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [calificacionEditando, setCalificacionEditando] = useState(null);
  const [selectedCalificaciones, setSelectedCalificaciones] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [formData, setFormData] = useState({
    materia: '',
    calificacion: '',
    nivelId: '',
    nivelNombre: ''
  });
  const [nivelesHistorial, setNivelesHistorial] = useState([]);
  const [nivelActivo, setNivelActivo] = useState(null);
  const [nivelFiltro, setNivelFiltro] = useState('todos');
  const [bulkNivelId, setBulkNivelId] = useState(null);

  const normalizarCalificaciones = (lista, historialLista, nivelActivoRef, alumnoRef) => {
    return lista.map((calificacion) => {
      const nivelIdDocumento = calificacion.nivelId || null;
      const nivelNombreDocumento = calificacion.nivelNombre || calificacion.nivel || null;
      const historialNivel = historialLista.find((nivel) => nivel.id === nivelIdDocumento) ||
        historialLista.find((nivel) => nivel.nombre === nivelNombreDocumento);
      const idFinal = historialNivel?.id || nivelIdDocumento || nivelActivoRef?.id || null;
      const nombreFinal = historialNivel?.nombre || nivelNombreDocumento || nivelActivoRef?.nombre || alumnoRef?.nivel || '';
      return {
        ...calificacion,
        nivelId: idFinal,
        nivelNombre: nombreFinal
      };
    });
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

  const calificacionesFiltradas = useMemo(() => {
    if (nivelFiltro === 'todos') {
      return calificaciones;
    }
    if (nivelFiltro === 'sinNivel') {
      return calificaciones.filter((calificacion) => !calificacion.nivelId);
    }
    return calificaciones.filter((calificacion) => calificacion.nivelId === nivelFiltro);
  }, [calificaciones, nivelFiltro]);

  const hayCalificacionesSinNivel = useMemo(() => calificaciones.some((calificacion) => !calificacion.nivelId), [calificaciones]);

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

  const normalizarTexto = (valor) => (valor || '').toString().trim().toLowerCase();

  const formatearValorCalificacion = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) {
      return 'N/A';
    }
    if (numero === 0) {
      return 'Por cursar';
    }
    if (numero === 1) {
      return 'Cursando';
    }
    return numero;
  };

  const obtenerColorCalificacion = (calificacion) => {
    const numero = Number(calificacion);
    if (Number.isNaN(numero)) return 'text-gray-500';
    if (numero === 0) return 'text-gray-500';
    if (numero === 1) return 'text-blue';
    if (numero >= 9) return 'text-green';
    if (numero >= 8) return 'text-blue';
    if (numero >= 7) return 'text-yellow';
    return 'text-red';
  };

  const obtenerFechaFinMateria = (materia) => {
    if (!materia?.fechaFin) {
      return null;
    }
    if (typeof materia.fechaFin.toDate === 'function') {
      return materia.fechaFin.toDate();
    }
    if (materia.fechaFin instanceof Date) {
      return materia.fechaFin;
    }
    const fecha = new Date(materia.fechaFin);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

  const determinarEstadoMateria = (materia, calificacionValor) => {
    const numero = Number(calificacionValor);
    if (Number.isNaN(numero)) {
      return null;
    }
    const fechaFin = obtenerFechaFinMateria(materia);
    const haPasadoFechaFin = fechaFin ? fechaFin.getTime() < Date.now() : false;

    if (haPasadoFechaFin && numero < 10) {
      return 'Con atraso';
    }
    if (numero === 0) {
      return 'Pendiente';
    }
    if (numero === 1) {
      return 'En curso';
    }
    if (numero >= 10) {
      return 'Completada';
    }
    return 'En curso';
  };

  const actualizarEstadoMateriaPorCalificacion = async ({ materiaNombre, calificacionValor, nivelId, nivelNombre }) => {
    if (!materiaNombre) {
      return;
    }

    try {
      const materiasRef = collection(db, 'materias');
      const materiasQuery = query(materiasRef, where('alumnoId', '==', id));
      const materiasSnapshot = await getDocs(materiasQuery);

      if (materiasSnapshot.empty) {
        return;
      }

      const nombreNormalizado = normalizarTexto(materiaNombre);
      const nivelIdObjetivo = nivelId || null;
      const nivelNombreNormalizado = normalizarTexto(nivelNombre);

      const materiasRelacionadas = materiasSnapshot.docs
        .map((materiaDoc) => ({ id: materiaDoc.id, ...materiaDoc.data() }))
        .filter((materia) => {
          const coincideNombre = normalizarTexto(materia.nombre) === nombreNormalizado;
          if (!coincideNombre) {
            return false;
          }

          const materiaNivelId = materia.nivelId || materia.nivelActualId || null;
          if (nivelIdObjetivo && materiaNivelId) {
            return materiaNivelId === nivelIdObjetivo;
          }
          if (nivelIdObjetivo && !materiaNivelId) {
            return false;
          }

          const materiaNivelNombre = normalizarTexto(materia.nivelNombre || materia.nivel);
          if (nivelNombreNormalizado && materiaNivelNombre) {
            return materiaNivelNombre === nivelNombreNormalizado;
          }

          if (nivelNombreNormalizado && !materiaNivelNombre) {
            return false;
          }

          return true;
        });

      if (!materiasRelacionadas.length) {
        return;
      }

      await Promise.all(
        materiasRelacionadas.map(async (materia) => {
          const nuevoEstado = determinarEstadoMateria(materia, calificacionValor);
          if (!nuevoEstado || nuevoEstado === materia.estado) {
            return;
          }
          try {
            await updateDoc(doc(db, 'materias', materia.id), {
              estado: nuevoEstado,
              fechaActualizacion: serverTimestamp()
            });
          } catch (updateError) {
            console.error('Error al actualizar estado de materia:', updateError);
          }
        })
      );
    } catch (error) {
      console.error('Error al sincronizar estado de materia con calificación:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        let alumnoData = null;
        let historial = [];
        let nivelActivoActual = null;
        if (alumnoDoc.exists()) {
          alumnoData = { id: alumnoDoc.id, ...alumnoDoc.data() };
          setAlumno(alumnoData);
          historial = getHistorialNiveles(alumnoData);
          setNivelesHistorial(historial);
          nivelActivoActual = getNivelActivo(alumnoData);
          setNivelActivo(nivelActivoActual);
          const nivelInicial = nivelDesdeUrl || nivelActivoActual?.id || 'todos';
          setNivelFiltro(nivelInicial);
          setBulkNivelId(nivelActivoActual?.id || '');
        }

        // Consulta simplificada: solo por alumnoId, ordenamos en el cliente
        const calificacionesQuery = query(
          collection(db, 'calificaciones'),
          where('alumnoId', '==', id)
        );
        const calificacionesSnapshot = await getDocs(calificacionesQuery);
        const calificacionesData = calificacionesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar por materia (asc)
        calificacionesData.sort((a, b) => {
          return (a.materia || '').localeCompare(b.materia || '');
        });

        const calificacionesNormalizadas = normalizarCalificaciones(
          calificacionesData,
          historial,
          nivelActivoActual,
          alumnoData
        );
        setCalificaciones(calificacionesNormalizadas);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadData();
    }
  }, [id, nivelDesdeUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nivelSeleccionado = nivelesOpciones.find((nivel) => nivel.id === formData.nivelId) ||
        nivelesHistorial.find((nivel) => nivel.id === formData.nivelId) ||
        (formData.nivelNombre ? { id: formData.nivelId || null, nombre: formData.nivelNombre } : nivelActivo);
      const nivelNombreFinal = nivelSeleccionado?.nombre || formData.nivelNombre || nivelActivo?.nombre || alumno?.nivel || '';
      const nivelIdFinal = nivelSeleccionado?.id || formData.nivelId || nivelActivo?.id || null;
      const calificacionData = {
        alumnoId: id,
        materia: formData.materia,
        calificacion: parseFloat(formData.calificacion),
        nivel: nivelNombreFinal,
        nivelId: nivelIdFinal,
        nivelNombre: nivelNombreFinal,
        fechaActualizacion: serverTimestamp()
      };

      if (calificacionEditando) {
        await updateDoc(doc(db, 'calificaciones', calificacionEditando.id), calificacionData);
      } else {
        await addDoc(collection(db, 'calificaciones'), {
          ...calificacionData,
          fechaCreacion: serverTimestamp()
        });
      }

      await actualizarEstadoMateriaPorCalificacion({
        materiaNombre: calificacionData.materia,
        calificacionValor: calificacionData.calificacion,
        nivelId: nivelIdFinal,
        nivelNombre: nivelNombreFinal
      });

      // Recargar calificaciones
      const calificacionesQuery = query(
        collection(db, 'calificaciones'),
        where('alumnoId', '==', id)
      );
      const calificacionesSnapshot = await getDocs(calificacionesQuery);
      const calificacionesData = calificacionesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por materia (asc)
      calificacionesData.sort((a, b) => {
        return (a.materia || '').localeCompare(b.materia || '');
      });

      const calificacionesNormalizadas = normalizarCalificaciones(calificacionesData, nivelesHistorial, nivelActivo, alumno);
      setCalificaciones(calificacionesNormalizadas);

      setShowModal(false);
      setCalificacionEditando(null);
      setFormData({
        materia: '',
        calificacion: '',
        nivelId: nivelActivo?.id || '',
        nivelNombre: nivelActivo?.nombre || ''
      });
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      showError('Error al guardar la calificación');
    }
  };

  const handleEdit = (calificacion) => {
    setCalificacionEditando(calificacion);
    setFormData({
      materia: calificacion.materia,
      calificacion: calificacion.calificacion?.toString() || '',
      nivelId: calificacion.nivelId || '',
      nivelNombre: calificacion.nivelNombre || calificacion.nivel || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (calificacionId) => {
    const confirmed = await confirm(
      '¿Estás seguro de eliminar esta calificación?',
      {
        title: 'Confirmar eliminación',
        type: 'danger',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'calificaciones', calificacionId));
        setCalificaciones(calificaciones.filter(c => c.id !== calificacionId));
        success('Calificación eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar calificación:', error);
        showError('Error al eliminar la calificación');
      }
    }
  };

  const handleToggleSelect = (calificacionId) => {
    setSelectedCalificaciones(prev =>
      prev.includes(calificacionId)
        ? prev.filter(id => id !== calificacionId)
        : [...prev, calificacionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCalificaciones.length === calificacionesFiltradas.length) {
      setSelectedCalificaciones([]);
    } else {
      setSelectedCalificaciones(calificacionesFiltradas.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCalificaciones.length === 0) return;

    const confirmMessage = selectedCalificaciones.length === 1
      ? '¿Estás seguro de eliminar esta calificación?'
      : `¿Estás seguro de eliminar ${selectedCalificaciones.length} calificaciones?`;

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
      selectedCalificaciones.forEach(calificacionId => {
        batch.delete(doc(db, 'calificaciones', calificacionId));
      });

      await batch.commit();

      const count = selectedCalificaciones.length;
      setCalificaciones(calificaciones.filter(c => !selectedCalificaciones.includes(c.id)));
      setSelectedCalificaciones([]);
      setIsSelecting(false);
      success(`${count} calificación(es) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error al eliminar calificaciones:', error);
      showError('Error al eliminar las calificaciones');
    }
  };

  // Funciones para agregar por lotes
  const parsearBulkData = (texto) => {
    setBulkError('');
    const lineas = texto.split('\n').filter(linea => linea.trim() !== '');
    const calificacionesParseadas = [];

    lineas.forEach((linea, index) => {
      const columnas = linea.split('\t').map(col => col.trim());

      // Detectar si es encabezado (primera línea)
      if (index === 0 && (
        columnas[0]?.toLowerCase().includes('calificación') ||
        columnas[0]?.toLowerCase().includes('calificacion') ||
        columnas[0]?.toLowerCase().includes('nota') ||
        columnas[0]?.toLowerCase().includes('puntuación')
      )) {
        return; // Saltar encabezado
      }

      // Formato: Calificación | Materia
      const calificacion = parseFloat(columnas[0]);
      const materia = columnas[1] || '';

      // Validar
      if (isNaN(calificacion) || calificacion < 0 || calificacion > 10) {
        setBulkError(`Error en línea ${index + 1}: Calificación inválida: "${columnas[0]}" (debe ser un número entre 0 y 10)`);
        return;
      }

      if (!materia) {
        setBulkError(`Error en línea ${index + 1}: Falta el nombre de la materia`);
        return;
      }

      calificacionesParseadas.push({
        calificacion,
        materia
      });
    });

    setBulkPreview(calificacionesParseadas);
    return calificacionesParseadas;
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

  const handleBulkSubmit = async () => {
    if (bulkPreview.length === 0) {
      setBulkError('No hay calificaciones válidas para agregar');
      return;
    }

    setBulkProcessing(true);
    setBulkError('');

    try {
      const batch = writeBatch(db);
      const calificacionesRef = collection(db, 'calificaciones');
      const nivelBulkNombre = nivelBulkSeleccionado?.nombre || alumno?.nivel || '';
      const nivelBulkId = nivelBulkSeleccionado?.id || null;

      bulkPreview.forEach((calificacion) => {
        const nuevaCalificacionRef = doc(calificacionesRef);
        batch.set(nuevaCalificacionRef, {
          alumnoId: id,
          materia: calificacion.materia,
          calificacion: calificacion.calificacion,
          nivel: nivelBulkNombre,
          nivelId: nivelBulkId,
          nivelNombre: nivelBulkNombre,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });
      });

      await batch.commit();

      await Promise.all(
        bulkPreview.map((calificacion) =>
          actualizarEstadoMateriaPorCalificacion({
            materiaNombre: calificacion.materia,
            calificacionValor: calificacion.calificacion,
            nivelId: nivelBulkId,
            nivelNombre: nivelBulkNombre
          })
        )
      );

      // Recargar calificaciones
      const calificacionesQuery = query(
        collection(db, 'calificaciones'),
        where('alumnoId', '==', id)
      );
      const calificacionesSnapshot = await getDocs(calificacionesQuery);
      const calificacionesData = calificacionesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      calificacionesData.sort((a, b) => {
        return (a.materia || '').localeCompare(b.materia || '');
      });

      const calificacionesNormalizadas = normalizarCalificaciones(calificacionesData, nivelesHistorial, nivelActivo, alumno);
      setCalificaciones(calificacionesNormalizadas);
      setShowBulkModal(false);
      setBulkData('');
      setBulkPreview([]);
      success(`${bulkPreview.length} calificación(es) agregada(s) exitosamente`);
    } catch (error) {
      console.error('Error al agregar calificaciones por lotes:', error);
      setBulkError('Error al guardar las calificaciones: ' + error.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const materiasDisponibles = useMemo(() => {
    const referencia = formData.nivelNombre || nivelActivo?.nombre || alumno?.nivel || '';
    if (!referencia) {
      return [];
    }
    return getMateriasPorNivel(referencia);
  }, [formData.nivelNombre, nivelActivo, alumno]);

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="montessori"
        message="Cargando calificaciones..."
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
            Gestión de Calificaciones
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {alumno?.nombre} · Nivel actual: {nivelActualNombre}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            Mostrando: {nivelFiltroEtiqueta}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {canEdit && (
            <>
              <button
                onClick={() => {
                  setCalificacionEditando(null);
                  const nivelDefault = nivelActivo?.id
                    ? { id: nivelActivo.id, nombre: nivelActivo.nombre }
                    : (nivelesOpciones[0] || { id: '', nombre: '' });
                  setFormData({
                    materia: '',
                    calificacion: '',
                    nivelId: nivelDefault.id || '',
                    nivelNombre: nivelDefault.nombre || ''
                  });
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white bg-blue rounded-lg shadow-sm hover:bg-blue/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Agregar Calificación
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
            </>
          )}
        </div>
      </div>

      {/* Lista de calificaciones */}
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
            {hayCalificacionesSinNivel && (
              <button
                onClick={() => setNivelFiltro('sinNivel')}
                className={obtenerClaseFiltro('sinNivel')}
                type="button"
              >
                Sin nivel
              </button>
            )}
          </div>

          {calificaciones.length > 0 ? (
            <>
              {/* Botón para activar selección múltiple */}
              {!isSelecting && calificacionesFiltradas.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsSelecting(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Seleccionar múltiples
                  </button>
                </div>
              )}

              {isSelecting && (
                <div className="mb-4 p-3 bg-blue/10 dark:bg-blue/20 rounded-lg border border-blue/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-medium text-blue hover:text-blue/80"
                    >
                      {selectedCalificaciones.length === calificacionesFiltradas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCalificaciones.length} de {calificacionesFiltradas.length} seleccionadas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCalificaciones.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red bg-red/10 hover:bg-red/20 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Eliminar ({selectedCalificaciones.length})
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsSelecting(false);
                        setSelectedCalificaciones([]);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4 mr-1" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Agrupar calificaciones por rango */}
              {(() => {
                const agruparPorRango = (calificaciones) => {
                  const grupos = {
                    'Excelente (9-10)': [],
                    'Bueno (8-8.9)': [],
                    'Regular (7-7.9)': [],
                    'Insuficiente (<7)': [],
                    'Por cursar/Cursando': []
                  };

                  calificaciones.forEach(cal => {
                    const num = Number(cal.calificacion);
                    if (isNaN(num)) {
                      grupos['Por cursar/Cursando'].push(cal);
                    } else if (num === 0 || num === 1) {
                      grupos['Por cursar/Cursando'].push(cal);
                    } else if (num >= 9) {
                      grupos['Excelente (9-10)'].push(cal);
                    } else if (num >= 8) {
                      grupos['Bueno (8-8.9)'].push(cal);
                    } else if (num >= 7) {
                      grupos['Regular (7-7.9)'].push(cal);
                    } else {
                      grupos['Insuficiente (<7)'].push(cal);
                    }
                  });

                  return grupos;
                };

                const calificacionesPorRango = agruparPorRango(calificacionesFiltradas);

                const renderTarjetaCalificacion = (calificacion) => {
                  const num = Number(calificacion.calificacion);
                  const color = obtenerColorCalificacion(calificacion.calificacion);
                  let borderColor = 'border-gray-200 dark:border-gray-600';
                  let bgColor = 'bg-gray-50 dark:bg-gray-700/50';

                  if (!isNaN(num)) {
                    if (num >= 9) {
                      borderColor = 'border-green-300 dark:border-green-700';
                      bgColor = 'bg-green-50 dark:bg-green-900/20';
                    } else if (num >= 8) {
                      borderColor = 'border-blue-300 dark:border-blue-700';
                      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                    } else if (num >= 7) {
                      borderColor = 'border-yellow-300 dark:border-yellow-700';
                      bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                    } else if (num > 1) {
                      borderColor = 'border-red-300 dark:border-red-700';
                      bgColor = 'bg-red-50 dark:bg-red-900/20';
                    }
                  }

                  return (
                    <div key={calificacion.id} className={`${bgColor} rounded-lg p-4 border-2 ${borderColor} shadow-sm hover:shadow-md transition-shadow ${isSelecting && selectedCalificaciones.includes(calificacion.id) ? 'ring-2 ring-blue' : ''}`}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {calificacion.materia}
                          </h3>
                          <span className={`text-xl font-bold ${color}`}>
                            {formatearValorCalificacion(calificacion.calificacion)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm flex-1">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Nivel</p>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              {calificacion.nivelNombre || 'Sin nivel asignado'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2 justify-end">
                          {isSelecting && (
                            <input
                              type="checkbox"
                              checked={selectedCalificaciones.includes(calificacion.id)}
                              onChange={() => handleToggleSelect(calificacion.id)}
                              className="w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue"
                            />
                          )}
                          {!isSelecting && canEdit && (
                            <>
                              <button
                                onClick={() => handleEdit(calificacion)}
                                className="inline-flex items-center px-3 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm"
                                title="Editar calificación"
                              >
                                <PencilIcon className="w-4 h-4 mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(calificacion.id)}
                                className="inline-flex items-center px-3 py-2 bg-red/10 text-red rounded-lg hover:bg-red/20 dark:hover:bg-red/30 transition-colors text-sm border border-red/20"
                                title="Eliminar calificación"
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

                if (calificacionesFiltradas.length === 0) {
                  return (
                    <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700 text-center">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        No hay calificaciones registradas para este nivel.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Excelente (9-10) */}
                    {calificacionesPorRango['Excelente (9-10)'].length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold text-green dark:text-green-400 flex items-center gap-2">
                              <CheckCircleIcon className="w-6 h-6" />
                              Excelente (9-10) ({calificacionesPorRango['Excelente (9-10)'].length})
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {calificacionesPorRango['Excelente (9-10)'].map((cal) => renderTarjetaCalificacion(cal))}
                        </div>
                      </div>
                    )}

                    {/* Bueno (8-8.9) */}
                    {calificacionesPorRango['Bueno (8-8.9)'].length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold text-blue dark:text-blue-400 flex items-center gap-2">
                              <ChartBarIcon className="w-6 h-6" />
                              Bueno (8-8.9) ({calificacionesPorRango['Bueno (8-8.9)'].length})
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {calificacionesPorRango['Bueno (8-8.9)'].map((cal) => renderTarjetaCalificacion(cal))}
                        </div>
                      </div>
                    )}

                    {/* Regular (7-7.9) */}
                    {calificacionesPorRango['Regular (7-7.9)'].length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold text-yellow dark:text-yellow-400 flex items-center gap-2">
                              <ClockIcon className="w-6 h-6" />
                              Regular (7-7.9) ({calificacionesPorRango['Regular (7-7.9)'].length})
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {calificacionesPorRango['Regular (7-7.9)'].map((cal) => renderTarjetaCalificacion(cal))}
                        </div>
                      </div>
                    )}

                    {/* Insuficiente (<7) */}
                    {calificacionesPorRango['Insuficiente (<7)'].length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold text-red dark:text-red-400 flex items-center gap-2">
                              <ExclamationTriangleIcon className="w-6 h-6" />
                              Insuficiente (&lt;7) ({calificacionesPorRango['Insuficiente (<7)'].length})
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {calificacionesPorRango['Insuficiente (<7)'].map((cal) => renderTarjetaCalificacion(cal))}
                        </div>
                      </div>
                    )}

                    {/* Por cursar/Cursando */}
                    {calificacionesPorRango['Por cursar/Cursando'].length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <ClockIcon className="w-6 h-6" />
                              Por cursar/Cursando ({calificacionesPorRango['Por cursar/Cursando'].length})
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {calificacionesPorRango['Por cursar/Cursando'].map((cal) => renderTarjetaCalificacion(cal))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No hay calificaciones registradas para este alumno.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar calificación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {calificacionEditando ? 'Editar Calificación' : 'Agregar Calificación'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Materia *
                  </label>
                  <select
                    required
                    value={formData.materia}
                    onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calificación *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.calificacion}
                    onChange={(e) => setFormData({ ...formData, calificacion: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setCalificacionEditando(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90"
                  >
                    {calificacionEditando ? 'Actualizar' : 'Agregar'}
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
                Agregar Calificaciones por Lotes
              </h2>

              <div className="mb-4 p-4 bg-blue/10 dark:bg-blue/20 rounded-lg border border-blue/20">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Instrucciones:</strong>
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                  <li>En Excel, selecciona las columnas: <strong>Materia | Calificación</strong></li>
                  <li>Copia las celdas (Ctrl+C o Cmd+C)</li>
                  <li>Pega aquí abajo (Ctrl+V o Cmd+V)</li>
                  <li>Revisa la vista previa y guarda</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Usa números con punto decimal si necesitas promedios (ejemplo: 9.5)
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asignar al nivel
                  </label>
                  <select
                    value={bulkNivelId || ''}
                    onChange={(e) => setBulkNivelId(e.target.value)}
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
                  placeholder="95	Matemáticas"
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
                    Vista previa ({bulkPreview.length} calificaciones):
                  </p>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Materia</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Calificación</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {bulkPreview.map((calificacion, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{calificacion.materia}</td>
                            <td className={`px-3 py-2 font-bold ${obtenerColorCalificacion(calificacion.calificacion)}`}>
                              {formatearValorCalificacion(calificacion.calificacion)}
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
                  Agregar {bulkPreview.length > 0 ? `${bulkPreview.length} ` : ''}Calificaciones
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCalificaciones;
