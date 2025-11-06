import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verificarCertificado } from '../../services/certificadoService';
import { ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const VerificarCertificado = () => {
  const { folio, codigo } = useParams();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      if (folio && codigo) {
        try {
          // Normalizar el código (mayúsculas y sin espacios)
          const codigoNormalizado = codigo.toUpperCase().trim();
          const resultado = await verificarCertificado(folio, codigoNormalizado);
          setResultado(resultado);
        } catch (error) {
          console.error('Error al verificar:', error);
          setResultado({ valido: false, error: error.message });
        }
      } else {
        setResultado({ valido: false, error: 'Faltan parámetros de verificación' });
      }
      setLoading(false);
    };

    verificar();
  }, [folio, codigo]);

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
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resultado.alumno.estado === 'Graduado' 
                          ? 'bg-green text-white'
                          : 'bg-blue text-white'
                      }`}>
                        {resultado.alumno.estado}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Folio</dt>
                    <dd className="text-sm font-mono text-gray-900 mt-1">{folio}</dd>
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
                    <p className="text-sm font-mono text-gray-900">{folio || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Código ingresado:</p>
                    <p className="text-sm font-mono text-gray-900">{codigo || 'N/A'}</p>
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

