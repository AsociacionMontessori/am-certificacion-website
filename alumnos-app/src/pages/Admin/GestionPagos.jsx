import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import useCanEdit from '../../hooks/useCanEdit';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  obtenerTodosLosPagos,
  obtenerConfiguracionPagos,
  actualizarConfiguracionPagos,
  validarPago,
  rechazarPago,
  obtenerBecasAlumno,
  crearBeca,
  actualizarBeca,
  eliminarBeca,
  crearPago,
  actualizarPago,
  eliminarPago,
  subirComprobante,
  eliminarComprobante,
  generarPagosPorNivel
} from '../../services/pagosService';
import {
  formatearMoneda,
  calcularMontoTotal,
  aplicaRecargo
} from '../../utils/calculosPagos';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const GestionPagos = () => {
  const { userData } = useAuth();
  const canEdit = useCanEdit();
  const { success, error: showError, confirm } = useNotifications();
  const [searchParams] = useSearchParams();
  const alumnoIdParam = searchParams.get('alumno');
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState({});
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAlumno, setFiltroAlumno] = useState(alumnoIdParam || '');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'asc' o 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 20;
  
  // Debounce en búsqueda para mejorar performance
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedPago, setSelectedPago] = useState(null);
  const [showModalValidar, setShowModalValidar] = useState(false);
  const [showModalRechazar, setShowModalRechazar] = useState(false);
  const [showModalConfig, setShowModalConfig] = useState(false);
  const [showModalBeca, setShowModalBeca] = useState(false);
  const [showModalCrearPago, setShowModalCrearPago] = useState(false);
  const [showModalComprobante, setShowModalComprobante] = useState(false);
  const [showModalEditarPago, setShowModalEditarPago] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [pagoEditado, setPagoEditado] = useState({
    monto: '',
    fechaVencimiento: ''
  });
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [nuevoPago, setNuevoPago] = useState({
    alumnoId: alumnoIdParam || '',
    tipo: 'Colegiatura',
    monto: '',
    fechaVencimiento: '',
    descripcion: ''
  });
  const [alumnosLoading, setAlumnosLoading] = useState(true);
  const [generandoPagos, setGenerandoPagos] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pagosData, configData] = await Promise.all([
          obtenerTodosLosPagos(),
          obtenerConfiguracionPagos()
        ]);

        setPagos(pagosData);
        setConfiguracion(configData ? JSON.parse(JSON.stringify(configData)) : null);

        // Cargar TODOS los alumnos (no solo los que tienen pagos)
        setAlumnosLoading(true);
        let alumnosMap = {};
        try {
          // Intentar con orderBy primero
          try {
            const alumnosQuery = query(
              collection(db, 'alumnos'),
              orderBy('nombre', 'asc')
            );
            const alumnosSnapshot = await getDocs(alumnosQuery);
            alumnosSnapshot.docs.forEach(doc => {
              alumnosMap[doc.id] = { id: doc.id, ...doc.data() };
            });
          } catch (orderError) {
            // Si falla por índice, cargar sin orderBy y ordenar en cliente
            if (orderError.code === 'failed-precondition') {
              console.warn('Índice no encontrado, cargando alumnos sin ordenar');
              const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
              const alumnosArray = [];
              alumnosSnapshot.docs.forEach(doc => {
                alumnosArray.push({ id: doc.id, ...doc.data() });
              });
              // Ordenar en cliente por nombre
              alumnosArray.sort((a, b) => {
                const nombreA = (a.nombre || '').toLowerCase();
                const nombreB = (b.nombre || '').toLowerCase();
                return nombreA.localeCompare(nombreB);
              });
              // Convertir a mapa
              alumnosArray.forEach(alumno => {
                alumnosMap[alumno.id] = alumno;
              });
            } else {
              throw orderError;
            }
          }
        } catch (error) {
          console.error('Error al cargar alumnos:', error);
          // Fallback: cargar sin orderBy
          try {
            const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
            alumnosSnapshot.docs.forEach(doc => {
              alumnosMap[doc.id] = { id: doc.id, ...doc.data() };
            });
          } catch (fallbackError) {
            console.error('Error al cargar alumnos (fallback):', fallbackError);
            // Si aún falla, intentar cargar solo alumnos con pagos
            const alumnosIds = [...new Set(pagosData.map(p => p.alumnoId))];
            for (const alumnoId of alumnosIds) {
              try {
                const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId));
                if (alumnoDoc.exists()) {
                  alumnosMap[alumnoId] = { id: alumnoDoc.id, ...alumnoDoc.data() };
                }
              } catch (err) {
                console.warn(`Error al cargar alumno ${alumnoId}:`, err);
              }
            }
          }
        }
        
        console.log(`✅ Cargados ${Object.keys(alumnosMap).length} alumnos`);
        setAlumnos(alumnosMap);
        setAlumnosLoading(false);
        
        // Mostrar mensaje si no hay alumnos
        if (Object.keys(alumnosMap).length === 0) {
          console.warn('⚠️ No se encontraron alumnos en Firestore');
          showError('No se encontraron alumnos. Verifica que existan en Firestore.');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showError('Error al cargar la información de pagos');
        setAlumnosLoading(false);
      }
      setLoading(false);
    };

    loadData();
  }, [showError]);

  // Memoizar filtrado y ordenamiento para evitar recálculos innecesarios
  const filteredPagos = useMemo(() => {
    return pagos
      .filter(pago => {
        const matchEstado = !filtroEstado || pago.estado === filtroEstado;
        const matchAlumno = !filtroAlumno || pago.alumnoId === filtroAlumno;
        const matchTipo = !filtroTipo || pago.tipo === filtroTipo;
        const alumno = alumnos[pago.alumnoId];
        const matchSearch = !debouncedSearchTerm || 
          (alumno?.nombre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           alumno?.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           pago.tipo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           pago.descripcion?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        return matchEstado && matchAlumno && matchTipo && matchSearch;
      })
      .sort((a, b) => {
        const fechaA = a.fechaVencimiento?.toDate?.() || new Date(a.fechaVencimiento || 0);
        const fechaB = b.fechaVencimiento?.toDate?.() || new Date(b.fechaVencimiento || 0);
        return ordenFecha === 'asc' ? fechaA - fechaB : fechaB - fechaA;
      });
  }, [pagos, filtroEstado, filtroAlumno, filtroTipo, debouncedSearchTerm, ordenFecha, alumnos]);

  // Paginación
  const totalPaginas = Math.ceil(filteredPagos.length / itemsPorPagina);
  const pagosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return filteredPagos.slice(inicio, fin);
  }, [filteredPagos, paginaActual, itemsPorPagina]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, filtroAlumno, filtroTipo, debouncedSearchTerm, ordenFecha]);

  const handleValidarPago = async () => {
    if (!selectedPago) return;

    try {
      // Calcular recargo basado en la fecha de pago real
      let recargoCalculado = 0;
      let montoTotalConRecargo = selectedPago.monto || 0;
      
      if (selectedPago.tipo === 'Colegiatura' && configuracion?.recargoActivo) {
        const fechaVenc = selectedPago.fechaVencimiento?.toDate?.() || new Date(selectedPago.fechaVencimiento);
        const fechaPagoReal = fechaPago ? new Date(fechaPago) : new Date();
        const recargoPorcentaje = selectedPago.recargoPorcentaje || configuracion?.recargoPorcentaje || 10;
        
        // Calcular recargo solo si la fecha de pago es después de la fecha de vencimiento
        if (fechaPagoReal > fechaVenc) {
          recargoCalculado = (selectedPago.monto * recargoPorcentaje) / 100;
          montoTotalConRecargo = selectedPago.monto + recargoCalculado;
        }
      }

      await validarPago(selectedPago.id, observaciones);
      
      const updateData = {};
      
      if (montoPagado) {
        const monto = parseFloat(montoPagado);
        if (isNaN(monto) || monto < 0) {
          showError('El monto pagado debe ser un número positivo');
          return;
        }
        updateData.montoPagado = monto;
      } else {
        // Si no se especifica monto, usar el total con recargo
        updateData.montoPagado = montoTotalConRecargo;
      }
      
      // Validar fecha de pago
      if (fechaPago) {
        const fechaPagoDate = new Date(fechaPago);
        if (isNaN(fechaPagoDate.getTime())) {
          showError('La fecha de pago no es válida');
          return;
        }
        // No permitir fechas futuras
        if (fechaPagoDate > new Date()) {
          showError('La fecha de pago no puede ser futura');
          return;
        }
      }
      
      // Guardar fecha de pago (usar la especificada o la actual)
      if (fechaPago) {
        updateData.fechaPago = Timestamp.fromDate(new Date(fechaPago));
      } else {
        updateData.fechaPago = serverTimestamp();
      }
      
      // Guardar recargo calculado para referencia
      if (recargoCalculado > 0) {
        updateData.recargoAplicado = recargoCalculado;
      }
      
      await updateDoc(doc(db, 'pagos', selectedPago.id), updateData);
      
      success('Pago validado exitosamente');
      setShowModalValidar(false);
      setSelectedPago(null);
      setObservaciones('');
      setMontoPagado('');
      setFechaPago('');
      
      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al validar pago:', error);
      showError('Error al validar el pago');
    }
  };

  const handleRechazarPago = async () => {
    if (!selectedPago || !motivoRechazo) {
      showError('Por favor ingresa el motivo del rechazo');
      return;
    }

    try {
      await rechazarPago(selectedPago.id, motivoRechazo);
      success('Pago rechazado');
      setShowModalRechazar(false);
      setSelectedPago(null);
      setMotivoRechazo('');
      
      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al rechazar pago:', error);
      showError('Error al rechazar el pago');
    }
  };

  const handleGuardarConfiguracion = async () => {
    try {
      await actualizarConfiguracionPagos(configuracion);
      success('Configuración guardada exitosamente');
      setShowModalConfig(false);
      // Recargar configuración
      const configData = await obtenerConfiguracionPagos();
      setConfiguracion(configData);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      showError('Error al guardar la configuración');
    }
  };

  const handleCrearPago = async () => {
    if (!nuevoPago.alumnoId || !nuevoPago.monto || !nuevoPago.fechaVencimiento) {
      showError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const monto = parseFloat(nuevoPago.monto);
      if (isNaN(monto) || monto <= 0) {
        showError('El monto debe ser un número positivo');
        return;
      }

      const fechaVenc = new Date(nuevoPago.fechaVencimiento);
      if (isNaN(fechaVenc.getTime())) {
        showError('La fecha de vencimiento no es válida');
        return;
      }
      fechaVenc.setHours(23, 59, 59, 999);
      
      await crearPago({
        alumnoId: nuevoPago.alumnoId,
        tipo: nuevoPago.tipo,
        monto: monto,
        fechaVencimiento: Timestamp.fromDate(fechaVenc),
        estado: 'Pendiente',
        descripcion: nuevoPago.descripcion || '',
        recargoPorcentaje: configuracion?.recargoPorcentaje || 10,
        recargoActivo: nuevoPago.tipo === 'Colegiatura' ? (configuracion?.recargoActivo !== false) : false
      });

      success('Pago creado exitosamente');
      setShowModalCrearPago(false);
      setNuevoPago({
        alumnoId: '',
        tipo: 'Colegiatura',
        monto: '',
        fechaVencimiento: '',
        descripcion: ''
      });

      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al crear pago:', error);
      showError('Error al crear el pago');
    }
  };

  const handleFileChangeComprobante = (e) => {
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

  const handleSubirComprobante = async () => {
    if (!selectedPago || !archivoComprobante) {
      showError('Por favor selecciona un archivo');
      return;
    }

    setUploadingComprobante(true);
    try {
      const alumnoId = selectedPago.alumnoId;
      
      // Si ya existe un comprobante, eliminarlo primero
      if (selectedPago.comprobantePath) {
        try {
          await eliminarComprobante(selectedPago.comprobantePath);
        } catch (error) {
          console.warn('Error al eliminar comprobante anterior (puede que no exista):', error);
        }
      }

      // Subir nuevo comprobante
      const { url: urlComprobante, path: pathComprobante } = await subirComprobante(
        alumnoId, 
        selectedPago.id, 
        archivoComprobante
      );
      
      // Actualizar pago con comprobante
      await actualizarPago(selectedPago.id, {
        comprobanteUrl: urlComprobante,
        comprobantePath: pathComprobante,
        nombreArchivo: archivoComprobante.name,
        fechaSubida: serverTimestamp(),
        subidoPor: 'admin' // Indicar que fue subido por admin
      });

      success('Comprobante subido exitosamente');
      setShowModalComprobante(false);
      setSelectedPago(null);
      setArchivoComprobante(null);
      
      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      showError('Error al subir el comprobante. Por favor intenta de nuevo.');
    }
    setUploadingComprobante(false);
  };

  const handleGenerarPagosAlumno = async (alumnoId) => {
    if (!configuracion) {
      showError('No hay configuración de pagos disponible');
      return;
    }

    const alumno = alumnos[alumnoId];
    if (!alumno) {
      showError('Alumno no encontrado');
      return;
    }

    if (!alumno.nivel) {
      showError('El alumno no tiene nivel asignado');
      return;
    }

    setGenerandoPagos(true);
    try {
      console.log('🔄 Iniciando generación de pagos para:', alumno.nombre || alumno.email);
      console.log('   - Nivel del alumno:', alumno.nivel);
      console.log('   - Configuración disponible:', !!configuracion);
      console.log('   - Costos disponibles:', configuracion?.costos ? Object.keys(configuracion.costos) : 'No hay costos');
      
      const resultado = await generarPagosPorNivel(alumno, configuracion);
      
      if (resultado.pagosGenerados > 0) {
        success(resultado.mensaje);
      } else {
        showError(resultado.mensaje || 'No se generaron pagos. Verifica la consola para más detalles.');
      }
      
      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('❌ Error al generar pagos:', error);
      console.error('   - Detalles del error:', error.message);
      showError(error.message || 'Error al generar los pagos. Revisa la consola para más detalles.');
    }
    setGenerandoPagos(false);
  };

  const handleEliminarPago = async (pago) => {
    const alumno = alumnos[pago.alumnoId];
    const nombreAlumno = alumno?.nombre || alumno?.email || 'el alumno';
    const tipoPago = pago.tipo || 'pago';
    const montoPago = formatearMoneda(pago.monto || 0);
    
    const mensaje = `¿Estás seguro de que deseas eliminar este ${tipoPago} de ${montoPago} de ${nombreAlumno}?${
      pago.comprobanteUrl ? '\n\n⚠️ También se eliminará el comprobante asociado.' : ''
    }`;
    
    const confirmado = await confirm(mensaje, {
      title: 'Eliminar Pago',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmado) return;

    try {
      await eliminarPago(pago.id);
      success('Pago eliminado exitosamente');
      
      // Recargar pagos
      const pagosData = await obtenerTodosLosPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      showError('Error al eliminar el pago. Por favor intenta de nuevo.');
    }
  };

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

  // Memoizar estadísticas para evitar recálculos
  const stats = useMemo(() => ({
    total: pagos.length,
    pendientes: pagos.filter(p => p.estado === 'Pendiente' || p.estado === 'Vencido').length,
    validados: pagos.filter(p => p.estado === 'Validado').length,
    rechazados: pagos.filter(p => p.estado === 'Rechazado').length
  }), [pagos]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Pagos
            {alumnoIdParam && alumnos[alumnoIdParam] && (
              <span className="text-lg font-normal text-gray-600 dark:text-gray-400 ml-2">
                - {alumnos[alumnoIdParam].nombre}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Administra pagos, valida comprobantes y gestiona configuraciones
          </p>
          {alumnoIdParam && (
            <Link
              to={`/admin/alumno/${alumnoIdParam}`}
              className="mt-2 inline-flex items-center text-sm text-blue hover:text-blue/80"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Volver a detalles del alumno
            </Link>
          )}
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setNuevoPago({
                  alumnoId: alumnoIdParam || '',
                  tipo: 'Colegiatura',
                  monto: '',
                  fechaVencimiento: '',
                  descripcion: ''
                });
                setShowModalCrearPago(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Pago
            </button>
            <button
              onClick={() => setShowModalConfig(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Configuración
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pagos', value: stats.total, icon: CurrencyDollarIcon, color: 'text-blue' },
          { label: 'Pendientes', value: stats.pendientes, icon: ClockIcon, color: 'text-yellow' },
          { label: 'Validados', value: stats.validados, icon: CheckCircleIcon, color: 'text-green' },
          { label: 'Rechazados', value: stats.rechazados, icon: XCircleIcon, color: 'text-red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-12 h-12 ${stat.color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por alumno, tipo o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Validado">Validado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Pago
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="Colegiatura">Colegiatura</option>
              <option value="Inscripción">Inscripción</option>
              <option value="Certificado">Certificado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ordenar por Fecha
            </label>
            <select
              value={ordenFecha}
              onChange={(e) => setOrdenFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">Más recientes primero</option>
              <option value="asc">Más antiguos primero</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alumno 
            {alumnosLoading ? ' (cargando...)' : Object.keys(alumnos).length > 0 ? ` (${Object.keys(alumnos).length})` : ' (0)'}
          </label>
          <select
            value={filtroAlumno}
            onChange={(e) => setFiltroAlumno(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={alumnosLoading}
          >
            <option value="">Todos</option>
            {alumnosLoading ? (
              <option value="" disabled>Cargando alumnos...</option>
            ) : Object.keys(alumnos).length > 0 ? (
              Object.values(alumnos)
                .sort((a, b) => (a.nombre || a.email || '').localeCompare(b.nombre || b.email || ''))
                .map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre || alumno.email || 'Sin nombre'}
                  </option>
                ))
            ) : (
              <option value="" disabled>No hay alumnos disponibles</option>
            )}
          </select>
          {!alumnosLoading && Object.keys(alumnos).length === 0 && (
            <p className="text-xs text-red mt-1">
              ⚠️ No se encontraron alumnos. Verifica la consola del navegador para más detalles.
            </p>
          )}
        </div>
      </div>

      {/* Lista de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPagos.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No hay pagos que mostrar
              </p>
              {filtroAlumno && alumnos[filtroAlumno] && canEdit && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    El alumno <strong>{alumnos[filtroAlumno].nombre || alumnos[filtroAlumno].email}</strong> no tiene pagos registrados.
                  </p>
                  <button
                    onClick={() => handleGenerarPagosAlumno(filtroAlumno)}
                    className="inline-flex items-center px-4 py-2 bg-yellow text-gray-900 dark:text-gray-900 rounded-lg hover:bg-yellow/90 transition-colors"
                    disabled={generandoPagos || !alumnos[filtroAlumno].nivel}
                    title={!alumnos[filtroAlumno].nivel ? 'El alumno no tiene nivel asignado' : 'Generar pagos para este alumno'}
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {generandoPagos ? 'Generando...' : 'Generar Pagos para este Alumno'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            pagosPaginados.map((pago) => {
              const estado = obtenerEstadoPago(pago);
              const EstadoIcon = estado.icon;
              const alumno = alumnos[pago.alumnoId];
              const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
              // Solo calcular recargo para colegiaturas
              const montoTotal = calcularMontoTotal(
                pago.monto,
                pago.fechaVencimiento,
                pago.recargoPorcentaje || configuracion?.recargoPorcentaje,
                pago.recargoActivo !== undefined ? pago.recargoActivo : (configuracion?.recargoActivo && pago.tipo === 'Colegiatura'),
                null,
                pago.tipo
              );

              // Verificar si el alumno tiene pagos (para mostrar botón de generar)
              const pagosDelAlumno = pagos.filter(p => p.alumnoId === pago.alumnoId);
              const alumnoTienePagos = pagosDelAlumno.length > 0;

              return (
                <div key={pago.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
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
                        <p>
                          <span className="font-medium">Alumno:</span>{' '}
                          <Link to={`/admin/alumno/${pago.alumnoId}`} className="text-blue hover:underline">
                            {alumno?.nombre || alumno?.email || 'N/A'}
                          </Link>
                        </p>
                        <p>
                          <span className="font-medium">Vencimiento:</span> {fechaVenc.toLocaleDateString('es-MX')}
                        </p>
                        <p>
                          <span className="font-medium">Monto:</span> {formatearMoneda(pago.monto || 0)}
                          {montoTotal !== pago.monto && (
                            <span className="text-yellow ml-2">
                              (Total con recargo: {formatearMoneda(montoTotal)})
                            </span>
                          )}
                        </p>
                        {pago.montoPagado && (
                          <p>
                            <span className="font-medium">Pagado:</span> {formatearMoneda(pago.montoPagado)}
                            {pago.montoPagado < montoTotal && (
                              <span className="text-orange ml-2">
                                (Pendiente: {formatearMoneda(montoTotal - pago.montoPagado)})
                              </span>
                            )}
                            {pago.montoPagado > montoTotal && (
                              <span className="text-green ml-2">
                                (Excedente: {formatearMoneda(pago.montoPagado - montoTotal)})
                              </span>
                            )}
                          </p>
                        )}
                        {pago.observaciones && (
                          <p>
                            <span className="font-medium">Observaciones:</span> {pago.observaciones}
                          </p>
                        )}
                        {pago.motivoRechazo && (
                          <p className="text-red">
                            <span className="font-medium">Motivo rechazo:</span> {pago.motivoRechazo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pago.comprobanteUrl && (
                        <a
                          href={pago.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                          Ver Comprobante
                        </a>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPago(pago);
                              setArchivoComprobante(null);
                              setShowModalComprobante(true);
                            }}
                            className="inline-flex items-center px-3 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm"
                          >
                            <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                            {pago.comprobanteUrl ? 'Reemplazar' : 'Subir'} Comprobante
                          </button>
                          {alumno && (
                            <button
                              onClick={() => handleGenerarPagosAlumno(pago.alumnoId)}
                              className="inline-flex items-center px-3 py-2 bg-yellow text-gray-900 dark:text-gray-900 rounded-lg hover:bg-yellow/90 transition-colors text-sm"
                              disabled={generandoPagos || !alumno.nivel}
                              title={!alumno.nivel ? 'El alumno no tiene nivel asignado' : 'Generar pagos para este alumno'}
                            >
                              <PlusIcon className="w-4 h-4 mr-1" />
                              Generar Pagos
                            </button>
                          )}
                          {pago.estado === 'Pendiente' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPago(pago);
                                  setShowModalValidar(true);
                                }}
                                className="inline-flex items-center px-3 py-2 bg-green text-white dark:text-gray-900 rounded-lg hover:bg-green/90 transition-colors text-sm"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Validar
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPago(pago);
                                  setShowModalRechazar(true);
                                }}
                                className="inline-flex items-center px-3 py-2 bg-red text-white rounded-lg hover:bg-red/90 transition-colors text-sm"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Rechazar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPago(pago);
                              const fechaVenc = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
                              setPagoEditado({
                                monto: pago.monto || '',
                                fechaVencimiento: fechaVenc.toISOString().split('T')[0] // Formato YYYY-MM-DD
                              });
                              setShowModalEditarPago(true);
                            }}
                            className="inline-flex items-center px-3 py-2 bg-purple/10 text-purple rounded-lg hover:bg-purple/20 dark:hover:bg-purple/30 transition-colors text-sm border border-purple/20"
                            title="Editar monto y fecha de vencimiento"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarPago(pago)}
                            className="inline-flex items-center px-3 py-2 bg-red/10 text-red rounded-lg hover:bg-red/20 dark:hover:bg-red/30 transition-colors text-sm border border-red/20"
                            title="Eliminar pago"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {((paginaActual - 1) * itemsPorPagina) + 1} - {Math.min(paginaActual * itemsPorPagina, filteredPagos.length)} de {filteredPagos.length} pagos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pagina;
                  if (totalPaginas <= 5) {
                    pagina = i + 1;
                  } else if (paginaActual <= 3) {
                    pagina = i + 1;
                  } else if (paginaActual >= totalPaginas - 2) {
                    pagina = totalPaginas - 4 + i;
                  } else {
                    pagina = paginaActual - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors min-w-[40px] ${
                        pagina === paginaActual
                          ? 'bg-blue text-white'
                          : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pagina}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Validar Pago */}
      {showModalValidar && selectedPago && (() => {
        const fechaVenc = selectedPago.fechaVencimiento?.toDate?.() || new Date(selectedPago.fechaVencimiento);
        const fechaPagoReal = fechaPago ? new Date(fechaPago) : new Date();
        const montoBase = selectedPago.monto || 0;
        const recargoPorcentaje = selectedPago.recargoPorcentaje || configuracion?.recargoPorcentaje || 10;
        const recargoActivo = selectedPago.recargoActivo !== undefined ? selectedPago.recargoActivo : (configuracion?.recargoActivo && selectedPago.tipo === 'Colegiatura');
        
        // Calcular recargo basado en fecha de pago
        let recargoCalculado = 0;
        let montoTotalConRecargo = montoBase;
        
        if (selectedPago.tipo === 'Colegiatura' && recargoActivo && fechaPagoReal > fechaVenc) {
          recargoCalculado = (montoBase * recargoPorcentaje) / 100;
          montoTotalConRecargo = montoBase + recargoCalculado;
        }
        
        const montoSugerido = montoPagado ? parseFloat(montoPagado) : montoTotalConRecargo;
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Validar Pago
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Concepto:</span> {selectedPago.tipo === 'Colegiatura' && selectedPago.numeroColegiatura 
                      ? `Colegiatura ${selectedPago.numeroColegiatura}${selectedPago.totalColegiaturas ? `/${selectedPago.totalColegiaturas}` : ''}`
                      : (selectedPago.tipo || 'Colegiatura')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Monto base:</span> {formatearMoneda(montoBase)}
                  </p>
                  {selectedPago.tipo === 'Colegiatura' && recargoActivo && (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        <span className="font-medium">Vencimiento:</span> {fechaVenc.toLocaleDateString('es-MX')}
                      </p>
                      {recargoCalculado > 0 ? (
                        <p className="text-sm text-yellow mt-1">
                          <span className="font-medium">Recargo ({recargoPorcentaje}%):</span> {formatearMoneda(recargoCalculado)}
                        </p>
                      ) : (
                        <p className="text-sm text-green mt-1">
                          ✓ Sin recargo (pago antes del vencimiento)
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    <span className="font-medium">Total a pagar:</span> {formatearMoneda(montoTotalConRecargo)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Pago *
                  </label>
                  <input
                    type="date"
                    value={fechaPago || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFechaPago(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La fecha de pago determina si se aplica recargo. Si el pago fue antes del vencimiento, no habrá recargo.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto Pagado (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder={formatearMoneda(montoTotalConRecargo)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Si no se especifica, se registrará el total con recargo: {formatearMoneda(montoTotalConRecargo)}
                  </p>
                  {montoPagado && parseFloat(montoPagado) !== montoTotalConRecargo && (
                    <p className={`text-xs mt-1 ${parseFloat(montoPagado) < montoTotalConRecargo ? 'text-orange' : 'text-green'}`}>
                      {parseFloat(montoPagado) < montoTotalConRecargo 
                        ? `⚠️ Pago parcial. Pendiente: ${formatearMoneda(montoTotalConRecargo - parseFloat(montoPagado))}`
                        : `✓ Pago excedente. Excedente: ${formatearMoneda(parseFloat(montoPagado) - montoTotalConRecargo)}`
                      }
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Notas adicionales sobre este pago..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModalValidar(false);
                      setSelectedPago(null);
                      setObservaciones('');
                      setMontoPagado('');
                      setFechaPago('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleValidarPago}
                    className="flex-1 px-4 py-2 bg-green text-white dark:text-gray-900 rounded-lg hover:bg-green/90 transition-colors"
                  >
                    Validar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Rechazar Pago */}
      {showModalRechazar && selectedPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Rechazar Pago
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del Rechazo *
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalRechazar(false);
                    setSelectedPago(null);
                    setMotivoRechazo('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazarPago}
                  className="flex-1 px-4 py-2 bg-red text-white rounded-lg hover:bg-red/90 transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuración */}
      {showModalConfig && configuracion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Configuración de Pagos
            </h3>
            <div className="space-y-6">
              {/* Configuración básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Configuración General</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Porcentaje de Recargo (%)
                  </label>
                  <input
                    type="number"
                    value={configuracion.recargoPorcentaje || 10}
                    onChange={(e) => setConfiguracion({
                      ...configuracion,
                      recargoPorcentaje: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Día de Vencimiento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={configuracion.diaVencimiento || 10}
                    onChange={(e) => setConfiguracion({
                      ...configuracion,
                      diaVencimiento: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuracion.recargoActivo !== false}
                    onChange={(e) => setConfiguracion({
                      ...configuracion,
                      recargoActivo: e.target.checked
                    })}
                    className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Recargo Activo
                  </label>
                </div>
              </div>

              {/* Costos */}
              {configuracion.costos && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Costos por Nivel</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    {Object.entries(configuracion.costos).map(([nivel, costo]) => (
                      <div key={nivel} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-0 last:pb-0">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">{nivel}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {costo.mensual !== undefined && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Mensual</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={costo.mensual || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      mensual: parseFloat(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Meses</label>
                                <input
                                  type="number"
                                  value={costo.meses || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      meses: parseInt(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Inscripción</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={costo.inscripcion || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      inscripcion: parseFloat(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Certificado</label>
                                <input
                                  type="text"
                                  value={typeof costo.certificado === 'string' ? costo.certificado : (costo.certificado || '')}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    const valor = e.target.value;
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      certificado: isNaN(parseFloat(valor)) ? valor : parseFloat(valor)
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                  placeholder="2500 o texto"
                                />
                              </div>
                            </>
                          )}
                          {costo.total !== undefined && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Total</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={costo.total || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      total: parseFloat(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Pagos</label>
                                <input
                                  type="number"
                                  value={costo.pagos || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      pagos: parseInt(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Monto por pago</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={costo.montoPago || ''}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      montoPago: parseFloat(e.target.value) || 0
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Certificado</label>
                                <input
                                  type="text"
                                  value={typeof costo.certificado === 'string' ? costo.certificado : (costo.certificado || '')}
                                  onChange={(e) => {
                                    const nuevosCostos = { ...configuracion.costos };
                                    const valor = e.target.value;
                                    nuevosCostos[nivel] = {
                                      ...costo,
                                      certificado: isNaN(parseFloat(valor)) ? valor : parseFloat(valor)
                                    };
                                    setConfiguracion({
                                      ...configuracion,
                                      costos: nuevosCostos
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                  placeholder="Incluido o monto"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModalConfig(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleGuardarConfiguracion}
                  className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Pago */}
      {showModalCrearPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Crear Nuevo Pago
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alumno *
                </label>
                <select
                  value={nuevoPago.alumnoId}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, alumnoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">
                    {Object.keys(alumnos).length === 0 
                      ? 'Cargando alumnos...' 
                      : 'Seleccionar alumno...'}
                  </option>
                  {Object.keys(alumnos).length > 0 ? (
                    Object.values(alumnos)
                      .sort((a, b) => {
                        const nombreA = (a.nombre || a.email || '').toLowerCase();
                        const nombreB = (b.nombre || b.email || '').toLowerCase();
                        return nombreA.localeCompare(nombreB);
                      })
                      .map((alumno) => (
                        <option key={alumno.id} value={alumno.id}>
                          {alumno.nombre || alumno.email || 'Sin nombre'} 
                          {alumno.nivel ? ` (${alumno.nivel})` : ''}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No hay alumnos disponibles</option>
                  )}
                </select>
                {Object.keys(alumnos).length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Si no aparecen alumnos, verifica que existan en Firestore
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Pago *
                </label>
                <select
                  value={nuevoPago.tipo}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Colegiatura">Colegiatura</option>
                  <option value="Inscripción">Inscripción</option>
                  <option value="Certificado">Certificado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoPago.monto}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, monto: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={nuevoPago.fechaVencimiento}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={nuevoPago.descripcion}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Ej: Colegiatura mes de enero..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalCrearPago(false);
                    setNuevoPago({
                      alumnoId: '',
                      tipo: 'Colegiatura',
                      monto: '',
                      fechaVencimiento: '',
                      descripcion: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearPago}
                  className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Crear Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subir/Reemplazar Comprobante */}
      {showModalComprobante && selectedPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedPago.comprobanteUrl ? 'Reemplazar' : 'Subir'} Comprobante de Pago
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Alumno:</span> {alumnos[selectedPago.alumnoId]?.nombre || alumnos[selectedPago.alumnoId]?.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Tipo:</span> {selectedPago.tipo || 'Colegiatura'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className="font-medium">Monto:</span> {formatearMoneda(selectedPago.monto || 0)}
                </p>
              </div>
              {selectedPago.comprobanteUrl && (
                <div className="bg-yellow/10 border border-yellow/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow">
                    ⚠️ Ya existe un comprobante para este pago. Se reemplazará por el nuevo archivo.
                  </p>
                  <a
                    href={selectedPago.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:underline mt-1 inline-block"
                  >
                    Ver comprobante actual
                  </a>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Archivo (JPG, PNG o PDF - máx. 5MB) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChangeComprobante}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                {archivoComprobante && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Archivo seleccionado: {archivoComprobante.name} ({(archivoComprobante.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalComprobante(false);
                    setSelectedPago(null);
                    setArchivoComprobante(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={uploadingComprobante}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubirComprobante}
                  className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!archivoComprobante || uploadingComprobante}
                >
                  {uploadingComprobante ? 'Subiendo...' : selectedPago.comprobanteUrl ? 'Reemplazar' : 'Subir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pago */}
      {showModalEditarPago && selectedPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Editar Pago
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Pago
                </label>
                <input
                  type="text"
                  value={selectedPago.tipo || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pagoEditado.monto}
                  onChange={(e) => setPagoEditado({ ...pagoEditado, monto: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Monto original: {formatearMoneda(selectedPago.monto || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={pagoEditado.fechaVencimiento}
                  onChange={(e) => setPagoEditado({ ...pagoEditado, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Fecha original: {(selectedPago.fechaVencimiento?.toDate?.() || new Date(selectedPago.fechaVencimiento)).toLocaleDateString('es-MX')}
                </p>
              </div>
              <div className="bg-blue/10 border border-blue/20 rounded-lg p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Nota:</strong> Al modificar el monto o la fecha de vencimiento, el sistema recalculará automáticamente los recargos si aplican.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalEditarPago(false);
                    setSelectedPago(null);
                    setPagoEditado({ monto: '', fechaVencimiento: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!pagoEditado.monto || !pagoEditado.fechaVencimiento) {
                      showError('Por favor completa todos los campos requeridos');
                      return;
                    }

                    const montoEditado = parseFloat(pagoEditado.monto);
                    if (isNaN(montoEditado) || montoEditado <= 0) {
                      showError('El monto debe ser un número positivo');
                      return;
                    }

                    try {
                      const nuevaFecha = Timestamp.fromDate(new Date(pagoEditado.fechaVencimiento));
                      if (isNaN(nuevaFecha.toMillis())) {
                        showError('La fecha de vencimiento no es válida');
                        return;
                      }

                      await actualizarPago(selectedPago.id, {
                        monto: montoEditado,
                        fechaVencimiento: nuevaFecha
                      });
                      success('Pago actualizado exitosamente');
                      setShowModalEditarPago(false);
                      setSelectedPago(null);
                      setPagoEditado({ monto: '', fechaVencimiento: '' });
                      
                      // Recargar pagos
                      const pagosData = await obtenerTodosLosPagos();
                      setPagos(pagosData);
                    } catch (error) {
                      console.error('Error al actualizar pago:', error);
                      showError('Error al actualizar el pago');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPagos;
