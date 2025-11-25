import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  formatearMoneda,
  aplicaRecargo,
  calcularMontoTotal,
  aplicarBeca
} from '../utils/calculosPagos';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Pagos = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError } = useNotifications();
  const [pagos, setPagos] = useState([]);
  const [becas, setBecas] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [mostrarProximosPagos, setMostrarProximosPagos] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState('todos'); // 'todos', 'validados', 'pendientes', 'rechazados'
  const debeRedirigir = userData?.rol && userData.rol !== 'alumno';

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
  const montoAdeudado = calcularMontoAdeudado(pagos, becas, configuracion);
  
  // Calcular pagos pendientes a la fecha (con detalles)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaVencimiento = configuracion?.diaVencimiento || 10;
  
  const pagosPendientesDetalle = (pagosPendientes || []).map(pago => {
    if (!pago || !pago.fechaVencimiento) {
      return null;
    }
    try {
      const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
      if (isNaN(fechaVenc.getTime())) {
        return null;
      }
      const fechaLimite = new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), diaVencimiento, 23, 59, 59, 999);
      if (isNaN(fechaLimite.getTime())) {
        return null;
      }
      const diasVencidos = hoy > fechaLimite ? Math.ceil((hoy - fechaLimite) / (1000 * 60 * 60 * 24)) : 0;
      const tieneRecargo = pago.tipo === 'Colegiatura' && aplicaRecargo(pago.fechaVencimiento, diaVencimiento, configuracion?.recargoActivo, pago.tipo);
      const esVencido = hoy > fechaLimite;
      
      const montoBase = pago.montoOriginal !== undefined ? Number(pago.montoOriginal) : Number(pago.monto || 0);
      if (isNaN(montoBase)) {
        return null;
      }
      const montoConDescuentosRegistrados = Number((pago.monto ?? montoBase).toFixed(2));
      const montoConBeca = aplicarBeca(montoConDescuentosRegistrados, becas || [], { pago });
      if (isNaN(montoConBeca)) {
        return null;
      }
      const montoTotal = calcularMontoTotal(
        montoConBeca,
        pago.fechaVencimiento,
        pago.recargoPorcentaje || configuracion?.recargoPorcentaje,
        pago.recargoActivo !== undefined ? pago.recargoActivo : (configuracion?.recargoActivo && pago.tipo === 'Colegiatura'),
        null,
        pago.tipo,
        diaVencimiento
      );
      if (isNaN(montoTotal)) {
        return null;
      }
      const recargoAplicado = montoTotal - montoConBeca;
    
      return {
        ...pago,
        fechaVenc,
        fechaLimite,
        diasVencidos,
        tieneRecargo,
        esVencido,
        montoBase: montoConBeca,
        recargoAplicado,
        montoTotal
      };
    } catch (error) {
      console.warn('Error al procesar pago:', error, pago);
      return null;
    }
  }).filter(p => p !== null);
  
  // Segmentar pagos: vencidos vs próximos
  const pagosVencidosDetalle = pagosPendientesDetalle.filter(p => p && p.esVencido);
  const pagosProximosDetalle = pagosPendientesDetalle.filter(p => p && !p.esVencido);
  
  // Ordenar próximos pagos por fecha (más próximo primero)
  const pagosProximosOrdenados = [...pagosProximosDetalle].sort((a, b) => {
    const fechaA = a.fechaLimite?.getTime() || 0;
    const fechaB = b.fechaLimite?.getTime() || 0;
    return fechaA - fechaB;
  });
  
  // Mostrar solo el próximo pago inmediato por defecto
  const proximoPagoInmediato = pagosProximosOrdenados[0];
  const otrosProximosPagos = pagosProximosOrdenados.slice(1);
  
  // Calcular totales
  const totalVencidos = pagosVencidosDetalle.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
  const totalRecargosVencidos = pagosVencidosDetalle.reduce((sum, p) => sum + (p.recargoAplicado || 0), 0);
  const totalProximos = pagosProximosDetalle.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
  
  // Filtrar historial según filtro seleccionado
  const historialFiltrado = pagos.filter(pago => {
    if (filtroHistorial === 'todos') return true;
    if (filtroHistorial === 'validados') return pago.estado === 'Validado';
    if (filtroHistorial === 'pendientes') return pago.estado === 'Pendiente' || pago.estado === 'Vencido';
    if (filtroHistorial === 'rechazados') return pago.estado === 'Rechazado';
    return true;
  });

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

  if (debeRedirigir) {
    return <Navigate to="/admin" replace />;
  }

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

      {/* Estado de Cuenta - Resumen Principal */}
      {pagosPendientesDetalle.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow-lg p-6 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Estado de Cuenta
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hoy.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pagos Vencidos</p>
              <p className="text-3xl font-bold text-red dark:text-red-400">
                {pagosVencidosDetalle.length}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatearMoneda(totalVencidos)}
              </p>
              {totalRecargosVencidos > 0 && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Incluye {formatearMoneda(totalRecargosVencidos)} en recargos
                </p>
              )}
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total por Pagar</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatearMoneda(montoAdeudado)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {pagosPendientes.length} {pagosPendientes.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Próximos Pagos</p>
              <p className="text-3xl font-bold text-blue dark:text-blue-400">
                {pagosProximosDetalle.length}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatearMoneda(totalProximos)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pagos Vencidos */}
      {pagosVencidosDetalle.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-red dark:text-red-400 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6" />
                Pagos Vencidos ({pagosVencidosDetalle.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total vencido: <span className="font-bold text-red">{formatearMoneda(totalVencidos)}</span>
                {totalRecargosVencidos > 0 && (
                  <span className="ml-2 text-yellow-700 dark:text-yellow-300">
                    (incluye {formatearMoneda(totalRecargosVencidos)} en recargos)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagosVencidosDetalle.map((pago) => {
              const estado = obtenerEstadoPago(pago);
              const EstadoIcon = estado.icon;
              
              return (
                <div key={pago.id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-300 dark:border-red-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                          ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                          : (pago.tipo || 'Colegiatura')}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color} flex items-center gap-1`}>
                        <EstadoIcon className="w-3 h-3" />
                        {estado.texto}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha límite</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {pago.fechaLimite && !isNaN(pago.fechaLimite.getTime()) ? pago.fechaLimite.toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Días vencidos</p>
                        <p className="text-red dark:text-red-400 font-bold">
                          {pago.diasVencidos || 0} {pago.diasVencidos === 1 ? 'día' : 'días'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Monto base</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {formatearMoneda(pago.montoBase)}
                        </p>
                      </div>
                      {pago.recargoAplicado > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Recargo</p>
                          <p className="text-yellow-700 dark:text-yellow-300 font-bold">
                            +{formatearMoneda(pago.recargoAplicado)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total a pagar</p>
                      <p className="text-xl font-bold text-red dark:text-red-400">
                        {formatearMoneda(pago.montoTotal)}
                      </p>
                    </div>
                    
                    {!pago.comprobanteUrl && (
                      <button
                        onClick={() => abrirModalComprobante(pago)}
                        className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-red text-white rounded-lg hover:bg-red/90 transition-colors font-semibold text-sm"
                      >
                        <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
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

      {/* Pagos Validados */}
      {pagosValidados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-green dark:text-green-400 flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6" />
                Pagos Validados ({pagosValidados.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total validado: <span className="font-bold text-green">{formatearMoneda(pagosValidados.reduce((sum, p) => sum + (p.montoPagado || 0), 0))}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagosValidados.slice(0, 6).map((pago) => {
              const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
              
              return (
                <div key={pago.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-300 dark:border-green-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                          ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                          : (pago.tipo || 'Colegiatura')}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green/10 text-green flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        Validado
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de vencimiento</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {fechaVenc && !isNaN(fechaVenc.getTime()) ? fechaVenc.toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Monto pagado</p>
                        <p className="text-green-700 dark:text-green-300 font-bold">
                          {formatearMoneda(pago.montoPagado || 0)}
                        </p>
                      </div>
                    </div>
                    
                    {pago.comprobanteUrl && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <a
                          href={pago.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-sm"
                        >
                          Ver Comprobante
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximo Pago Inmediato */}
      {proximoPagoInmediato && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-blue" />
                Próximo Pago
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {pagosProximosDetalle.length > 1 && (
                  <span>Hay {pagosProximosDetalle.length - 1} {pagosProximosDetalle.length - 1 === 1 ? 'pago más' : 'pagos más'} pendientes</span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const estado = obtenerEstadoPago(proximoPagoInmediato);
              const EstadoIcon = estado.icon;
              
              return (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {proximoPagoInmediato.tipo === 'Colegiatura' && proximoPagoInmediato.numeroColegiatura 
                          ? `Colegiatura ${proximoPagoInmediato.numeroColegiatura}${proximoPagoInmediato.totalColegiaturas ? `/${proximoPagoInmediato.totalColegiaturas}` : ''}`
                          : (proximoPagoInmediato.tipo || 'Colegiatura')}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color} flex items-center gap-1`}>
                        <EstadoIcon className="w-3 h-3" />
                        {estado.texto}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha límite</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {proximoPagoInmediato.fechaLimite && !isNaN(proximoPagoInmediato.fechaLimite.getTime()) ? proximoPagoInmediato.fechaLimite.toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Días restantes</p>
                        <p className="text-blue dark:text-blue-400 font-bold">
                          {proximoPagoInmediato.fechaLimite && !isNaN(proximoPagoInmediato.fechaLimite.getTime()) ? Math.max(0, Math.ceil((proximoPagoInmediato.fechaLimite - hoy) / (1000 * 60 * 60 * 24))) : 0} días
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Monto base</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {formatearMoneda(proximoPagoInmediato.montoBase)}
                        </p>
                      </div>
                      {proximoPagoInmediato.recargoAplicado > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Recargo estimado</p>
                          <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                            +{formatearMoneda(proximoPagoInmediato.recargoAplicado)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total a pagar</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatearMoneda(proximoPagoInmediato.montoTotal)}
                      </p>
                    </div>
                    
                    {!proximoPagoInmediato.comprobanteUrl && (
                      <button
                        onClick={() => abrirModalComprobante(proximoPagoInmediato)}
                        className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors font-semibold text-sm"
                      >
                        <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                        Subir Comprobante
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Botón para mostrar más próximos pagos */}
          {otrosProximosPagos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setMostrarProximosPagos(!mostrarProximosPagos)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue/10 dark:bg-blue/20 text-blue dark:text-blue-300 rounded-lg hover:bg-blue/20 dark:hover:bg-blue/30 transition-colors font-medium"
              >
                {mostrarProximosPagos ? (
                  <>
                    <ChevronUpIcon className="w-5 h-5" />
                    Ocultar otros próximos pagos ({otrosProximosPagos.length})
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-5 h-5" />
                    Ver otros próximos pagos ({otrosProximosPagos.length})
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Otros próximos pagos (colapsable) */}
          {mostrarProximosPagos && otrosProximosPagos.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otrosProximosPagos.map((pago) => {
                const estado = obtenerEstadoPago(pago);
                const EstadoIcon = estado.icon;
                
                return (
                  <div key={pago.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                            ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                            : (pago.tipo || 'Colegiatura')}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color} flex items-center gap-1`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado.texto}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm flex-1">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Fecha límite</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {pago.fechaLimite && !isNaN(pago.fechaLimite.getTime()) ? pago.fechaLimite.toLocaleDateString('es-MX') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Días restantes</p>
                          <p className="text-blue dark:text-blue-400 font-bold">
                            {pago.fechaLimite && !isNaN(pago.fechaLimite.getTime()) ? Math.max(0, Math.ceil((pago.fechaLimite - hoy) / (1000 * 60 * 60 * 24))) : 0} días
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monto base</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {formatearMoneda(pago.montoBase)}
                          </p>
                        </div>
                        {pago.recargoAplicado > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Recargo estimado</p>
                            <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                              +{formatearMoneda(pago.recargoAplicado)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total a pagar</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatearMoneda(pago.montoTotal)}
                        </p>
                      </div>
                      
                      {!pago.comprobanteUrl && (
                        <button
                          onClick={() => abrirModalComprobante(pago)}
                          className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors font-semibold text-sm"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                          Subir Comprobante
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Historial de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Historial de Pagos
          </h2>
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {mostrarHistorial ? (
              <>
                <ChevronUpIcon className="w-5 h-5" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-5 h-5" />
                Mostrar
              </>
            )}
          </button>
        </div>
        
        {mostrarHistorial && (
          <>
            {/* Filtros del Historial */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroHistorial('todos')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filtroHistorial === 'todos'
                    ? 'bg-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos ({pagos.length})
              </button>
              <button
                onClick={() => setFiltroHistorial('validados')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filtroHistorial === 'validados'
                    ? 'bg-green text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Validados ({pagosValidados.length})
              </button>
              <button
                onClick={() => setFiltroHistorial('pendientes')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filtroHistorial === 'pendientes'
                    ? 'bg-yellow text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Pendientes ({pagosPendientes.length})
              </button>
              <button
                onClick={() => setFiltroHistorial('rechazados')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filtroHistorial === 'rechazados'
                    ? 'bg-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Rechazados ({pagos.filter(p => p.estado === 'Rechazado').length})
              </button>
            </div>
            
            {historialFiltrado.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No hay pagos que mostrar con el filtro seleccionado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historialFiltrado.map((pago) => {
                  const estado = obtenerEstadoPago(pago);
                  const EstadoIcon = estado.icon;
                  const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
                  const becasAplicadasPago = Array.isArray(pago.becasAplicadas) ? pago.becasAplicadas : [];
                  const descuentoRegistrado = pago.descuentoAplicado !== undefined
                    ? Number(pago.descuentoAplicado)
                    : pago.montoOriginal !== undefined
                      ? Number((pago.montoOriginal - (pago.monto ?? 0)).toFixed(2))
                      : 0;
                  
                  // Determinar color de borde según estado
                  let borderColor = 'border-gray-200 dark:border-gray-600';
                  let bgColor = 'bg-gray-50 dark:bg-gray-700/50';
                  if (pago.estado === 'Validado') {
                    borderColor = 'border-green-300 dark:border-green-700';
                    bgColor = 'bg-green-50 dark:bg-green-900/20';
                  } else if (pago.estado === 'Rechazado') {
                    borderColor = 'border-red-300 dark:border-red-700';
                    bgColor = 'bg-red-50 dark:bg-red-900/20';
                  } else if (pago.estado === 'Vencido') {
                    borderColor = 'border-red-300 dark:border-red-700';
                    bgColor = 'bg-red-50 dark:bg-red-900/20';
                  }
                  
                  return (
                    <div key={pago.id} className={`${bgColor} rounded-lg p-4 border-2 ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {pago.tipo === 'Colegiatura' && pago.numeroColegiatura 
                              ? `Colegiatura ${pago.numeroColegiatura}${pago.totalColegiaturas ? `/${pago.totalColegiaturas}` : ''}`
                              : (pago.tipo || 'Colegiatura')}
                          </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color} flex items-center gap-1`}>
                        <EstadoIcon className="w-3 h-3" />
                        {estado.texto}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de vencimiento</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {fechaVenc && !isNaN(fechaVenc.getTime()) ? fechaVenc.toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {formatearMoneda(pago.monto || 0)}
                        </p>
                      </div>
                      {pago.montoOriginal !== undefined && pago.montoOriginal !== null && pago.montoOriginal !== pago.monto && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monto original</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {formatearMoneda(pago.montoOriginal)}
                          </p>
                        </div>
                      )}
                      {descuentoRegistrado > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Descuento aplicado</p>
                          <p className="text-green-700 dark:text-green-300 font-bold">
                            -{formatearMoneda(descuentoRegistrado)}
                          </p>
                          {becasAplicadasPago.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {becasAplicadasPago.map((beca) => beca.nombre || beca.tipo || 'Descuento').join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      {pago.montoPagado && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monto pagado</p>
                          <p className="text-green-700 dark:text-green-300 font-bold">
                            {formatearMoneda(pago.montoPagado)}
                          </p>
                        </div>
                      )}
                      {pago.observaciones && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Observaciones</p>
                          <p className="text-gray-700 dark:text-gray-300 text-xs">
                            {pago.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-col gap-2">
                      {pago.comprobanteUrl && (
                        <a
                          href={pago.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-sm"
                        >
                          Ver Comprobante
                        </a>
                      )}
                      {(!pago.comprobanteUrl && (pago.estado === 'Pendiente' || pago.estado === 'Vencido')) && (
                        <button
                          onClick={() => abrirModalComprobante(pago)}
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors font-semibold text-sm"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                          Subir Comprobante
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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

