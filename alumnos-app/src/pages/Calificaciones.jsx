import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';

const Calificaciones = () => {
  const { currentUser } = useAuth();
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCalificaciones = async () => {
      if (currentUser) {
        try {
          const calificacionesQuery = query(
            collection(db, 'calificaciones'),
            where('alumnoId', '==', currentUser.uid),
            orderBy('periodo', 'desc'),
            orderBy('materia', 'asc')
          );
          const querySnapshot = await getDocs(calificacionesQuery);
          const calificacionesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCalificaciones(calificacionesData);
        } catch (error) {
          console.error('Error al cargar calificaciones:', error);
        }
      }
      setLoading(false);
    };

    loadCalificaciones();
  }, [currentUser]);

  const calcularPromedio = () => {
    if (calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((acc, cal) => acc + (cal.calificacion || 0), 0);
    return (suma / calificaciones.length).toFixed(2);
  };

  const obtenerColorCalificacion = (calificacion) => {
    if (calificacion >= 90) return 'text-green';
    if (calificacion >= 80) return 'text-blue';
    if (calificacion >= 70) return 'text-yellow';
    return 'text-red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  const periodos = [...new Set(calificaciones.map(c => c.periodo))].sort().reverse();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Calificaciones
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Consulta tus calificaciones y promedios
        </p>
      </div>

      {/* Promedio General */}
      <div className="mb-6 bg-gradient-to-r from-blue to-green rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium mb-2">Promedio General</h2>
            <p className="text-3xl font-bold">{calcularPromedio()}</p>
          </div>
          <TrophyIcon className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Calificaciones por Período */}
      {periodos.map((periodo) => {
        const calificacionesPeriodo = calificaciones.filter(c => c.periodo === periodo);
        const promedioPeriodo = calificacionesPeriodo.length > 0
          ? (calificacionesPeriodo.reduce((acc, c) => acc + (c.calificacion || 0), 0) / calificacionesPeriodo.length).toFixed(2)
          : 0;

        return (
          <div key={periodo} className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <ChartBarIcon className="w-6 h-6 text-blue mr-2" />
                {periodo}
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio del período</p>
                <p className="text-2xl font-bold text-blue">{promedioPeriodo}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Calificación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Profesor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {calificacionesPeriodo.map((calificacion) => (
                    <tr key={calificacion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {calificacion.materia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${obtenerColorCalificacion(calificacion.calificacion)}`}>
                          {calificacion.calificacion || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {calificacion.profesor || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {calificaciones.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay calificaciones registradas.
          </p>
        </div>
      )}
    </div>
  );
};

export default Calificaciones;

