import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ArrowLeftIcon, UserGroupIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';

const GestionGrupos = () => {
  const canEdit = useCanEdit();
  const { success, error: showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [usuariosGrupos, setUsuariosGrupos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [alumnosAsignados, setAlumnosAsignados] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar usuarios de grupos
        const gruposQuery = query(
          collection(db, 'grupos'),
          orderBy('nombre', 'asc')
        );
        const gruposSnapshot = await getDocs(gruposQuery);
        const gruposData = gruposSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuariosGrupos(gruposData);

        // Cargar todos los alumnos
        const alumnosQuery = query(
          collection(db, 'alumnos'),
          orderBy('nombre', 'asc')
        );
        const alumnosSnapshot = await getDocs(alumnosQuery);
        const alumnosData = alumnosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumnos(alumnosData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showError('Error al cargar los datos');
      }
      setLoading(false);
    };

    loadData();
  }, [showError]);

  const handleSelectUsuario = async (usuarioId) => {
    try {
      const usuarioDoc = await getDoc(doc(db, 'grupos', usuarioId));
      if (usuarioDoc.exists()) {
        const data = usuarioDoc.data();
        setUsuarioSeleccionado({
          id: usuarioDoc.id,
          ...data
        });
        setAlumnosAsignados(data.alumnosAsignados || []);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      showError('Error al cargar el usuario');
    }
  };

  const handleToggleAlumno = (alumnoId) => {
    if (!canEdit) return;
    
    setAlumnosAsignados(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(id => id !== alumnoId);
      } else {
        return [...prev, alumnoId];
      }
    });
  };

  const handleSave = async () => {
    if (!canEdit || !usuarioSeleccionado) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'grupos', usuarioSeleccionado.id), {
        alumnosAsignados: alumnosAsignados
      });
      success('Alumnos asignados correctamente');
      
      // Actualizar el estado local
      setUsuariosGrupos(prev => prev.map(u => 
        u.id === usuarioSeleccionado.id 
          ? { ...u, alumnosAsignados }
          : u
      ));
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al guardar las asignaciones');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg" 
        variant="montessori"
        message="Cargando usuarios de grupos..."
        className="h-64"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center text-blue hover:text-blue/80 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Gestión de Grupos
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Asigna alumnos a usuarios de grupos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de usuarios de grupos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usuarios de Grupos
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {usuariosGrupos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay usuarios de grupos registrados
              </p>
            ) : (
              usuariosGrupos.map((usuario) => (
                <button
                  key={usuario.id}
                  onClick={() => handleSelectUsuario(usuario.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    usuarioSeleccionado?.id === usuario.id
                      ? 'border-blue bg-blue/5 dark:bg-blue/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {usuario.nombre || usuario.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {usuario.email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {usuario.alumnosAsignados?.length || 0} alumnos asignados
                      </p>
                    </div>
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Asignación de alumnos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          {usuarioSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Alumnos Asignados
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {usuarioSeleccionado.nombre || usuarioSeleccionado.email}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {alumnos.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No hay alumnos registrados
                  </p>
                ) : (
                  alumnos.map((alumno) => {
                    const isSelected = alumnosAsignados.includes(alumno.id);
                    return (
                      <label
                        key={alumno.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue bg-blue/5 dark:bg-blue/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAlumno(alumno.id)}
                          disabled={!canEdit}
                          className="w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alumno.nombre || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {alumno.email} {alumno.nivel ? `• ${alumno.nivel}` : ''}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un usuario de grupos para asignar alumnos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionGrupos;

