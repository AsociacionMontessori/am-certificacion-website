import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ChartBarIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingButton from '../../components/LoadingButton';

const GestionCalificaciones = () => {
  const { id } = useParams();
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
    calificacion: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          setAlumno({ id: alumnoDoc.id, ...alumnoDoc.data() });
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
        
        setCalificaciones(calificacionesData);
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
      const calificacionData = {
        alumnoId: id,
        materia: formData.materia,
        calificacion: parseFloat(formData.calificacion),
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
      
      setCalificaciones(calificacionesData);

      setShowModal(false);
      setCalificacionEditando(null);
      setFormData({
        materia: '',
        calificacion: ''
      });
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      alert('Error al guardar la calificación');
    }
  };

  const handleEdit = (calificacion) => {
    setCalificacionEditando(calificacion);
    setFormData({
      materia: calificacion.materia,
      calificacion: calificacion.calificacion?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (calificacionId) => {
    if (window.confirm('¿Estás seguro de eliminar esta calificación?')) {
      try {
        await deleteDoc(doc(db, 'calificaciones', calificacionId));
        setCalificaciones(calificaciones.filter(c => c.id !== calificacionId));
      } catch (error) {
        console.error('Error al eliminar calificación:', error);
        alert('Error al eliminar la calificación');
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
    if (selectedCalificaciones.length === calificaciones.length) {
      setSelectedCalificaciones([]);
    } else {
      setSelectedCalificaciones(calificaciones.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCalificaciones.length === 0) return;
    
    const confirmMessage = selectedCalificaciones.length === 1
      ? '¿Estás seguro de eliminar esta calificación?'
      : `¿Estás seguro de eliminar ${selectedCalificaciones.length} calificaciones?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const batch = writeBatch(db);
      selectedCalificaciones.forEach(calificacionId => {
        batch.delete(doc(db, 'calificaciones', calificacionId));
      });
      
      await batch.commit();
      
      setCalificaciones(calificaciones.filter(c => !selectedCalificaciones.includes(c.id)));
      setSelectedCalificaciones([]);
      setIsSelecting(false);
      alert(`✅ ${selectedCalificaciones.length} calificación(es) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error al eliminar calificaciones:', error);
      alert('Error al eliminar las calificaciones');
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
      if (isNaN(calificacion) || calificacion < 0 || calificacion > 100) {
        setBulkError(`Error en línea ${index + 1}: Calificación inválida: "${columnas[0]}" (debe ser un número entre 0 y 100)`);
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

      bulkPreview.forEach((calificacion) => {
        const nuevaCalificacionRef = doc(calificacionesRef);
        batch.set(nuevaCalificacionRef, {
          alumnoId: id,
          materia: calificacion.materia,
          calificacion: calificacion.calificacion,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });
      });

      await batch.commit();

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
      
      setCalificaciones(calificacionesData);
      setShowBulkModal(false);
      setBulkData('');
      setBulkPreview([]);
      alert(`✅ ${bulkPreview.length} calificación(es) agregada(s) exitosamente`);
    } catch (error) {
      console.error('Error al agregar calificaciones por lotes:', error);
      setBulkError('Error al guardar las calificaciones: ' + error.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const obtenerColorCalificacion = (calificacion) => {
    if (calificacion >= 90) return 'text-green';
    if (calificacion >= 80) return 'text-blue';
    if (calificacion >= 70) return 'text-yellow';
    return 'text-red';
  };

  const materiasDisponibles = alumno?.nivel ? getMateriasPorNivel(alumno.nivel) : [];

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
            {alumno?.nombre} - {alumno?.nivel}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => {
              setCalificacionEditando(null);
              setFormData({
                materia: '',
                calificacion: ''
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
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 bg-green rounded-lg shadow-sm hover:bg-green/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2 transition-all duration-200"
          >
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Agregar por Lotes
          </button>
        </div>
      </div>

      {/* Lista de calificaciones */}
      {calificaciones.length > 0 ? (
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
                    {selectedCalificaciones.length === calificaciones.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCalificaciones.length} de {calificaciones.length} seleccionadas
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

            {/* Botón para activar selección múltiple */}
            {!isSelecting && calificaciones.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setIsSelecting(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Seleccionar múltiples
                </button>
              </div>
            )}

            <div className="space-y-3">
              {calificaciones.map((calificacion) => (
                <div key={calificacion.id} className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border ${isSelecting && selectedCalificaciones.includes(calificacion.id) ? 'border-blue ring-2 ring-blue' : 'border-gray-200 dark:border-gray-600'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {isSelecting && (
                        <input
                          type="checkbox"
                          checked={selectedCalificaciones.includes(calificacion.id)}
                          onChange={() => handleToggleSelect(calificacion.id)}
                          className="mt-1 w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {calificacion.materia}
                          </h3>
                          <span className={`text-xl sm:text-2xl font-bold ${obtenerColorCalificacion(calificacion.calificacion)}`}>
                            {calificacion.calificacion || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isSelecting && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(calificacion)}
                          className="p-2 text-blue hover:bg-blue/10 rounded-lg transition-colors"
                          aria-label="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(calificacion.id)}
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
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay calificaciones registradas para este alumno.
          </p>
        </div>
      )}

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
                    Calificación *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
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
                  <li>En Excel, selecciona las columnas: <strong>Calificación | Materia</strong></li>
                  <li>Copia las celdas (Ctrl+C o Cmd+C)</li>
                  <li>Pega aquí abajo (Ctrl+V o Cmd+V)</li>
                  <li>Revisa la vista previa y guarda</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  La calificación debe ser un número entre 0 y 100
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
                              {calificacion.calificacion}
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

