import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadAlumnos = async () => {
      try {
        const alumnosQuery = query(
          collection(db, 'alumnos'),
          orderBy('nombre', 'asc')
        );
        const querySnapshot = await getDocs(alumnosQuery);
        const alumnosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumnos(alumnosData);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      }
      setLoading(false);
    };

    loadAlumnos();
  }, []);

  const filteredAlumnos = alumnos.filter(alumno => {
    const search = searchTerm.toLowerCase();
    return (
      alumno.nombre?.toLowerCase().includes(search) ||
      alumno.email?.toLowerCase().includes(search) ||
      alumno.matricula?.toLowerCase().includes(search) ||
      alumno.programa?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: alumnos.length,
    activos: alumnos.filter(a => a.estado === 'Activo').length,
    graduados: alumnos.filter(a => a.estado === 'Graduado').length,
    inactivos: alumnos.filter(a => a.estado === 'Inactivo').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel de Administración
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestión de alumnos y certificaciones
          </p>
        </div>
        <Link
          to="/admin/crear-usuario"
          className="inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Crear Usuario
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Alumnos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-green">{stats.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="w-8 h-8 text-yellow mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Graduados</p>
              <p className="text-2xl font-bold text-yellow">{stats.graduados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-gray mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactivos</p>
              <p className="text-2xl font-bold text-gray">{stats.inactivos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, matrícula o programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {/* Lista de Alumnos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Programa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlumnos.map((alumno) => (
                <tr key={alumno.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {alumno.nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.matricula || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.programa || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alumno.estado === 'Activo' 
                        ? 'bg-green text-white'
                        : alumno.estado === 'Graduado'
                        ? 'bg-yellow text-white'
                        : 'bg-gray text-white'
                    }`}>
                      {alumno.estado || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/alumno/${alumno.id}`}
                      className="text-blue hover:text-blue/80 mr-3"
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/public/alumno/${alumno.id}`}
                      target="_blank"
                      className="text-green hover:text-green/80"
                    >
                      Público
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAlumnos.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

