import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, CalendarIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingButton from '../../components/LoadingButton';
import { formatearFechaLarga, formatearFechaInput } from '../../utils/formatearFecha';

const GestionMaterias = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [materias, setMaterias] = useState([]);
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
    estado: 'Pendiente'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos del alumno
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          const alumnoData = { id: alumnoDoc.id, ...alumnoDoc.data() };
          setAlumno(alumnoData);
          
          // Cargar materias del alumno
          const materiasQuery = query(
            collection(db, 'materias'),
            where('alumnoId', '==', id)
          );
          const materiasSnapshot = await getDocs(materiasQuery);
          const materiasData = materiasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Ordenar manualmente: primero las que tienen fecha, luego las que no
          materiasData.sort((a, b) => {
            const fechaA = a.fechaInicio?.toDate ? a.fechaInicio.toDate() : null;
            const fechaB = b.fechaInicio?.toDate ? b.fechaInicio.toDate() : null;
            if (!fechaA && !fechaB) return 0;
            if (!fechaA) return 1;
            if (!fechaB) return -1;
            return fechaA - fechaB;
          });
          setMaterias(materiasData);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const materiaData = {
        alumnoId: id,
        nombre: formData.nombre,
        nivel: alumno?.nivel || '',
        fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio) : null,
        fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : null,
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

      // Recargar materias
      const materiasQuery = query(
        collection(db, 'materias'),
        where('alumnoId', '==', id)
      );
      const materiasSnapshot = await getDocs(materiasQuery);
      const materiasData = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar manualmente: primero las que tienen fecha, luego las que no
      materiasData.sort((a, b) => {
        const fechaA = a.fechaInicio?.toDate ? a.fechaInicio.toDate() : null;
        const fechaB = b.fechaInicio?.toDate ? b.fechaInicio.toDate() : null;
        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1;
        if (!fechaB) return -1;
        return fechaA - fechaB;
      });
      setMaterias(materiasData);

      setShowModal(false);
      setMateriaEditando(null);
      setFormData({
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        aula: '',
        estado: 'Pendiente'
      });
    } catch (error) {
      console.error('Error al guardar materia:', error);
      alert('Error al guardar la materia');
    }
  };

  const handleEdit = (materia) => {
    setMateriaEditando(materia);
    setFormData({
      nombre: materia.nombre,
      fechaInicio: formatearFechaInput(materia.fechaInicio),
      fechaFin: formatearFechaInput(materia.fechaFin),
      aula: materia.aula || '',
      estado: materia.estado || 'Pendiente'
    });
    setShowModal(true);
  };

  const handleDelete = async (materiaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta materia?')) {
      try {
        await deleteDoc(doc(db, 'materias', materiaId));
        setMaterias(materias.filter(m => m.id !== materiaId));
      } catch (error) {
        console.error('Error al eliminar materia:', error);
        alert('Error al eliminar la materia');
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
    if (selectedMaterias.length === materias.length) {
      setSelectedMaterias([]);
    } else {
      setSelectedMaterias(materias.map(m => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMaterias.length === 0) return;
    
    const confirmMessage = selectedMaterias.length === 1
      ? '¿Estás seguro de eliminar esta materia?'
      : `¿Estás seguro de eliminar ${selectedMaterias.length} materias?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const batch = writeBatch(db);
      selectedMaterias.forEach(materiaId => {
        batch.delete(doc(db, 'materias', materiaId));
      });
      
      await batch.commit();
      
      setMaterias(materias.filter(m => !selectedMaterias.includes(m.id)));
      setSelectedMaterias([]);
      setIsSelecting(false);
      alert(`✅ ${selectedMaterias.length} materia(s) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error al eliminar materias:', error);
      alert('Error al eliminar las materias');
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
    const formatoDMY = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const matchDMY = fechaStrTrimmed.match(formatoDMY);
    if (matchDMY) {
      const [, dia, mes, año] = matchDMY;
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Formato MM/DD/YYYY o MM-DD-YYYY
    const formatoMDY = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
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

  const parsearBulkData = (texto) => {
    setBulkError('');
    const lineas = texto.split('\n').filter(linea => linea.trim() !== '');
    const materiasParseadas = [];
    
    lineas.forEach((linea, index) => {
      const columnas = linea.split('\t').map(col => col.trim());
      
      // Detectar si es encabezado (primera línea)
      if (index === 0 && (
        columnas[0]?.toLowerCase().includes('materia') ||
        columnas[0]?.toLowerCase().includes('nombre') ||
        columnas[0]?.toLowerCase().includes('asignatura')
      )) {
        return; // Saltar encabezado
      }
      
      // Esperamos: Materia | Fecha Inicio | Fecha Fin | Aula | Estado
      const materia = {
        nombre: columnas[0] || '',
        fechaInicio: parsearFecha(columnas[1]),
        fechaFin: parsearFecha(columnas[2]),
        aula: columnas[3] || '',
        estado: columnas[4] || 'Pendiente'
      };
      
      // Validar
      if (!materia.nombre) {
        setBulkError(`Error en línea ${index + 1}: Falta el nombre de la materia`);
        return;
      }
      
      if (!materia.fechaInicio) {
        setBulkError(`Error en línea ${index + 1}: Fecha de inicio inválida: "${columnas[1]}"`);
        return;
      }
      
      // Validar estado
      const estadosValidos = ['Pendiente', 'En curso', 'Con atraso', 'Completada'];
      if (materia.estado && !estadosValidos.includes(materia.estado)) {
        materia.estado = 'Pendiente';
      }
      
      materiasParseadas.push(materia);
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

      bulkPreview.forEach((materia) => {
        const nuevaMateriaRef = doc(materiasRef);
        batch.set(nuevaMateriaRef, {
          alumnoId: id,
          nombre: materia.nombre,
          nivel: alumno?.nivel || '',
          fechaInicio: materia.fechaInicio ? new Date(materia.fechaInicio) : null,
          fechaFin: materia.fechaFin ? new Date(materia.fechaFin) : null,
          aula: materia.aula || null,
          estado: materia.estado,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });
      });

      await batch.commit();

      // Recargar materias
      const materiasQuery = query(
        collection(db, 'materias'),
        where('alumnoId', '==', id)
      );
      const materiasSnapshot = await getDocs(materiasQuery);
      const materiasData = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      materiasData.sort((a, b) => {
        const fechaA = a.fechaInicio?.toDate ? a.fechaInicio.toDate() : null;
        const fechaB = b.fechaInicio?.toDate ? b.fechaInicio.toDate() : null;
        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1;
        if (!fechaB) return -1;
        return fechaA - fechaB;
      });
      
      setMaterias(materiasData);
      setShowBulkModal(false);
      setBulkData('');
      setBulkPreview([]);
      alert(`✅ ${bulkPreview.length} materias agregadas exitosamente`);
    } catch (error) {
      console.error('Error al agregar materias por lotes:', error);
      setBulkError('Error al guardar las materias: ' + error.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const materiasDisponibles = alumno?.nivel ? getMateriasPorNivel(alumno.nivel) : [];

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
            {alumno?.nombre} - {alumno?.nivel}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => {
              setMateriaEditando(null);
              setFormData({
                nombre: '',
                fechaInicio: '',
                fechaFin: '',
                aula: '',
                estado: 'Pendiente'
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
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 bg-green rounded-lg shadow-sm hover:bg-green/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2 transition-all duration-200"
          >
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Agregar por Lotes
          </button>
        </div>
      </div>

      {/* Lista de materias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Barra de acciones de selección múltiple */}
          {isSelecting && (
            <div className="mb-4 p-3 bg-blue/10 dark:bg-blue/20 rounded-lg border border-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue hover:text-blue/80"
                >
                  {selectedMaterias.length === materias.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMaterias.length} de {materias.length} seleccionadas
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
          {!isSelecting && materias.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setIsSelecting(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Seleccionar múltiples
              </button>
            </div>
          )}

          <div className="space-y-4">
            {materias.map((materia) => (
              <div key={materia.id} className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border ${isSelecting && selectedMaterias.includes(materia.id) ? 'border-blue ring-2 ring-blue' : 'border-gray-200 dark:border-gray-600'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {isSelecting && (
                      <input
                        type="checkbox"
                        checked={selectedMaterias.includes(materia.id)}
                        onChange={() => handleToggleSelect(materia.id)}
                        className="mt-1 w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue"
                      />
                    )}
                    <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {materia.nombre}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {materia.fechaInicio && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          <span>Inicio: {formatearFechaLarga(materia.fechaInicio)}</span>
                        </div>
                      )}
                      {materia.fechaFin && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          <span>Fin: {formatearFechaLarga(materia.fechaFin)}</span>
                        </div>
                      )}
                      {materia.aula && (
                        <div>Aula: {materia.aula}</div>
                      )}
                    </div>
                    {materia.estado && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          materia.estado === 'Completada' 
                            ? 'bg-green text-gray-900 dark:bg-green/80 dark:text-white'
                            : materia.estado === 'En curso'
                            ? 'bg-blue text-white'
                            : materia.estado === 'Con atraso'
                            ? 'bg-red text-white'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                        }`}>
                          {materia.estado}
                        </span>
                      </div>
                    )}
                    </div>
                  </div>
                  {!isSelecting && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(materia)}
                        className="p-2 text-blue hover:bg-blue/10 rounded-lg transition-colors"
                        aria-label="Editar"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(materia.id)}
                        className="p-2 text-red hover:bg-red/10 rounded-lg transition-colors"
                        aria-label="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {materias.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No hay materias registradas para este alumno.
              </p>
            </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de fin
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
                  <li>En Excel, selecciona las columnas: <strong>Materia | Fecha Inicio | Fecha Fin | Aula | Estado</strong></li>
                  <li>Copia las celdas (Ctrl+C o Cmd+C)</li>
                  <li>Pega aquí abajo (Ctrl+V o Cmd+V)</li>
                  <li>Revisa la vista previa y guarda</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Formatos de fecha aceptados: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pega los datos de Excel aquí:
                </label>
                <textarea
                  value={bulkData}
                  onChange={handleBulkChange}
                  onPaste={handleBulkPaste}
                  placeholder="Materia	01/01/2024	30/06/2024	Aula 1	En curso"
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Materia</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Inicio</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fin</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Aula</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {bulkPreview.map((materia, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{materia.nombre}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.fechaInicio || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.fechaFin || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.aula || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{materia.estado}</td>
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

