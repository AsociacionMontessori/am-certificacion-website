import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { obtenerCertificado } from '../../services/certificadoService';
import { AcademicCapIcon, ShieldCheckIcon, ShareIcon } from '@heroicons/react/24/outline';

const CertificadoDigital = () => {
  const { id } = useParams();
  const [certificado, setCertificado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCertificado = async () => {
      try {
        const data = await obtenerCertificado(id);
        setCertificado(data);
      } catch (error) {
        console.error('Error al cargar certificado:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadCertificado();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!certificado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Certificado no encontrado</p>
        </div>
      </div>
    );
  }

  const { folio, codigoVerificacion, promedio, alumno } = certificado;
  const esGraduado = alumno.estado === 'Graduado';
  
  // Asegurar que el código esté presente antes de generar la URL
  if (!codigoVerificacion) {
    console.error('⚠️ No hay código de verificación disponible');
  }
  
  const urlVerificacion = codigoVerificacion 
    ? `${window.location.origin}/verificar/${folio}/${codigoVerificacion}`
    : `${window.location.origin}/verificar/${folio}/PENDIENTE`;
  const fechaEmision = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const lugarEmision = 'Ciudad de México, México';

  const fechaIngreso = alumno.fechaIngreso?.toDate 
    ? new Date(alumno.fechaIngreso.toDate()).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  const fechaEgreso = alumno.fechaEgreso?.toDate 
    ? new Date(alumno.fechaEgreso.toDate()).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : alumno.fechaEgreso || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto certificado-print">
        {/* Certificado */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue">
          {/* Header con sello */}
          <div className="bg-gradient-to-r from-blue via-blue-600 to-blue relative px-8 py-12 text-center">
            <div className="absolute top-4 right-4">
              <ShieldCheckIcon className="w-16 h-16 text-white/20" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-white mb-4">
                {esGraduado ? 'CERTIFICADO DIGITAL' : 'CONSTANCIA DE ESTUDIOS'}
              </h1>
              <p className="text-white/90 text-lg">Asociación Montessori de México A.C.</p>
              {!esGraduado && (
                <p className="text-white/80 text-sm mt-2">Certificado Digital Verificable</p>
              )}
            </div>
          </div>

          {/* Contenido del certificado */}
          <div className="px-8 py-12 space-y-8">
            {/* Texto de certificación */}
            <div className="text-justify leading-relaxed text-gray-800 space-y-4">
              <p className="text-base">
                La <strong>Asociación Montessori de México A.C.</strong> (RFC: AMM6502191Y4), 
                constituida el 2 de febrero de 1965 mediante Escritura Pública No. 41,568 ante 
                el Notario Público No. 105 de la Ciudad de México, Lic. Fermín Fulda Fernández; 
                y la <strong>Sociedad de Escuelas Montessori S.C.</strong>, constituida el 15 
                de febrero de 2018 mediante Escritura Pública No. 67,386 ante el Notario Público 
                No. 163 de la Ciudad de México, Lic. Francisco Xavier Arredondo Galván;
              </p>

              {esGraduado ? (
                <>
                  <p className="text-lg font-semibold text-center my-6">
                    <strong>CERTIFICAN</strong> que <strong>{alumno.nombreCompleto}</strong> ha 
                    cumplido satisfactoriamente con los requisitos académicos y prácticos del 
                    programa de formación de Guía Montessori en el nivel <strong>{alumno.nivel}</strong>, 
                    con fecha de ingreso <strong>{fechaIngreso}</strong> y fecha de egreso{' '}
                    <strong>{fechaEgreso}</strong>.
                  </p>
                  {promedio && (
                    <p className="text-center text-lg">
                      <strong>Promedio final:</strong> {promedio}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-center my-6">
                    <strong>CONSTAN</strong> que <strong>{alumno.nombreCompleto}</strong> se encuentra 
                    inscrito en el programa de formación de Guía Montessori en el nivel{' '}
                    <strong>{alumno.nivel}</strong>, con fecha de ingreso{' '}
                    <strong>{fechaIngreso}</strong>.
                  </p>
                  <div className="bg-yellow/10 border-l-4 border-yellow p-4 my-6 rounded-r">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong className="font-semibold">Importante:</strong> La presente constancia únicamente hace constar 
                      la inscripción del alumno en el programa de formación. Este documento <strong>no constituye un certificado 
                      ni un diploma</strong> que acredite la certificación Montessori. La certificación oficial se otorgará 
                      únicamente una vez completados satisfactoriamente todos los requisitos académicos y prácticos del programa.
                    </p>
                  </div>
                </>
              )}

              <div className="border-t-2 border-gray-300 pt-6 mt-8 space-y-4">
                <p className="text-sm">
                  <strong>Folio de certificado digital:</strong> {folio}
                </p>
                <p className="text-sm">
                  Este documento cuenta con un código de verificación y sello digital. 
                  Verifica su autenticidad en: <a href={urlVerificacion} className="text-blue hover:underline break-all">{urlVerificacion}</a> usando el folio y el código QR.
                </p>
                <p className="text-sm">
                  <strong>Firmante evaluador CONOCER:</strong> Ana Daniela García González Vega, 
                  Estándar: EC0301, Folio CONOCER: D-0009441521.
                </p>
              </div>
            </div>

            {/* Código QR y verificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t-2 border-gray-200">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Código de Verificación</h3>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-lg font-bold text-gray-800">
                  {codigoVerificacion || 'Generando...'}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Use este código junto con el folio para verificar
                </p>
                <a
                  href={urlVerificacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green text-white rounded-lg hover:bg-green/90 transition-colors text-sm"
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Verificar Certificado
                </a>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Código QR</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG 
                    value={urlVerificacion}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Escanee para verificar el certificado
                </p>
                <a
                  href={urlVerificacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm"
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Verificar Ahora
                </a>
              </div>
            </div>

            {/* Firma y fecha */}
            <div className="pt-8 border-t-2 border-gray-200 mt-8">
              <p className="text-sm text-gray-600 text-center mb-6">
                {lugarEmision}, {fechaEmision}
              </p>
              <div className="text-center space-y-2">
                <p className="font-semibold text-gray-800">Directora General</p>
                <p className="text-gray-700">Roxana Muñoz Guevara</p>
                <p className="text-sm text-gray-600">Presidenta de la Asociación Montessori de México A.C.</p>
              </div>
            </div>
          </div>

          {/* Footer con sello */}
          <div className="bg-gray-50 px-8 py-6 border-t-2 border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <AcademicCapIcon className="w-8 h-8 text-blue" />
              <p className="text-xs text-gray-600 text-center">
                Asociación Montessori de México A.C.<br />
                Certificado Digital Verificable
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-6 py-3 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Certificado
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                navigator.share({
                  title: `${esGraduado ? 'Certificado Digital' : 'Constancia de Estudios'} - ${alumno.nombreCompleto}`,
                  text: `Certificado digital de ${alumno.nombreCompleto}`,
                  url: url
                }).catch(err => {
                  // Si falla, copiar al portapapeles
                  navigator.clipboard.writeText(url).then(() => {
                    alert('URL copiada al portapapeles');
                  });
                });
              } else {
                // Fallback: copiar al portapapeles
                navigator.clipboard.writeText(url).then(() => {
                  alert('URL copiada al portapapeles');
                });
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-green text-white rounded-lg hover:bg-green/90 transition-colors shadow-lg"
          >
            <ShareIcon className="w-5 h-5 mr-2" />
            Compartir Certificado
          </button>
        </div>
      </div>

      {/* Estilos para impresión */}
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
          
          body * {
            visibility: hidden;
          }
          
          .certificado-print, .certificado-print * {
            visibility: visible;
          }
          
          .certificado-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            page-break-inside: avoid;
          }
          
          .certificado-print > div {
            margin: 0 !important;
            padding: 0.8cm !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            page-break-inside: avoid;
          }
          
          .certificado-print h1 {
            font-size: 24pt !important;
            margin: 0.5cm 0 0.3cm 0 !important;
            page-break-after: avoid;
          }
          
          .certificado-print p {
            font-size: 11pt !important;
            line-height: 1.4 !important;
            margin: 0.3cm 0 !important;
            page-break-inside: avoid;
          }
          
          .certificado-print .text-base {
            font-size: 10pt !important;
          }
          
          .certificado-print .text-lg {
            font-size: 12pt !important;
          }
          
          .certificado-print .text-sm {
            font-size: 9pt !important;
          }
          
          .certificado-print .text-xs {
            font-size: 8pt !important;
          }
          
          .certificado-print .space-y-8 > * {
            margin-top: 0.4cm !important;
            margin-bottom: 0.4cm !important;
          }
          
          .certificado-print .space-y-4 > * {
            margin-top: 0.2cm !important;
            margin-bottom: 0.2cm !important;
          }
          
          .certificado-print .py-12 {
            padding-top: 0.5cm !important;
            padding-bottom: 0.5cm !important;
          }
          
          .certificado-print .px-8 {
            padding-left: 0.5cm !important;
            padding-right: 0.5cm !important;
          }
          
          .certificado-print .grid {
            page-break-inside: avoid;
          }
          
          .certificado-print .grid > div {
            page-break-inside: avoid;
          }
          
          .certificado-print button,
          .certificado-print .no-print,
          .certificado-print a:not([href^="http"]):not([href^="#"]):not([href^="/"]) {
            display: none !important;
          }
          
          .certificado-print .bg-gradient-to-r,
          .certificado-print .bg-gray-50,
          .certificado-print .bg-gray-100 {
            background: white !important;
          }
          
          .certificado-print .text-white {
            color: #000 !important;
          }
          
          .certificado-print .border-4,
          .certificado-print .border-2 {
            border-width: 1px !important;
          }
          
          .certificado-print .rounded-lg,
          .certificado-print .rounded-2xl {
            border-radius: 0 !important;
          }
          
          .certificado-print svg[class*="QRCode"] {
            width: 100px !important;
            height: 100px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificadoDigital;

