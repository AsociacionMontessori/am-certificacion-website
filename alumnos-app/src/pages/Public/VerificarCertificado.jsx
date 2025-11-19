import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verificarCertificado } from '../../services/certificadoService';
import { formatearFechaLarga } from '../../utils/formatearFecha';
import { ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const VerificarCertificado = () => {
  const { folio: folioParam, codigo: codigoParam } = useParams();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      // Normalizar parámetros para Safari iOS (puede tener problemas con encoding)
      let folio = folioParam;
      let codigo = codigoParam;

      // Fallback para Safari iOS: Si useParams no funciona, parsear la URL manualmente
      if ((!folio || !codigo) && typeof window !== 'undefined') {
        try {
          const urlPath = window.location.pathname;
          // Patrón: /verificar/:folio/:codigo
          const match = urlPath.match(/^\/verificar\/([^\/]+)\/([^\/]+)$/);
          if (match && match.length === 3) {
            folio = match[1];
            codigo = match[2];
            console.warn('⚠️ Usando fallback de parsing manual para Safari iOS');
          }
        } catch (error) {
          console.warn('⚠️ Error al parsear URL manualmente:', error);
        }
      }

      // Decodificar URL si es necesario (Safari puede tener problemas)
      try {
        if (folio) {
          folio = decodeURIComponent(folio).trim();
        }
        if (codigo) {
          codigo = decodeURIComponent(codigo).trim();
        }
      } catch (error) {
        console.warn('⚠️ Error al decodificar parámetros URL:', error);
        // Continuar con los valores originales si falla la decodificación
      }

      // Log para debugging en Safari
      if (typeof window !== 'undefined') {
        console.log('🔍 Parámetros recibidos:', { 
          folioOriginal: folioParam, 
          codigoOriginal: codigoParam,
          folioNormalizado: folio,
          codigoNormalizado: codigo,
          userAgent: navigator.userAgent,
          url: window.location.href,
          pathname: window.location.pathname
        });
      }

      if (folio && codigo) {
        try {
          // Normalizar el código (mayúsculas y sin espacios)
          const codigoNormalizado = codigo.toUpperCase().trim();
          // Normalizar folio (mayúsculas y sin espacios)
          const folioNormalizado = folio.toUpperCase().trim();
          
          const resultado = await verificarCertificado(folioNormalizado, codigoNormalizado);
          setResultado(resultado);
        } catch (error) {
          console.error('❌ Error al verificar certificado:', error);
          setResultado({ 
            valido: false, 
            error: error.message || 'Error al verificar el certificado',
            code: error.code
          });
        }
      } else {
        console.error('❌ Faltan parámetros:', { folio, codigo, folioParam, codigoParam });
        setResultado({ valido: false, error: 'Faltan parámetros de verificación' });
      }
      setLoading(false);
    };

    verificar();
  }, [folioParam, codigoParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue via-blue-600 to-blue px-8 py-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Verificación de Certificado
            </h1>
            <p className="text-white/90">Asociación Montessori de México A.C.</p>
          </div>

          {/* Contenido */}
          <div className="px-8 py-12">
            {resultado?.valido ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-green/20 rounded-full p-6">
                    <ShieldCheckIcon className="w-16 h-16 text-green" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green mb-4">
                    ✓ Certificado Válido
                  </h2>
                  <p className="text-gray-600 mb-6">
                    El certificado digital ha sido verificado exitosamente.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-left">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">
                      {resultado.alumno.nombre}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nivel</dt>
                    <dd className="text-lg text-gray-900 mt-1">{resultado.alumno.nivel}</dd>
                  </div>
                  {resultado.alumno.fechaGraduacion && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de graduación</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatearFechaLarga(resultado.alumno.fechaGraduacion)}
                      </dd>
                    </div>
                  )}
                  {resultado.alumno.nivelActual && resultado.alumno.nivelActual !== resultado.alumno.nivel && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nivel actual</dt>
                      <dd className="text-sm text-gray-900 mt-1">{resultado.alumno.nivelActual}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resultado.alumno.estado === 'Graduado' 
                          ? 'bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900'
                          : 'bg-blue text-white'
                      }`}>
                        {resultado.alumno.estado}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Folio</dt>
                    <dd className="text-sm font-mono text-gray-900 mt-1">{folioParam}</dd>
                  </div>
                </div>

                <Link
                  to={`/certificado/${resultado.alumno.id}`}
                  className="inline-flex items-center px-6 py-3 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Ver Certificado Completo
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-red/20 rounded-full p-6">
                    <XCircleIcon className="w-16 h-16 text-red" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red mb-4">
                    ✗ Certificado Inválido
                  </h2>
                  <p className="text-gray-600 mb-6">
                    El certificado no pudo ser verificado. Por favor, verifica que el folio y código de verificación sean correctos.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Folio ingresado:</p>
                    <p className="text-sm font-mono text-gray-900">{folioParam || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Código ingresado:</p>
                    <p className="text-sm font-mono text-gray-900">{codigoParam || 'N/A'}</p>
                  </div>
                  {resultado?.error && (
                    <div className="mt-3 p-3 bg-red/10 border border-red/30 rounded">
                      <p className="text-sm text-red font-medium">
                        Error: {resultado.error}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Por favor, verifica que el folio y código sean correctos. Si el problema persiste, contacta al administrador.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t-2 border-gray-200 text-center">
            <Link
              to="/"
              className="text-blue hover:underline text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificarCertificado;
