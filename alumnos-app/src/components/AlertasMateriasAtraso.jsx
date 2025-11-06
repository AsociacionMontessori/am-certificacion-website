import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  PhoneIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AlertasMateriasAtraso = () => {
  const { currentUser } = useAuth();
  const [materiasAtraso, setMateriasAtraso] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMateriasAtraso = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Consultar todas las materias del alumno y filtrar por estado en el cliente
        // Esto evita la necesidad de un índice compuesto en Firestore
        const materiasQuery = query(
          collection(db, 'materias'),
          where('alumnoId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(materiasQuery);
        const todasLasMaterias = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filtrar materias con atraso en el cliente
        const materiasConAtraso = todasLasMaterias.filter(m => m.estado === 'Con atraso');
        setMateriasAtraso(materiasConAtraso);
      } catch (error) {
        console.error('Error al cargar materias con atraso:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarMateriasAtraso();
    
    // Verificar cada 5 minutos
    const interval = setInterval(cargarMateriasAtraso, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <LoadingSpinner size="sm" variant="montessori" />
      </div>
    );
  }

  if (materiasAtraso.length === 0) {
    return null;
  }

  const whatsappNumber = '5215548885013'; // Número de WhatsApp de la institución
  const whatsappMessage = encodeURIComponent(
    `Hola, tengo ${materiasAtraso.length} materia(s) con atraso y necesito ayuda para regularizar mis clases.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="bg-red/10 dark:bg-red/20 rounded-xl shadow-md border border-red/30 p-4 sm:p-6 mb-6 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-red mb-1">
            ⚠️ Materias con Atraso
          </h3>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2">
            Tienes <strong>{materiasAtraso.length}</strong> materia(s) con atraso que requieren atención inmediata.
          </p>
        </div>
      </div>

      {/* Lista de materias con atraso */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Materias atrasadas:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          {materiasAtraso.map((materia) => (
            <li key={materia.id} className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{materia.nombre}</strong>
            </li>
          ))}
        </ul>
      </div>

      {/* Mensaje empático */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 border border-red/20">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Entendemos que pueden surgir situaciones que afecten tu avance académico. Estamos aquí para apoyarte y ayudarte a regularizar tus clases. 
          <strong className="text-red"> Por favor, contáctanos por WhatsApp</strong> para que podamos trabajar juntos en un plan de acción.
        </p>
        
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 bg-green text-gray-900 rounded-lg hover:bg-green/90 font-medium transition-colors mb-3"
        >
          <PhoneIcon className="w-5 h-5 mr-2" />
          Contactar por WhatsApp
        </a>
      </div>

      {/* Recordatorios importantes */}
      <div className="bg-yellow/10 dark:bg-yellow/20 rounded-lg p-4 border border-yellow/30">
        <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-semibold mb-2">
          ⚠️ Recordatorios Importantes:
        </p>
        <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc list-inside">
          <li>
            <strong>Si no terminas a tiempo tus materias, deberás recursarlas</strong>, lo cual afectará tu calendario de materias y alargará tu fecha de egreso, además de generar cargos extra.
          </li>
          <li>
            <strong>No se pueden acreditar materias si existen entregas pendientes.</strong> Una vez que la clase sea archivada, ya no será posible subir actividades pendientes.
          </li>
          <li>
            En caso de no cumplir con los plazos de entrega, se les asignará un nuevo grupo para recursar o subir los trabajos rezagados, lo cual puede extender el tiempo de tu diplomado, así como implicar pagos adicionales de colegiatura.
          </li>
        </ul>
      </div>

      {/* Link al calendario */}
      <div className="mt-4 pt-4 border-t border-red/20">
        <Link
          to="/calendario"
          className="inline-flex items-center text-sm font-medium text-red hover:text-red/80 transition-colors"
        >
          Ver detalles en mi calendario →
        </Link>
      </div>
    </div>
  );
};

export default AlertasMateriasAtraso;

