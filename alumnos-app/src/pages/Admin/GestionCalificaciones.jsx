import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';

const GestionCalificaciones = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [calificacionEditando, setCalificacionEditando] = useState(null);
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
      </div>

      {/* Lista de calificaciones */}
      {calificaciones.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {calificaciones.map((calificacion) => (
                <div key={calificacion.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
    </div>
  );
};

export default GestionCalificaciones;

