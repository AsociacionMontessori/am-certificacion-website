import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ArrowLeftIcon, AcademicCapIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingButton from '../../components/LoadingButton';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';

const GestionGraduacion = () => {
  const { id } = useParams();
  const canEdit = useCanEdit();
  const { success, error: showError } = useNotifications();
  const [alumno, setAlumno] = useState(null);
  const [infoGraduacion, setInfoGraduacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    try {
      const requisitosCompletos = [
        formData.materiasCompletadas,
        formData.promedioMinimo,
        formData.tesisCompletada,
        formData.practicasCompletadas,
        formData.pagoRealizado
      ].every(Boolean);

      const timestamp = serverTimestamp();
      const graduacionRef = doc(db, 'graduacion', id);
      const alumnoRef = doc(db, 'alumnos', id);

      const graduacionData = {
        alumnoId: id,
        materiasCompletadas: formData.materiasCompletadas,
        promedioMinimo: formData.promedioMinimo,
        tesisCompletada: formData.tesisCompletada,
        practicasCompletadas: formData.practicasCompletadas,
        pagoRealizado: formData.pagoRealizado,
        progresoCompleto: requisitosCompletos,
        fechaActualizacion: timestamp
      };

      if (requisitosCompletos) {
        const estadoPrevio = infoGraduacion?.estadoPrevio || alumno?.estado || 'Activo';
        graduacionData.estadoPrevio = estadoPrevio;
        graduacionData.fechaGraduacion = timestamp;
        graduacionData.nivelGraduacion = alumno?.nivel || null;
        graduacionData.programaGraduacion = alumno?.programa || null;
        graduacionData.cohorteGraduacion = alumno?.cohorte || null;
        graduacionData.fechaIngresoNivel = alumno?.fechaIngreso || null;
        graduacionData.fechaEgresoNivel = alumno?.fechaEgresoEstimada || alumno?.fechaEgreso || null;

        const alumnoUpdate = {
          estado: 'Graduado'
        };
        if (!alumno?.fechaGraduacion) {
          alumnoUpdate.fechaGraduacion = timestamp;
        }
        await updateDoc(alumnoRef, alumnoUpdate);
      } else {
        graduacionData.fechaGraduacion = null;
        graduacionData.nivelGraduacion = null;
        graduacionData.programaGraduacion = null;
        graduacionData.cohorteGraduacion = null;
        graduacionData.fechaIngresoNivel = null;
        graduacionData.fechaEgresoNivel = null;

        if (alumno?.estado === 'Graduado') {
          const estadoPrevio = infoGraduacion?.estadoPrevio || 'Activo';
          graduacionData.estadoPrevio = estadoPrevio;
          await updateDoc(alumnoRef, {
            estado: estadoPrevio,
            fechaGraduacion: null
          });
        }
      }

      if (infoGraduacion) {
        await setDoc(graduacionRef, graduacionData, { merge: true });
      } else {
        await setDoc(graduacionRef, {
          ...graduacionData,
          fechaCreacion: timestamp
        });
      }

      const [graduacionDocActualizado, alumnoDocActualizado] = await Promise.all([
        getDoc(graduacionRef),
        getDoc(alumnoRef)
      ]);

      if (graduacionDocActualizado.exists()) {
        const graduacionActualizada = { id: graduacionDocActualizado.id, ...graduacionDocActualizado.data() };
        setInfoGraduacion(graduacionActualizada);
        setFormData({
          materiasCompletadas: graduacionActualizada.materiasCompletadas || false,
          promedioMinimo: graduacionActualizada.promedioMinimo || false,
          tesisCompletada: graduacionActualizada.tesisCompletada || false,
          practicasCompletadas: graduacionActualizada.practicasCompletadas || false,
          pagoRealizado: graduacionActualizada.pagoRealizado || false
        });
      }

      if (alumnoDocActualizado.exists()) {
        setAlumno({ id: alumnoDocActualizado.id, ...alumnoDocActualizado.data() });
      }

      success('Información de graduación guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar información de graduación:', error);
      showError('Error al guardar la información de graduación');
    } finally {
      setSaving(false);
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
      <LoadingSpinner 
        size="lg" 
        variant="montessori"
        message="Cargando información de graduación..."
        className="h-64"
      />
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
              <label key={requisito.key} className={`flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  checked={requisito.completado}
                  onChange={(e) => setFormData({ ...formData, [requisito.key]: e.target.checked })}
                  disabled={!canEdit}
                  className="w-5 h-5 text-blue border-gray-300 rounded focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-white">
                  {requisito.nombre}
                </span>
              </label>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4">
            <LoadingButton
              type="submit"
              isLoading={saving}
              variant="primary"
              size="lg"
            >
              Guardar Información
            </LoadingButton>
          </div>
        )}
      </form>
    </div>
  );
};

export default GestionGraduacion;

