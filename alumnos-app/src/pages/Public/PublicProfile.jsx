import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AcademicCapIcon, UserIcon, CalendarIcon, DocumentTextIcon, PrinterIcon, ClipboardDocumentIcon, LinkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearFechaLarga } from '../../utils/formatearFecha';
import { useNotifications } from '../../contexts/NotificationContext';

const PublicProfile = () => {
  const { id } = useParams();
  const { success, prompt: showPrompt } = useNotifications();
  const [alumno, setAlumno] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
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
            nivel: data.nivel,
            cohorte: data.cohorte,
            estado: data.estado,
            fechaIngreso: data.fechaIngreso,
            fechaEgresoEstimada: data.fechaEgresoEstimada,
            fechaGraduacion: data.fechaGraduacion,
            certificado: data.certificado || false,
            folioCertificado: data.folioCertificado,
            codigoVerificacion: data.codigoVerificacion,
            ciudad: data.ciudad,
            fechaEmisionCertificado: data.fechaEmisionCertificado,
            // Solo incluir campos que el alumno haya marcado como públicos
            mostrarEmail: data.mostrarEmail && data.email,
            mostrarTelefono: data.mostrarTelefono && data.telefono,
          });

          // Cargar materias
          const materiasQuery = query(
            collection(db, 'materias'),
            where('alumnoId', '==', id)
          );
          const materiasSnapshot = await getDocs(materiasQuery);
          const materiasData = materiasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMaterias(materiasData);
        }
        // Cargar calificaciones públicas del alumno
        try {
          const calificacionesQuery = query(
            collection(db, 'calificaciones'),
            where('alumnoId', '==', id)
          );
          const califsSnap = await getDocs(calificacionesQuery);
          const califsData = califsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Ordenar: período desc, materia asc
          califsData.sort((a, b) => {
            if (a.periodo !== b.periodo) {
              return (b.periodo || '').localeCompare(a.periodo || '');
            }
            return (a.materia || '').localeCompare(b.materia || '');
          });
          setCalificaciones(califsData);
        } catch (e) {
          // si no hay colección o permisos, simplemente no mostrar
        }
      } catch (error) {
        console.error('Error al cargar alumno:', error);
      }
      setLoading(false);
    };

    loadAlumno();
  }, [id]);

  // Usar la función utilitaria para formatear fechas

  // Preparar materias para la tabla
  const tablaMaterias = () => {
    return materias
      .map(materia => ({
        id: materia.id || `materia-${materia.nombre}`,
        nombre: materia.nombre,
        estado: materia.estado || 'Pendiente',
        fechaInicio: materia.fechaInicio,
        fechaFin: materia.fechaFin
      }))
      .sort((a, b) => {
        // Ordenar por fecha de inicio, luego por nombre
        const fechaA = a.fechaInicio?.toDate ? a.fechaInicio.toDate() : (a.fechaInicio ? new Date(a.fechaInicio) : null);
        const fechaB = b.fechaInicio?.toDate ? b.fechaInicio.toDate() : (b.fechaInicio ? new Date(b.fechaInicio) : null);
        if (!fechaA && !fechaB) return a.nombre.localeCompare(b.nombre);
        if (!fechaA) return 1;
        if (!fechaB) return -1;
        if (fechaA.getTime() !== fechaB.getTime()) return fechaA - fechaB;
        return a.nombre.localeCompare(b.nombre);
      });
  };

  // Función para imprimir
  const handlePrint = () => {
    window.print();
  };

  // (compartir nativo se maneja inline donde aplica)

  // Función para copiar al portapapeles
  const handleCopyToClipboard = async (texto, tipo = '') => {
    try {
      await navigator.clipboard.writeText(texto);
      success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
    } catch (error) {
      console.error('Error al copiar:', error);
      const userInput = await showPrompt(`Copia este ${tipo || 'texto'}:`, {
        defaultValue: texto,
        title: 'Copiar al portapapeles'
      });
      if (userInput) {
        success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
      }
    }
  };

  // Función para copiar el enlace de verificación
  const handleCopyVerificationLink = async () => {
    if (alumno?.folioCertificado && alumno?.codigoVerificacion) {
      const link = `alumnos.certificacionmontessori.com/verificar?folio=${alumno.folioCertificado}&t=${alumno.codigoVerificacion}`;
      await handleCopyToClipboard(link, 'Enlace de verificación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner 
          size="lg" 
          variant="montessori"
          message="Cargando información del alumno..."
        />
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

  // Bloqueo para alumno inactivo en vista pública
  if (alumno?.estado === 'Inactivo') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red/10">
        <div className="bg-white rounded-xl shadow p-6 border border-red/30 max-w-md text-center">
          <h1 className="text-xl font-semibold text-red mb-2">Usuario inactivo</h1>
          <p className="text-gray-700">El perfil público no está disponible porque la cuenta se encuentra inactiva.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm 1.5cm;
          }
          
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
          }
          
          .no-print,
          button,
          .no-print * {
            display: none !important;
          }
          
          .print-break {
            page-break-after: always;
          }
          
          .bg-gradient-to-r,
          .shadow-xl,
          .rounded-lg,
          .bg-gradient-to-br {
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .dark\\:bg-gray-800,
          .dark\\:bg-gray-700,
          .bg-white,
          .bg-gray-50,
          .bg-gray-100 {
            background: white !important;
          }
          
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .text-gray-900,
          .text-gray-800,
          .text-gray-700 {
            color: #000 !important;
          }
          
          .text-gray-600,
          .text-gray-500,
          .text-gray-400 {
            color: #333 !important;
          }
          
          .px-6,
          .px-8,
          .px-4 {
            padding-left: 0.5cm !important;
            padding-right: 0.5cm !important;
          }
          
          .py-8,
          .py-12 {
            padding-top: 0.4cm !important;
            padding-bottom: 0.4cm !important;
          }
          
          .py-6 {
            padding-top: 0.3cm !important;
            padding-bottom: 0.3cm !important;
          }
          
          .mb-8,
          .mb-6,
          .mb-4 {
            margin-bottom: 0.3cm !important;
          }
          
          .mt-8,
          .mt-6,
          .mt-4 {
            margin-top: 0.3cm !important;
          }
          
          .space-y-3 > * + * {
            margin-top: 0.2cm !important;
          }
          
          h1 {
            font-size: 20pt !important;
            margin: 0.3cm 0 !important;
            page-break-after: avoid;
          }
          
          h2 {
            font-size: 16pt !important;
            margin: 0.3cm 0 0.2cm 0 !important;
            page-break-after: avoid;
          }
          
          h3 {
            font-size: 14pt !important;
            margin: 0.2cm 0 !important;
          }
          
          p {
            font-size: 10pt !important;
            line-height: 1.4 !important;
            margin: 0.2cm 0 !important;
          }
          
          .text-sm {
            font-size: 9pt !important;
          }
          
          .text-xs {
            font-size: 8pt !important;
          }
          
          .text-base {
            font-size: 10pt !important;
          }
          
          .text-lg {
            font-size: 12pt !important;
          }
          
          table {
            font-size: 8pt !important;
            page-break-inside: avoid;
            width: 100% !important;
          }
          
          table th,
          table td {
            padding: 0.15cm 0.2cm !important;
            font-size: 8pt !important;
          }
          
          table thead {
            display: table-header-group;
          }
          
          table tbody {
            display: table-row-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .border-t,
          .border-b {
            border-width: 1px !important;
          }
          
          .rounded-lg,
          .rounded-xl {
            border-radius: 0 !important;
          }
          
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
          }
          
          .overflow-hidden {
            overflow: visible !important;
          }
          
          .shadow-xl,
          .shadow-sm {
            box-shadow: none !important;
          }
          
          /* Asegurar que el contenido principal quepa en una página */
          .bg-white > div {
            page-break-inside: avoid;
          }
          
          /* Evitar que la tabla se corte */
          .overflow-x-auto {
            overflow: visible !important;
          }
          
          /* Ajustar iconos y elementos decorativos */
          svg {
            display: none !important;
          }
          
          .bg-white\\/20,
          .bg-gradient-to-r {
            background: white !important;
          }
        }
      `}</style>
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
            {/* Constancia de Estudios */}
            <div className="mb-8 bg-gradient-to-br from-blue/5 to-green/5 dark:from-blue/10 dark:to-green/10 rounded-lg border border-blue/20 dark:border-blue/30 p-6 sm:p-8">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="w-8 h-8 text-blue mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Constancia de Estudios
                </h2>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                  <p className="text-center font-semibold text-lg mb-4">
                    ASOCIACIÓN MONTESSORI DE MÉXICO A.C.
                  </p>
                  
                  <p className="text-center font-semibold mb-6">
                    CONSTANCIA DE ESTUDIOS
                  </p>
                  
                  <p className="text-justify">
                    Por medio de la presente se hace constar que <strong className="text-gray-900 dark:text-white">{alumno.nombre}</strong> se encuentra inscrito(a) en el programa de <strong className="text-gray-900 dark:text-white">{alumno.programa || alumno.nivel || 'Certificación Montessori'}</strong> de la Asociación Montessori de México A.C.
                  </p>
                  
                  {alumno.fechaIngreso && (
                    <p className="text-justify">
                      Fecha de ingreso: <strong className="text-gray-900 dark:text-white">{formatearFechaLarga(alumno.fechaIngreso)}</strong>
                    </p>
                  )}
                  
                  {alumno.fechaEgresoEstimada && (
                    <p className="text-justify">
                      Fecha de egreso estimada: <strong className="text-gray-900 dark:text-white">{formatearFechaLarga(alumno.fechaEgresoEstimada)}</strong>
                    </p>
                  )}
                  
                  {materias.length > 0 && (
                    <div className="text-justify mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                        <p className="font-semibold mb-2 sm:mb-0">
                          Materias:
                        </p>
                        <div className="flex gap-2 no-print">
                          <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            <PrinterIcon className="w-4 h-4 mr-1.5" />
                            Imprimir
                          </button>
                          <button
                            onClick={() => handleCopyToClipboard(window.location.href, 'Enlace de constancia')}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            title="Copiar enlace"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />
                            Copiar Enlace
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs sm:text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Materia
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Fecha Inicio
                              </th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Fecha Fin
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tablaMaterias().map((item) => (
                              <tr key={item.id}>
                                <td className="px-2 sm:px-4 py-2 text-gray-900 dark:text-white">
                                  {item.nombre}
                                </td>
                                <td className="px-2 sm:px-4 py-2">
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                    item.estado === 'Completada' 
                                      ? 'bg-green text-gray-900 dark:bg-green/80 dark:text-white'
                                      : item.estado === 'En curso'
                                      ? 'bg-blue text-white'
                                      : item.estado === 'Con atraso'
                                      ? 'bg-red text-white'
                                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                                  }`}>
                                    {item.estado}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300">
                                  {item.fechaInicio ? formatearFechaLarga(item.fechaInicio) : '-'}
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-gray-700 dark:text-gray-300">
                                  {item.fechaFin ? formatearFechaLarga(item.fechaFin) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-justify mt-4">
                    Esta constancia se expide a solicitud del interesado(a) para los fines que estime convenientes.
                  </p>
                  
                  {(alumno.folioCertificado || alumno.codigoVerificacion) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        {alumno.folioCertificado && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                              <strong className="text-gray-900 dark:text-white">Folio:</strong> <span className="font-mono">{alumno.folioCertificado}</span>
                            </p>
                            <button
                              onClick={() => handleCopyToClipboard(alumno.folioCertificado, 'Folio')}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                              title="Copiar folio"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {alumno.codigoVerificacion && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                              <strong className="text-gray-900 dark:text-white">Código:</strong> <span className="font-mono">{alumno.codigoVerificacion}</span>
                            </p>
                            <button
                              onClick={() => handleCopyToClipboard(alumno.codigoVerificacion, 'Código')}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                              title="Copiar código"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 break-all">
                            <strong className="text-gray-900 dark:text-white">Verificación:</strong>{' '}
                            <a 
                              href={`/verificar/${alumno.folioCertificado || ''}/${alumno.codigoVerificacion || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue hover:underline"
                            >
                              alumnos.certificacionmontessori.com/verificar?folio={alumno.folioCertificado || ''}&t={alumno.codigoVerificacion || ''}
                            </a>
                          </p>
                          <button
                            onClick={handleCopyVerificationLink}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors flex-shrink-0"
                            title="Copiar enlace de verificación"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 text-center space-y-1">
                    {alumno.ciudad && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {alumno.ciudad}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatearFechaLarga(alumno.fechaEmisionCertificado) || formatearFechaLarga(new Date())}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calificaciones (público) */}
            {calificaciones.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-yellow mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Calificaciones
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calificaciones.map((c) => (
                    <div key={c.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.periodo || 'Período'}</p>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{c.materia || 'Materia'}</h3>
                        </div>
                        <div className="sm:ml-4 flex-shrink-0">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{c.calificacion ?? 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                            ? 'bg-green text-gray-900 dark:bg-green/80 dark:text-white'
                            : alumno.estado === 'Graduado'
                            ? 'bg-yellow text-gray-900 dark:bg-yellow/80 dark:text-gray-900'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
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
                        {formatearFechaLarga(alumno.fechaGraduacion)}
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
    </>
  );
};

export default PublicProfile;

