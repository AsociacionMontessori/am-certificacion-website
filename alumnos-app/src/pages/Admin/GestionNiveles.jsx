import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';
import { obtenerNiveles, crearNivel, actualizarNivel, eliminarNivel } from '../../services/nivelesService';

const GestionNiveles = () => {
  const canEdit = useCanEdit();
  const { success, error: showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [niveles, setNiveles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNivel, setEditingNivel] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadNiveles();
  }, []);

  const loadNiveles = async () => {
    setLoading(true);
    try {
      const resultado = await obtenerNiveles();
      if (resultado.success) {
        setNiveles(resultado.niveles);
      } else {
        showError('Error al cargar los niveles');
      }
    } catch (error) {
      console.error('Error al cargar niveles:', error);
      showError('Error al cargar los niveles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (nivel = null) => {
    if (!canEdit) return;
    
    if (nivel) {
      setEditingNivel(nivel);
      setFormData({
        nombre: nivel.nombre || '',
        descripcion: nivel.descripcion || ''
      });
    } else {
      setEditingNivel(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNivel(null);
    setFormData({
      nombre: '',
      descripcion: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      let resultado;
      
      if (editingNivel) {
        resultado = await actualizarNivel(editingNivel.id, formData);
      } else {
        resultado = await crearNivel(formData);
      }

      if (resultado.success) {
        success(editingNivel ? 'Nivel actualizado exitosamente' : 'Nivel creado exitosamente');
        handleCloseModal();
        loadNiveles();
      } else {
        showError(resultado.error || 'Error al guardar el nivel');
      }
    } catch (error) {
      console.error('Error al guardar nivel:', error);
      showError('Error al guardar el nivel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nivelId) => {
    if (!canEdit) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar este nivel? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleting(nivelId);
    try {
      const resultado = await eliminarNivel(nivelId);
      if (resultado.success) {
        success('Nivel eliminado exitosamente');
        loadNiveles();
      } else {
        showError(resultado.error || 'Error al eliminar el nivel');
      }
    } catch (error) {
      console.error('Error al eliminar nivel:', error);
      showError('Error al eliminar el nivel');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="xl" variant="montessori" message="Cargando niveles..." />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Link
        to="/admin/crear-usuario"
        className="inline-flex items-center text-blue hover:text-blue/80 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Volver a Crear Usuario
      </Link>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Niveles
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Crea y gestiona los niveles académicos disponibles
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Nivel
          </button>
        )}
      </div>

      {/* Lista de Niveles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {niveles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No hay niveles creados. {canEdit && 'Crea el primer nivel haciendo clic en "Crear Nivel".'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {niveles.map((nivel) => (
              <div
                key={nivel.id}
                className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {nivel.nombre}
                      </h3>
                      {nivel.activo === false && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {nivel.descripcion && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {nivel.descripcion}
                      </p>
                    )}
                    {nivel.fechaCreacion && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Creado: {nivel.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenModal(nivel)}
                        className="p-2 text-blue hover:bg-blue/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(nivel.id)}
                        disabled={deleting === nivel.id}
                        className="p-2 text-red hover:bg-red/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deleting === nivel.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red"></div>
                        ) : (
                          <TrashIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar Nivel */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingNivel ? 'Editar Nivel' : 'Crear Nuevo Nivel'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Nivel *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Propedéutico, Casa de Niños, etc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción del nivel..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5 mr-2" />
                      {editingNivel ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionNiveles;

