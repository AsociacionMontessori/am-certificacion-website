import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getMateriasPorNivel } from '../../data/materiasPorNivel';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';

const GestionMaterias = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    profesor: '',
    aula: '',
    horario: '',
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
        profesor: formData.profesor || null,
        aula: formData.aula || null,
        horario: formData.horario || null,
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
        profesor: '',
        aula: '',
        horario: '',
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
      fechaInicio: materia.fechaInicio?.toDate ? materia.fechaInicio.toDate().toISOString().split('T')[0] : '',
      fechaFin: materia.fechaFin?.toDate ? materia.fechaFin.toDate().toISOString().split('T')[0] : '',
      profesor: materia.profesor || '',
      aula: materia.aula || '',
      horario: materia.horario || '',
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

  const materiasDisponibles = alumno?.nivel ? getMateriasPorNivel(alumno.nivel) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
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
        <button
          onClick={() => {
            setMateriaEditando(null);
            setFormData({
              nombre: '',
              fechaInicio: '',
              fechaFin: '',
              profesor: '',
              aula: '',
              horario: '',
              estado: 'Pendiente'
            });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white bg-blue rounded-lg shadow-sm hover:bg-blue/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Agregar Materia
        </button>
      </div>

      {/* Lista de materias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {materias.map((materia) => (
              <div key={materia.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {materia.nombre}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {materia.fechaInicio && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          <span>Inicio: {materia.fechaInicio.toDate ? materia.fechaInicio.toDate().toLocaleDateString() : materia.fechaInicio}</span>
                        </div>
                      )}
                      {materia.fechaFin && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          <span>Fin: {materia.fechaFin.toDate ? materia.fechaFin.toDate().toLocaleDateString() : materia.fechaFin}</span>
                        </div>
                      )}
                      {materia.profesor && (
                        <div>Profesor: {materia.profesor}</div>
                      )}
                      {materia.aula && (
                        <div>Aula: {materia.aula}</div>
                      )}
                      {materia.horario && (
                        <div>Horario: {materia.horario}</div>
                      )}
                    </div>
                    {materia.estado && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          materia.estado === 'Completada' 
                            ? 'bg-green text-white'
                            : materia.estado === 'En curso'
                            ? 'bg-blue text-white'
                            : 'bg-gray text-white'
                        }`}>
                          {materia.estado}
                        </span>
                      </div>
                    )}
                  </div>
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
                      Profesor
                    </label>
                    <input
                      type="text"
                      value={formData.profesor}
                      onChange={(e) => setFormData({ ...formData, profesor: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horario
                    </label>
                    <input
                      type="text"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      placeholder="Ej: Lunes y Miércoles 10:00-12:00"
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
    </div>
  );
};

export default GestionMaterias;

