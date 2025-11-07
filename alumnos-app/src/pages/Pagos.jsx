import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  obtenerPagosAlumno, 
  obtenerConfiguracionPagos, 
  obtenerBecasAlumno,
  crearPago,
  subirComprobante,
  actualizarPago
} from '../services/pagosService';
import {
  calcularMontoAdeudado,
  calcularSaldoPendiente,
  formatearMoneda,
  obtenerProximosPagos,
  obtenerPagosVencidos,
  aplicaRecargo,
  calcularMontoTotal
} from '../utils/calculosPagos';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Pagos = () => {
  const { currentUser } = useAuth();
  const { success, error: showError } = useNotifications();
  const [pagos, setPagos] = useState([]);
  const [becas, setBecas] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [archivoComprobante, setArchivoComprobante] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const [pagosData, configData, becasData] = await Promise.all([
          obtenerPagosAlumno(currentUser.uid),
          obtenerConfiguracionPagos(),
          obtenerBecasAlumno(currentUser.uid)
        ]);
        
        setPagos(pagosData);
        setConfiguracion(configData);
        setBecas(becasData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showError('Error al cargar la información de pagos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, showError]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('El archivo debe ser menor a 5MB');
        return;
      }
      // Validar tipo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        showError('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      setArchivoComprobante(file);
    }
  };

  const handleSubirComprobante = async (pago) => {
    if (!archivoComprobante) {
      showError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    try {
      // Si el pago no existe, crearlo
      let pagoId = pago.id;
      if (!pagoId) {
        pagoId = await crearPago({
          alumnoId: currentUser.uid,
          tipo: pago.tipo || 'Colegiatura',
          monto: pago.monto,
          fechaVencimiento: pago.fechaVencimiento,
          estado: 'Pendiente',
          recargoPorcentaje: configuracion?.recargoPorcentaje || 10,
          recargoActivo: configuracion?.recargoActivo !== false
        });
      }

      // Subir comprobante
      const { url: urlComprobante, path: pathComprobante } = await subirComprobante(currentUser.uid, pagoId, archivoComprobante);
      
      // Actualizar pago con comprobante
      await actualizarPago(pagoId, {
        comprobanteUrl: urlComprobante,
        comprobantePath: pathComprobante,
        nombreArchivo: archivoComprobante.name,
        fechaSubida: new Date()
      });

      success('Comprobante subido exitosamente. Espera la validación del administrador.');
      
      // Recargar datos
      const pagosActualizados = await obtenerPagosAlumno(currentUser.uid);
      setPagos(pagosActualizados);
      
      setShowModal(false);
      setSelectedPago(null);
      setArchivoComprobante(null);
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      showError('Error al subir el comprobante. Por favor intenta de nuevo.');
    }
    setUploading(false);
  };

  const abrirModalComprobante = (pago) => {
    setSelectedPago(pago);
    setArchivoComprobante(null);
    setShowModal(true);
  };

  const pagosPendientes = pagos.filter(p => p.estado === 'Pendiente' || p.estado === 'Vencido');
  const pagosValidados = pagos.filter(p => p.estado === 'Validado');
  const pagosRechazados = pagos.filter(p => p.estado === 'Rechazado');
  const proximosPagos = obtenerProximosPagos(pagos, 5);
  const pagosVencidos = obtenerPagosVencidos(pagos);
  const montoAdeudado = calcularMontoAdeudado(pagos, becas);
  const saldoPendiente = calcularSaldoPendiente(pagos);

  const obtenerEstadoPago = (pago) => {
    if (pago.estado === 'Validado') return { texto: 'Validado', color: 'text-green', bg: 'bg-green/10', icon: CheckCircleIcon };
    if (pago.estado === 'Rechazado') return { texto: 'Rechazado', color: 'text-red', bg: 'bg-red/10', icon: XCircleIcon };
    if (pago.estado === 'Vencido') return { texto: 'Vencido', color: 'text-red', bg: 'bg-red/10', icon: ExclamationTriangleIcon };
    // Solo mostrar "Con Recargo" para colegiaturas
    if (pago.tipo === 'Colegiatura' && aplicaRecargo(pago.fechaVencimiento, configuracion?.diaVencimiento, configuracion?.recargoActivo, pago.tipo)) {
      return { texto: 'Con Recargo', color: 'text-yellow', bg: 'bg-yellow/10', icon: ExclamationTriangleIcon };
    }
    return { texto: 'Pendiente', color: 'text-blue', bg: 'bg-blue/10', icon: ClockIcon };
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg" 
        variant="montessori"
        message="Cargando información de pagos..."
        className="h-64"
      />
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pagos y Estado de Cuenta
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Consulta tus pagos, sube comprobantes y revisa tu estado de cuenta
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monto Adeudado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatearMoneda(montoAdeudado)}
              </p>
            </div>
            <CurrencyDollarIcon className="w-12 h-12 text-blue" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pagosPendientes.length}
              </p>
            </div>
            <ClockIcon className="w-12 h-12 text-yellow" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagos Validados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pagosValidados.length}
              </p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {pagosVencidos.length > 0 && (
        <div className="bg-red/10 dark:bg-red/20 border border-red/30 rounded-xl p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red mr-3" />
            <div>
              <h3 className="font-semibold text-red">Pagos Vencidos</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Tienes {pagosVencidos.length} {pagosVencidos.length === 1 ? 'pago vencido' : 'pagos vencidos'}. 
                Por favor sube tus comprobantes de pago.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Próximos Pagos */}
      {proximosPagos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Próximos Pagos
          </h2>
          <div className="space-y-3">
            {proximosPagos.map((pago) => {
              const estado = obtenerEstadoPago(pago);
              const EstadoIcon = estado.icon;
              // Solo calcular recargo para colegiaturas
              const montoTotal = calcularMontoTotal(
                pago.monto,
                pago.fechaVencimiento,
                pago.recargoPorcentaje || configuracion?.recargoPorcentaje,
                pago.recargoActivo !== undefined ? pago.recargoActivo : (configuracion?.recargoActivo && pago.tipo === 'Colegiatura'),
                null,
                pago.tipo
              );
              const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
              
              return (
                <div key={pago.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                            ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                            : (pago.tipo || 'Colegiatura')}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color}`}>
                          {estado.texto}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vence: {fechaVenc.toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {formatearMoneda(montoTotal)}
                      </p>
                    </div>
                    {!pago.comprobanteUrl && (
                      <button
                        onClick={() => abrirModalComprobante(pago)}
                        className="ml-4 inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                      >
                        <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                        Subir Comprobante
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Pagos
        </h2>
        <div className="space-y-3">
          {pagos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No hay pagos registrados
            </p>
          ) : (
            pagos.map((pago) => {
              const estado = obtenerEstadoPago(pago);
              const EstadoIcon = estado.icon;
              const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
              const fechaCreacion = pago.fechaCreacion?.toDate?.() || new Date(pago.fechaCreacion);
              
              return (
                <div key={pago.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                            ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                            : (pago.tipo || 'Colegiatura')}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color} flex items-center gap-1`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado.texto}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>Vencimiento: {fechaVenc.toLocaleDateString('es-MX')}</p>
                        <p>Monto: {formatearMoneda(pago.monto || 0)}</p>
                        {pago.montoPagado && (
                          <p>Pagado: {formatearMoneda(pago.montoPagado)}</p>
                        )}
                        {pago.observaciones && (
                          <p>Observaciones: {pago.observaciones}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {pago.comprobanteUrl && (
                        <a
                          href={pago.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Ver Comprobante
                        </a>
                      )}
                      {(!pago.comprobanteUrl && (pago.estado === 'Pendiente' || pago.estado === 'Vencido')) && (
                        <button
                          onClick={() => abrirModalComprobante(pago)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                        >
                          <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                          Subir Comprobante
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal para subir comprobante */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Subir Comprobante de Pago
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar archivo (JPG, PNG o PDF - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {archivoComprobante && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Archivo seleccionado: {archivoComprobante.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPago(null);
                    setArchivoComprobante(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSubirComprobante(selectedPago)}
                  disabled={!archivoComprobante || uploading}
                  className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;

