import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ArrowLeftIcon, AcademicCapIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const GestionGraduacion = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [infoGraduacion, setInfoGraduacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    materiasCompletadas: false,
    promedioMinimo: false,
    tesisCompletada: false,
    practicasCompletadas: false,
    pagoRealizado: false
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          setAlumno({ id: alumnoDoc.id, ...alumnoDoc.data() });
        }

        const graduacionDoc = await getDoc(doc(db, 'graduacion', id));
        if (graduacionDoc.exists()) {
          const graduacionData = { id: graduacionDoc.id, ...graduacionDoc.data() };
          setInfoGraduacion(graduacionData);
          setFormData({
            materiasCompletadas: graduacionData.materiasCompletadas || false,
            promedioMinimo: graduacionData.promedioMinimo || false,
            tesisCompletada: graduacionData.tesisCompletada || false,
            practicasCompletadas: graduacionData.practicasCompletadas || false,
            pagoRealizado: graduacionData.pagoRealizado || false
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const graduacionData = {
        alumnoId: id,
        materiasCompletadas: formData.materiasCompletadas,
        promedioMinimo: formData.promedioMinimo,
        tesisCompletada: formData.tesisCompletada,
        practicasCompletadas: formData.practicasCompletadas,
        pagoRealizado: formData.pagoRealizado,
        fechaActualizacion: serverTimestamp()
      };

      if (infoGraduacion) {
        await setDoc(doc(db, 'graduacion', id), graduacionData, { merge: true });
      } else {
        await setDoc(doc(db, 'graduacion', id), {
          ...graduacionData,
          fechaCreacion: serverTimestamp()
        });
      }

      alert('Información de graduación guardada exitosamente');
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar información de graduación:', error);
      alert('Error al guardar la información de graduación');
    }
  };

  const requisitos = [
    { nombre: 'Completar todas las materias', completado: formData.materiasCompletadas, key: 'materiasCompletadas' },
    { nombre: 'Promedio mínimo de 8.0', completado: formData.promedioMinimo, key: 'promedioMinimo' },
    { nombre: 'Entrega de Album Montessori (proyecto final)', completado: formData.tesisCompletada, key: 'tesisCompletada' },
    { nombre: 'Prácticas profesionales', completado: formData.practicasCompletadas, key: 'practicasCompletadas' },
    { nombre: 'Pago de derechos de certificado', completado: formData.pagoRealizado, key: 'pagoRealizado' },
  ];

  const completados = requisitos.filter(r => r.completado).length;
  const porcentaje = (completados / requisitos.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <Link
          to={`/admin/alumno/${id}`}
          className="inline-flex items-center text-blue hover:text-blue/80 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al alumno
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Gestión de Graduación
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {alumno?.nombre} - {alumno?.nivel}
        </p>
      </div>

      {/* Progreso General */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <AcademicCapIcon className="w-8 h-8 text-blue mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Progreso de Graduación
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completados} de {requisitos.length} requisitos completados
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-blue h-4 rounded-full transition-all duration-300"
              style={{ width: `${porcentaje}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {porcentaje.toFixed(0)}% completado
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 space-y-6">
        {/* Requisitos */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Requisitos de Graduación
          </h2>
          <div className="space-y-3">
            {requisitos.map((requisito) => (
              <label key={requisito.key} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requisito.completado}
                  onChange={(e) => setFormData({ ...formData, [requisito.key]: e.target.checked })}
                  className="w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-white">
                  {requisito.nombre}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue text-white rounded-lg hover:bg-blue/90 font-semibold transition-colors"
          >
            Guardar Información
          </button>
        </div>
      </form>
    </div>
  );
};

export default GestionGraduacion;

