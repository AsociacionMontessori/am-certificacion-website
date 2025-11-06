import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

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
            where('alumnoId', '==', currentUser.uid),
            orderBy('dia', 'asc'),
            orderBy('horaInicio', 'asc')
          );
          const querySnapshot = await getDocs(materiasQuery);
          const materiasData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMaterias(materiasData);
        } catch (error) {
          console.error('Error al cargar materias:', error);
        }
      }
      setLoading(false);
    };

    loadMaterias();
  }, [currentUser]);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const materiasPorDia = diasSemana.map(dia => ({
    dia,
    materias: materias.filter(m => m.dia === dia)
  }));

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
          Calendario de Materias
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Horarios y materias del semestre actual
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {materiasPorDia.map(({ dia, materias }) => (
          <div key={dia} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 text-green mr-2" />
              {dia}
            </h2>
            {materias.length > 0 ? (
              <div className="space-y-3">
                {materias.map((materia) => (
                  <div key={materia.id} className="border-l-4 border-blue pl-3 py-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {materia.nombre}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {materia.horaInicio} - {materia.horaFin}
                      </div>
                      {materia.profesor && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Prof. {materia.profesor}
                        </div>
                      )}
                      {materia.aula && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {materia.aula}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin materias</p>
            )}
          </div>
        ))}
      </div>

      {materias.length === 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay materias registradas para este semestre.
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendario;

