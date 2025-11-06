import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todas'); // todas, pendientes, aprobadas, rechazadas

  useEffect(() => {
    const loadInscripciones = async () => {
      try {
        let q = query(collection(db, 'inscripciones'), orderBy('fechaInscripcion', 'desc'));
        
        if (filter !== 'todas') {
          q = query(collection(db, 'inscripciones'), where('estadoInscripcion', '==', filter), orderBy('fechaInscripcion', 'desc'));
        }
        
        const querySnapshot = await getDocs(q);
        const inscripcionesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInscripciones(inscripcionesData);
      } catch (error) {
        console.error('Error al cargar inscripciones:', error);
      }
      setLoading(false);
    };

    loadInscripciones();
  }, [filter]);

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const search = searchTerm.toLowerCase();
    return (
      inscripcion.nombre?.toLowerCase().includes(search) ||
      inscripcion.email?.toLowerCase().includes(search) ||
      inscripcion.programa?.toLowerCase().includes(search)
    );
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow text-white';
      case 'Aprobada':
        return 'bg-green text-white';
      case 'Rechazada':
        return 'bg-red text-white';
      default:
        return 'bg-gray text-white';
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Inscripciones
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestiona las solicitudes de inscripción
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setFilter('todas')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'todas' ? 'bg-blue text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('Pendiente')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Pendiente' ? 'bg-blue text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('Aprobada')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Aprobada' ? 'bg-blue text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Aprobadas
        </button>
        <button
          onClick={() => setFilter('Rechazada')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Rechazada' ? 'bg-blue text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Rechazadas
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar inscripciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {/* Lista de Inscripciones */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInscripciones.map((inscripcion) => (
          <div key={inscripcion.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {inscripcion.nombre}
                  </h3>
                  <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(inscripcion.estadoInscripcion || inscripcion.estado)}`}>
                    {inscripcion.estadoInscripcion || inscripcion.estado}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{inscripcion.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Programa</p>
                    <p className="text-gray-900 dark:text-white">{inscripcion.programa}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Teléfono</p>
                    <p className="text-gray-900 dark:text-white">{inscripcion.telefono}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Fecha de Inscripción</p>
                    <p className="text-gray-900 dark:text-white">
                      {inscripcion.fechaInscripcion?.toDate ? 
                        new Date(inscripcion.fechaInscripcion.toDate()).toLocaleDateString() :
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <Link
                  to={`/admin/inscripcion/${inscripcion.id}`}
                  className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInscripciones.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No se encontraron inscripciones' : 'No hay inscripciones'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Inscripciones;

