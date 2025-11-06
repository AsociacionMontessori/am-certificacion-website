import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AcademicCapIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

const PublicProfile = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlumno = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          const data = alumnoDoc.data();
          // Solo mostrar datos públicos
          setAlumno({
            id: alumnoDoc.id,
            nombre: data.nombrePublico || data.nombre, // Permite nombre público diferente
            programa: data.programa,
            cohorte: data.cohorte,
            estado: data.estado,
            fechaGraduacion: data.fechaGraduacion,
            certificado: data.certificado || false,
            // Solo incluir campos que el alumno haya marcado como públicos
            mostrarEmail: data.mostrarEmail && data.email,
            mostrarTelefono: data.mostrarTelefono && data.telefono,
          });
        }
      } catch (error) {
        console.error('Error al cargar alumno:', error);
      }
      setLoading(false);
    };

    loadAlumno();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Perfil no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue via-purple to-green py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue to-green px-6 py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-4">
                <AcademicCapIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{alumno.nombre}</h1>
            {alumno.programa && (
              <p className="text-white/90 text-lg">{alumno.programa}</p>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Académica */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <AcademicCapIcon className="w-6 h-6 text-blue mr-2" />
                  Información Académica
                </h2>
                <dl className="space-y-3">
                  {alumno.programa && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Programa</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.programa}</dd>
                    </div>
                  )}
                  {alumno.cohorte && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cohorte</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.cohorte}</dd>
                    </div>
                  )}
                  {alumno.estado && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado</dt>
                      <dd className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alumno.estado === 'Activo' 
                            ? 'bg-green text-white'
                            : alumno.estado === 'Graduado'
                            ? 'bg-yellow text-white'
                            : 'bg-gray text-white'
                        }`}>
                          {alumno.estado}
                        </span>
                      </dd>
                    </div>
                  )}
                  {alumno.fechaGraduacion && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de Graduación</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">
                        {alumno.fechaGraduacion.toDate ? 
                          new Date(alumno.fechaGraduacion.toDate()).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) :
                          alumno.fechaGraduacion
                        }
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Certificación */}
              {alumno.certificado && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <CalendarIcon className="w-6 h-6 text-green mr-2" />
                    Certificación
                  </h2>
                  <div className="bg-green/10 border border-green rounded-lg p-4">
                    <p className="text-sm text-green font-medium">
                      ✓ Certificación Internacional Montessori
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Certificado válido internacionalmente por la Asociación Montessori de México A.C.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contacto (solo si está habilitado) */}
            {(alumno.mostrarEmail || alumno.mostrarTelefono) && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <UserIcon className="w-6 h-6 text-blue mr-2" />
                  Contacto
                </h2>
                <dl className="space-y-3">
                  {alumno.mostrarEmail && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">
                        <a href={`mailto:${alumno.mostrarEmail}`} className="text-blue hover:underline">
                          {alumno.mostrarEmail}
                        </a>
                      </dd>
                    </div>
                  )}
                  {alumno.mostrarTelefono && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">
                        <a href={`tel:${alumno.mostrarTelefono}`} className="text-blue hover:underline">
                          {alumno.mostrarTelefono}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Asociación Montessori de México A.C.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

