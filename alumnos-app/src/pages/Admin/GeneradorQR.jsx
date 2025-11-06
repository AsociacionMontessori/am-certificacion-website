import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeftIcon, ArrowDownTrayIcon, PrinterIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const GeneradorQR = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlumnos = async () => {
      try {
        const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
        const alumnosData = alumnosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumnos(alumnosData);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      }
      setLoading(false);
    };
    loadAlumnos();
  }, []);

  const alumnosFiltrados = alumnos.filter(alumno => {
    const nombre = alumno.nombre?.toLowerCase() || '';
    const email = alumno.email?.toLowerCase() || '';
    const busquedaLower = busqueda.toLowerCase();
    return nombre.includes(busquedaLower) || email.includes(busquedaLower);
  });

  const urlCertificado = alumnoSeleccionado 
    ? `${window.location.origin}/certificado/${alumnoSeleccionado.id}`
    : '';

  // Método para descargar el QR como PNG
  const handleDescargarQR = async () => {
    if (!alumnoSeleccionado) return;
    
    // Buscar el elemento SVG del QR
    const qrElement = document.querySelector('#qr-permanente svg');
    if (!qrElement) {
      alert('No se pudo encontrar el código QR. Por favor, intenta de nuevo.');
      return;
    }
    
    try {
      // Convertir SVG a string
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Crear imagen desde SVG
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Crear canvas
        const canvas = document.createElement('canvas');
        const size = 800; // Tamaño grande para impresión de alta calidad
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Dibujar fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        
        // Dibujar QR
        ctx.drawImage(img, 0, 0, size, size);
        
        // Descargar como PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Error al generar la imagen. Por favor, intenta de nuevo.');
            return;
          }
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const nombreArchivo = `QR-Certificado-${alumnoSeleccionado.nombre?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'alumno'}.png`;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
        }, 'image/png', 1.0); // Calidad máxima
      };
      
      img.onerror = () => {
        alert('Error al cargar la imagen del QR. Por favor, intenta de nuevo.');
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('Error al descargar QR:', error);
      alert('Error al descargar el código QR. Por favor, intenta de nuevo.');
    }
  };

  const handleImprimirQR = () => {
    window.print();
  };

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
          to="/admin"
          className="inline-flex items-center text-blue hover:text-blue/80 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Generador de QR para Diplomas
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Genera códigos QR permanentes para imprimir en diplomas físicos. Estos QR apuntan directamente al certificado digital y no cambiarán nunca.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de búsqueda y selección */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Seleccionar Alumno
          </h2>
          
          {/* Búsqueda */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          {/* Lista de alumnos */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {alumnosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No se encontraron alumnos
              </p>
            ) : (
              alumnosFiltrados.map((alumno) => (
                <button
                  key={alumno.id}
                  onClick={() => setAlumnoSeleccionado(alumno)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    alumnoSeleccionado?.id === alumno.id
                      ? 'bg-blue/10 border-blue dark:bg-blue/20'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {alumno.nombre || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {alumno.email || 'Sin email'}
                  </p>
                  {alumno.nivel && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {alumno.nivel}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel de QR */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Código QR Permanente
          </h2>
          
          {alumnoSeleccionado ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alumno:
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {alumnoSeleccionado.nombre || 'Sin nombre'}
                </p>
                {alumnoSeleccionado.nivel && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Nivel: {alumnoSeleccionado.nivel}
                  </p>
                )}
              </div>

              {/* QR Code */}
              <div id="qr-permanente" className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600 print:border-0 print:bg-white">
                <div className="print:bg-white">
                  <QRCodeSVG
                    value={urlCertificado}
                    size={300}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="bg-blue/10 dark:bg-blue/20 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL del certificado:
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {urlCertificado}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDescargarQR}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green text-gray-900 rounded-lg hover:bg-green/90 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Descargar QR
                </button>
                <button
                  onClick={handleImprimirQR}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  Imprimir QR
                </button>
              </div>

              <div className="bg-yellow/10 dark:bg-yellow/20 border border-yellow/30 rounded-lg p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Nota:</strong> Este QR es permanente y apunta directamente al certificado digital. 
                  Puede imprimirlo en los diplomas físicos sin preocuparse de que cambie.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Selecciona un alumno para generar su código QR
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-gray-800, .rounded-xl, .shadow-sm, .border {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          #qr-permanente, #qr-permanente * {
            visibility: visible;
          }
          #qr-permanente {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            page-break-inside: avoid;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GeneradorQR;

