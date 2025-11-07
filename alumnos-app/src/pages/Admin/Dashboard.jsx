import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserPlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  SparklesIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import AlertasMateriasProximas from '../../components/AlertasMateriasProximas';
import useCanEdit from '../../hooks/useCanEdit';
import { useAuth } from '../../contexts/AuthContext';
import { obtenerNiveles } from '../../services/nivelesService';
import { getEstadoBadgeClasses } from '../../utils/estadoBadgeClasses';

const AdminDashboard = () => {
  const canEdit = useCanEdit();
  const { userData } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [ultimoAlumnoId, setUltimoAlumnoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [ordenPor, setOrdenPor] = useState('nombre'); // 'nombre', 'fechaIngreso', 'nivel'
  const [ordenDireccion, setOrdenDireccion] = useState('asc'); // 'asc', 'desc'
  const [nivelesDisponibles, setNivelesDisponibles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Por defecto, tarjetas en móvil y tabla en desktop
    // Guardar preferencia en localStorage
    const saved = localStorage.getItem('adminViewMode');
    return saved || 'auto'; // 'auto', 'table', 'cards'
  });

  useEffect(() => {
    const loadAlumnos = async () => {
      try {
        let alumnosData;
        
        // Si es usuario de grupos, solo cargar alumnos asignados
        if (userData?.rol === 'grupos' && userData?.alumnosAsignados?.length > 0) {
          // Cargar solo los alumnos asignados
          const alumnosPromises = userData.alumnosAsignados.map(async (alumnoId) => {
            const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId));
            if (alumnoDoc.exists()) {
              return { id: alumnoDoc.id, ...alumnoDoc.data() };
            }
            return null;
          });
          alumnosData = (await Promise.all(alumnosPromises)).filter(a => a !== null);
        } else {
          // Admin y directivo cargan todos los alumnos
          const alumnosQuery = query(
            collection(db, 'alumnos'),
            orderBy('nombre', 'asc')
          );
          const querySnapshot = await getDocs(alumnosQuery);
          alumnosData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        
        setAlumnos(alumnosData);

        // Determinar el último alumno agregado por fechaCreacion
        let latest = null;
        for (const a of alumnosData) {
          const fc = a?.fechaCreacion;
          let date;
          if (fc?.toDate) {
            date = fc.toDate();
          } else if (fc?.seconds) {
            date = new Date(fc.seconds * 1000);
          } else if (fc instanceof Date) {
            date = fc;
          } else {
            continue;
          }
          if (!latest || date > latest.date) {
            latest = { id: a.id, date };
          }
        }
        setUltimoAlumnoId(latest?.id || null);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      }
      setLoading(false);
    };

    loadAlumnos();
  }, [userData]);

  // Cargar niveles disponibles
  useEffect(() => {
    const loadNiveles = async () => {
      try {
        const resultado = await obtenerNiveles();
        if (resultado.success) {
          const nivelesActivos = resultado.niveles
            .filter(n => n.activo !== false)
            .map(n => n.nombre);
          setNivelesDisponibles(nivelesActivos);
        }
      } catch (error) {
        console.error('Error al cargar niveles:', error);
      }
    };
    loadNiveles();
  }, []);

  // Solo resaltar el último alumno agregado
  const esUltimoAlumno = (alumno) => alumno?.id === ultimoAlumnoId;

  // Función para convertir fecha a Date
  const getDate = (fecha) => {
    if (!fecha) return null;
    if (fecha?.toDate) return fecha.toDate();
    if (fecha?.seconds) return new Date(fecha.seconds * 1000);
    if (fecha instanceof Date) return fecha;
    if (typeof fecha === 'string') return new Date(fecha);
    return null;
  };

  const filteredAlumnos = alumnos
    .filter(alumno => {
      // Filtro de búsqueda
      const search = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || (
        alumno.nombre?.toLowerCase().includes(search) ||
        alumno.email?.toLowerCase().includes(search) ||
        alumno.matricula?.toLowerCase().includes(search) ||
        alumno.nivel?.toLowerCase().includes(search)
      );

      // Filtro por nivel
      const matchNivel = !filtroNivel || alumno.nivel === filtroNivel;

      // Filtro por estado
      const matchEstado = !filtroEstado || alumno.estado === filtroEstado;

      // Filtro por fecha de ingreso
      let matchFecha = true;
      if (filtroFechaInicio || filtroFechaFin) {
        const fechaIngreso = getDate(alumno.fechaIngreso);
        if (fechaIngreso) {
          const fechaInicio = filtroFechaInicio ? new Date(filtroFechaInicio) : null;
          const fechaFin = filtroFechaFin ? new Date(filtroFechaFin + 'T23:59:59') : null;
          
          if (fechaInicio && fechaFin) {
            matchFecha = fechaIngreso >= fechaInicio && fechaIngreso <= fechaFin;
          } else if (fechaInicio) {
            matchFecha = fechaIngreso >= fechaInicio;
          } else if (fechaFin) {
            matchFecha = fechaIngreso <= fechaFin;
          }
        } else {
          matchFecha = false; // Si no tiene fecha de ingreso y se está filtrando, no mostrar
        }
      }

      return matchSearch && matchNivel && matchEstado && matchFecha;
    })
    .sort((a, b) => {
      // El último alumno agregado siempre va primero
      if (a.id === ultimoAlumnoId) return -1;
      if (b.id === ultimoAlumnoId) return 1;

      let comparison = 0;

      switch (ordenPor) {
        case 'nombre':
          comparison = (a.nombre || '').localeCompare(b.nombre || '');
          break;
        case 'fechaIngreso': {
          const fechaA = getDate(a.fechaIngreso);
          const fechaB = getDate(b.fechaIngreso);
          if (!fechaA && !fechaB) comparison = 0;
          else if (!fechaA) comparison = 1;
          else if (!fechaB) comparison = -1;
          else comparison = fechaA.getTime() - fechaB.getTime();
          break;
        }
        case 'nivel':
          comparison = (a.nivel || '').localeCompare(b.nivel || '');
          break;
        default:
          comparison = (a.nombre || '').localeCompare(b.nombre || '');
      }

      return ordenDireccion === 'asc' ? comparison : -comparison;
    });

  const limpiarFiltros = () => {
    setFiltroNivel('');
    setFiltroEstado('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setSearchTerm('');
  };

  const tieneFiltrosActivos = filtroNivel || filtroEstado || filtroFechaInicio || filtroFechaFin || searchTerm;

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Alertas de Materias Próximas */}
      <AlertasMateriasProximas />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Panel de Administración
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Gestión de alumnos y certificaciones
          </p>
        </div>
        {canEdit && (
          <Link
            to="/admin/crear-usuario"
            className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white bg-blue rounded-lg shadow-sm hover:bg-blue/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all duration-200 self-start sm:self-auto"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Crear Usuario
          </Link>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Alumnos', value: stats.total, icon: UserGroupIcon, iconBg: 'bg-blue/10 dark:bg-blue/20', iconColor: 'text-blue', valueColor: 'text-blue' },
          { label: 'Activos', value: stats.activos, icon: AcademicCapIcon, iconBg: 'bg-green/10 dark:bg-green/20', iconColor: 'text-green', valueColor: 'text-green' },
          { label: 'Graduados', value: stats.graduados, icon: DocumentTextIcon, iconBg: 'bg-yellow/10 dark:bg-yellow/20', iconColor: 'text-yellow', valueColor: 'text-yellow' },
          { label: 'Inactivos', value: stats.inactivos, icon: UserGroupIcon, iconBg: 'bg-gray/10 dark:bg-gray/20', iconColor: 'text-gray', valueColor: 'text-gray' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 p-5 sm:p-6 hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:gap-4">
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{stat.label}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.valueColor} mt-1`}>{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda, Filtros y Vista */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 p-4 sm:p-5 space-y-4">
        {/* Primera fila: Búsqueda y controles */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, matrícula o nivel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters || tieneFiltrosActivos
                  ? 'bg-blue text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
              {tieneFiltrosActivos && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {[filtroNivel, filtroEstado, filtroFechaInicio, filtroFechaFin, searchTerm].filter(Boolean).length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('table');
                  localStorage.setItem('adminViewMode', 'table');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-600 text-blue shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Vista de tabla"
              >
                <TableCellsIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('cards');
                  localStorage.setItem('adminViewMode', 'cards');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-600 text-blue shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Vista de tarjetas"
              >
                <Squares2X2Icon className="w-5 h-5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Filtros y Ordenamiento */}
        {(showFilters || tieneFiltrosActivos) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtro por Nivel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrar por Nivel
                </label>
                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Todos los niveles</option>
                  {nivelesDisponibles.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrar por Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Graduado">Graduado</option>
                </select>
              </div>

              {/* Filtro por Fecha Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Ingreso Desde
                </label>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              {/* Filtro por Fecha Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Ingreso Hasta
                </label>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              {/* Ordenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <div className="flex gap-2">
                  <select
                    value={ordenPor}
                    onChange={(e) => setOrdenPor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    <option value="nombre">Nombre</option>
                    <option value="fechaIngreso">Fecha Ingreso</option>
                    <option value="nivel">Nivel</option>
                  </select>
                  <button
                    onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title={ordenDireccion === 'asc' ? 'Ascendente' : 'Descendente'}
                  >
                    <ArrowsUpDownIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botón Limpiar Filtros */}
            {tieneFiltrosActivos && (
              <div className="flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de Alumnos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Vista de Tabla */}
        <div className={`overflow-x-auto ${viewMode === 'cards' ? 'hidden' : viewMode === 'auto' ? 'hidden lg:block' : 'block'}`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Matrícula
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlumnos.map((alumno) => {
                const esReciente = esUltimoAlumno(alumno);
                return (
                <tr key={alumno.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${esReciente ? 'bg-yellow/5 dark:bg-yellow/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {alumno.nombre || 'N/A'}
                      {esReciente && (
                        <SparklesIcon 
                          className="w-5 h-5 text-yellow animate-pulse" 
                          title="Último alumno agregado"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.matricula || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.telefono || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {alumno.nivel || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getEstadoBadgeClasses(alumno.estado)}`}>
                      {alumno.estado || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      to={`/admin/alumno/${alumno.id}`}
                      className="text-blue hover:text-blue/80 font-medium transition-colors"
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/public/alumno/${alumno.id}`}
                      target="_blank"
                      className="text-green hover:text-green/80 font-medium transition-colors"
                    >
                      Público
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas */}
        <div className={`${viewMode === 'table' ? 'hidden' : viewMode === 'auto' ? 'block lg:hidden' : 'block'} ${
          viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6' : 'divide-y divide-gray-200 dark:divide-gray-700'
        }`}>
          {filteredAlumnos.map((alumno) => {
            const esReciente = esUltimoAlumno(alumno);
            return (
            <div 
              key={alumno.id} 
              className={`${
                viewMode === 'cards' 
                  ? `bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all duration-200 border ${esReciente ? 'border-yellow/50 dark:border-yellow/30 bg-yellow/5 dark:bg-yellow/10' : 'border-gray-200 dark:border-gray-600'}` 
                  : `p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${esReciente ? 'bg-yellow/5 dark:bg-yellow/10' : ''}`
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate flex items-center gap-2">
                    {alumno.nombre || 'N/A'}
                    {esReciente && (
                      <SparklesIcon 
                        className="w-5 h-5 text-yellow animate-pulse flex-shrink-0" 
                        title="Último alumno agregado"
                      />
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{alumno.email || 'N/A'}</p>
                </div>
                <span className={`badge ml-2 flex-shrink-0 ${getEstadoBadgeClasses(alumno.estado)}`}>
                  {alumno.estado || 'N/A'}
                </span>
              </div>
              <div className={`space-y-2 mb-4 ${viewMode === 'cards' ? 'text-sm' : ''}`}>
                {alumno.matricula && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Matrícula:</span>
                    <span className="text-gray-900 dark:text-white">{alumno.matricula}</span>
                  </div>
                )}
                {alumno.telefono && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Teléfono:</span>
                    <span className="text-gray-900 dark:text-white">{alumno.telefono}</span>
                  </div>
                )}
                {alumno.nivel && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Nivel:</span>
                    <span className="text-gray-900 dark:text-white">{alumno.nivel}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/alumno/${alumno.id}`}
                  className="inline-flex items-center justify-center flex-1 sm:flex-none px-3 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/public/alumno/${alumno.id}`}
                  target="_blank"
                  className="inline-flex items-center justify-center flex-1 sm:flex-none px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Vista Pública
                </Link>
              </div>
            </div>
          );
          })}
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
