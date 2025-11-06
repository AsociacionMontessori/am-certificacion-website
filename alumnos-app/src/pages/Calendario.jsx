import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatearFechaLarga } from '../utils/formatearFecha';

const Calendario = () => {
  const { currentUser } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterias = async () => {
      if (currentUser) {
        try {
          const materiasQuery = query(
            collection(db, 'materias'),
            where('alumnoId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(materiasQuery);
          const materiasData = querySnapshot.docs.map(doc => ({
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
        } catch (error) {
          console.error('Error al cargar materias:', error);
        }
      }
      setLoading(false);
    };

    loadMaterias();
  }, [currentUser]);

  // Agrupar materias por fecha de inicio
  const materiasPorFecha = materias.reduce((acc, materia) => {
    const fechaInicio = materia.fechaInicio 
      ? formatearFechaLarga(materia.fechaInicio)
      : 'Sin fecha';
    
    if (!acc[fechaInicio]) {
      acc[fechaInicio] = [];
    }
    acc[fechaInicio].push(materia);
    return acc;
  }, {});

  const fechasOrdenadas = Object.keys(materiasPorFecha).sort((a, b) => {
    if (a === 'Sin fecha') return 1;
    if (b === 'Sin fecha') return -1;
    return new Date(a) - new Date(b);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Calendario de Materias
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Materias organizadas por fecha de inicio
        </p>
      </div>

      {fechasOrdenadas.length > 0 ? (
        <div className="space-y-6">
          {fechasOrdenadas.map((fecha) => (
            <div key={fecha} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-blue/10 dark:bg-blue/20 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue mr-2" />
                  {fecha === 'Sin fecha' ? 'Materias sin fecha asignada' : `Inicio: ${fecha}`}
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materiasPorFecha[fecha].map((materia) => (
                    <div key={materia.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {materia.nombre}
                      </h3>
                      <div className="space-y-2">
                        {materia.fechaFin && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Fin: {formatearFechaLarga(materia.fechaFin)}</span>
                          </div>
                        )}
                        {materia.profesor && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Prof. {materia.profesor}</span>
                          </div>
                        )}
                        {materia.aula && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{materia.aula}</span>
                          </div>
                        )}
                        {materia.horario && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{materia.horario}</span>
                          </div>
                        )}
                        {materia.estado && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              materia.estado === 'Completada' 
                                ? 'bg-green text-gray-900'
                                : materia.estado === 'En curso'
                                ? 'bg-blue text-white'
                                : materia.estado === 'Con atraso'
                                ? 'bg-red text-white'
                                : 'bg-gray-600 text-white'
                            }`}>
                              {materia.estado}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay materias registradas.
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendario;
