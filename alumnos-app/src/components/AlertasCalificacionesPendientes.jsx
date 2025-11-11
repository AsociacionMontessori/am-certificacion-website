import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, ClipboardDocumentCheckIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { getMateriasPendientesCalificar } from '../services/notificacionesService';

const AlertasCalificacionesPendientes = () => {
  const { userData } = useAuth();
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || userData.rol !== 'admin') {
      setLoading(false);
      return;
    }

    let activo = true;

    const cargarPendientes = async () => {
      try {
        const materiasPendientes = await getMateriasPendientesCalificar();
        if (activo) {
          setPendientes(materiasPendientes);
        }
      } catch (error) {
        console.error('Error al cargar materias pendientes de calificar:', error);
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarPendientes();

    const interval = setInterval(cargarPendientes, 5 * 60 * 1000);

    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [userData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <LoadingSpinner size="sm" variant="montessori" />
      </div>
    );
  }

  if (!userData || userData.rol !== 'admin' || pendientes.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow/10 dark:bg-yellow/20 rounded-xl shadow-md border border-yellow/30 p-4 sm:p-6 mb-6 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-yellow mb-1">
            Materias pendientes de calificar
          </h3>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Hay <strong>{pendientes.length}</strong> materia(s) con fecha de egreso vencida y calificación menor a 10.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pendientes.slice(0, 5).map((item) => {
          const nombreMateria = item.materia?.nombre || 'Materia sin nombre';
          const nombreAlumno = item.alumno?.nombre || 'Alumno desconocido';
          const diasTexto = item.diasAtraso === 1 ? '1 día' : `${item.diasAtraso} días`;
          const calificacionTexto = item.calificacion === null ? 'Sin calificación' : item.calificacion.toString();

          return (
            <div
              key={item.materia.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-yellow/30 bg-white/60 dark:bg-gray-800/60 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {nombreMateria}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {nombreAlumno} · Atraso: {diasTexto} · Calificación actual: {calificacionTexto}
                  </p>
                </div>
              </div>
              {item.alumno?.id && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/alumno/${item.alumno.id}/calificaciones`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow border border-yellow/40 rounded-lg hover:bg-yellow/20 transition-colors"
                  >
                    Revisar calificación
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pendientes.length > 5 && (
        <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          Mostrando las primeras 5 materias. Revisa la sección de calificaciones para ver el listado completo.
        </p>
      )}
    </div>
  );
};

export default AlertasCalificacionesPendientes;
