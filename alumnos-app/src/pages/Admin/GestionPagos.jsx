import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, getDoc, doc, updateDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNotifications } from '../../contexts/NotificationContext';
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
  generarPagosPorNivel,
  recalcularPagosConBecasActivas
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
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getNivelActivo } from '../../utils/alumnos';

const GestionPagos = () => {
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
    fechaVencimiento: '',
    montoPagado: '',
    fechaPago: '',
    recargoPorcentaje: '',
    recargoActivo: true,
    observaciones: '',
    estado: 'Pendiente',
    descripcion: ''
  });
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const crearPagoInicial = (alumnoId = '') => ({
    alumnoId,
    tipo: 'Colegiatura',
    monto: '',
    fechaVencimiento: '',
    descripcion: '',
    numeroColegiatura: '',
    totalColegiaturas: ''
  });
  const [nuevoPago, setNuevoPago] = useState(crearPagoInicial(alumnoIdParam || ''));
  const [alumnosLoading, setAlumnosLoading] = useState(true);
  const [generandoPagos, setGenerandoPagos] = useState(false);
  const crearBecaFormBase = (alumnoId = '') => ({
    alumnoId,
    nombre: '',
    tipo: 'porcentaje',
    valor: '',
    alcance: 'colegiaturas',
    pagoId: '',
    motivo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    aplicaRecargos: true
  });
  const [becaForm, setBecaForm] = useState(crearBecaFormBase(alumnoIdParam || ''));
  const [becaEditando, setBecaEditando] = useState(null);
  const [becasAlumno, setBecasAlumno] = useState([]);
  const [loadingBecas, setLoadingBecas] = useState(false);
  const [guardandoBeca, setGuardandoBeca] = useState(false);
  const [eliminandoBecaId, setEliminandoBecaId] = useState(null);
  const [recalculandoDescuentos, setRecalculandoDescuentos] = useState(false);

  const obtenerNombreNivelAlumno = (alumnoData) => {
    if (!alumnoData) {
      return '';
    }
    const nivelActivo = getNivelActivo(alumnoData);
    return nivelActivo?.nombre || alumnoData.nivel || '';
  };

  const alumnoSeleccionadoBeca = becaForm.alumnoId ? alumnos[becaForm.alumnoId] : null;
  const nivelAlumnoSeleccionadoBeca = obtenerNombreNivelAlumno(alumnoSeleccionadoBeca);

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

  const convertirFechaAInput = (valor) => {
    const fecha = valor?.toDate ? valor.toDate() : valor?.seconds ? new Date(valor.seconds * 1000) : typeof valor === 'string' ? new Date(valor) : valor;
    if (!fecha || Number.isNaN(fecha?.getTime?.())) return '';
    return fecha.toISOString().slice(0, 10);
  };

  const convertirInputATimestamp = (valor) => {
    if (!valor) return null;
    const fecha = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return null;
    return Timestamp.fromDate(fecha);
  };

  const recargarPagos = async () => {
    const pagosActualizados = await obtenerTodosLosPagos();
    setPagos(pagosActualizados);
  };

  const cargarBecasAlumno = async (alumnoId) => {
    if (!alumnoId) return;
    setLoadingBecas(true);
    try {
      const becasData = await obtenerBecasAlumno(alumnoId);
      setBecasAlumno(becasData);
    } catch (error) {
      console.error('Error al cargar becas:', error);
      showError('No se pudieron cargar los descuentos del alumno');
    } finally {
      setLoadingBecas(false);
    }
  };

  const plantillasDescuentos = [
    {
      id: 'contado5',
      label: 'Pago de contado 5%',
      data: {
        nombre: 'Descuento pago de contado',
        tipo: 'porcentaje',
        valor: 5,
        alcance: 'colegiaturas',
        motivo: 'Pago completo en una sola exhibición',
        descripcion: 'Aplica un 5% de descuento sobre todas las colegiaturas pendientes.',
        aplicaRecargos: false
      }
    },
    {
      id: 'ajuste500',
      label: 'Ajuste puntual $500',
      data: {
        nombre: 'Ajuste puntual',
        tipo: 'fijo',
        valor: 500,
        alcance: 'pago',
        motivo: 'Ajuste administrativo puntual',
        descripcion: 'Descuento directo de $500 aplicado a un pago específico.',
        aplicaRecargos: true
      }
    }
  ];

  const handleAbrirDescuentos = (alumnoId, pagoId = '') => {
    console.log('🔓 Abriendo modal de descuentos para alumno:', alumnoId);
    if (!alumnoId) {
      console.warn('⚠️ No se proporcionó alumnoId');
      showError('Selecciona un alumno para gestionar descuentos');
      return;
    }
    setBecaEditando(null);
    const nuevoForm = {
      ...crearBecaFormBase(alumnoId),
      alcance: pagoId ? 'pago' : 'colegiaturas',
      pagoId: pagoId || ''
    };
    console.log('📝 Configurando becaForm:', nuevoForm);
    setBecaForm(nuevoForm);
    setShowModalBeca(true);
    cargarBecasAlumno(alumnoId);
  };

  const aplicarPlantillaBeca = (plantilla) => {
    if (!becaForm.alumnoId) {
      showError('Primero selecciona un alumno');
      return;
    }
    const pagoSugerido = plantilla.data.alcance === 'pago'
      ? (pagos.find((pago) => pago.alumnoId === becaForm.alumnoId)?.id || '')
      : '';
    setBecaForm((prev) => ({
      ...prev,
      nombre: plantilla.data.nombre || prev.nombre,
      tipo: plantilla.data.tipo || prev.tipo,
      valor: plantilla.data.valor?.toString() || prev.valor,
      alcance: plantilla.data.alcance || prev.alcance,
      motivo: plantilla.data.motivo || prev.motivo,
      descripcion: plantilla.data.descripcion || prev.descripcion,
      aplicaRecargos: plantilla.data.aplicaRecargos !== undefined ? plantilla.data.aplicaRecargos : prev.aplicaRecargos,
      pagoId: plantilla.data.alcance === 'pago' ? (pagoSugerido || prev.pagoId) : ''
    }));
  };

  const handleEditarBeca = (beca) => {
    setBecaEditando(beca);
    setBecaForm({
      alumnoId: beca.alumnoId,
      nombre: beca.nombre || '',
      tipo: beca.tipo || 'porcentaje',
      valor: beca.valor !== undefined ? beca.valor.toString() : '',
      alcance: beca.alcance || 'global',
      pagoId: beca.pagoId || '',
      motivo: beca.motivo || '',
      descripcion: beca.descripcion || '',
      fechaInicio: convertirFechaAInput(beca.fechaInicio),
      fechaFin: convertirFechaAInput(beca.fechaFin),
      aplicaRecargos: beca.aplicaRecargos !== undefined ? beca.aplicaRecargos : true
    });
  };

  const handleCancelarEdicionBeca = () => {
    setBecaEditando(null);
    setBecaForm((prev) => crearBecaFormBase(prev.alumnoId));
  };

  const handleGuardarBeca = async () => {
    if (!becaForm.alumnoId) {
      showError('Selecciona un alumno para aplicar el descuento');
      return;
    }
    if (!becaForm.valor || Number(becaForm.valor) <= 0) {
      showError('El valor del descuento debe ser mayor que cero');
      return;
    }
    if (becaForm.alcance === 'pago' && !becaForm.pagoId) {
      showError('Selecciona el pago al que deseas aplicar el descuento');
      return;
    }

    setGuardandoBeca(true);
    try {
      const payload = {
        alumnoId: becaForm.alumnoId,
        nombre: becaForm.nombre?.trim() || 'Descuento personalizado',
        tipo: becaForm.tipo,
        valor: Number(becaForm.valor),
        alcance: becaForm.alcance,
        pagoId: becaForm.alcance === 'pago' ? becaForm.pagoId || null : null,
        motivo: becaForm.motivo,
        descripcion: becaForm.descripcion,
        fechaInicio: convertirInputATimestamp(becaForm.fechaInicio),
        fechaFin: convertirInputATimestamp(becaForm.fechaFin),
        aplicaRecargos: becaForm.aplicaRecargos
      };

      if (becaEditando) {
        await actualizarBeca(becaEditando.id, payload);
        success('Descuento actualizado correctamente');
      } else {
        await crearBeca(payload);
        success('Descuento creado y aplicado correctamente');
      }

      await cargarBecasAlumno(becaForm.alumnoId);
      await recargarPagos();
      if (!becaEditando) {
        setBecaForm(crearBecaFormBase(becaForm.alumnoId));
      }
      setBecaEditando(null);
    } catch (error) {
      console.error('Error al guardar beca:', error);
      showError('No se pudo guardar el descuento');
    } finally {
      setGuardandoBeca(false);
    }
  };

  const handleDesactivarBeca = async (beca) => {
    const confirmado = await confirm(
      '¿Eliminar descuento?',
      `Esta acción revertirá el descuento "${beca.nombre || beca.tipo}" en los pagos del alumno. ¿Deseas continuar?`
    );
    if (!confirmado) return;

    setEliminandoBecaId(beca.id);
    try {
      await eliminarBeca(beca.id);
      success('Descuento eliminado y montos actualizados');
      await cargarBecasAlumno(beca.alumnoId);
      await recargarPagos();
    } catch (error) {
      console.error('Error al eliminar beca:', error);
      showError('No se pudo eliminar el descuento');
    } finally {
      setEliminandoBecaId(null);
    }
  };

  const obtenerCostosNivelAlumno = useCallback((alumnoId) => {
    if (!alumnoId || !configuracion?.costos) return null;
    const alumnoSeleccionado = alumnos[alumnoId];
    const nivelAlumnoNombre = obtenerNombreNivelAlumno(alumnoSeleccionado);
    if (!nivelAlumnoNombre) return null;
    const nivelAlumno = nivelAlumnoNombre.toLowerCase();

    let coincidencia = null;
    for (const [key, valor] of Object.entries(configuracion.costos)) {
      const keyLower = key.toLowerCase();
      if (keyLower === nivelAlumno) {
        coincidencia = valor;
        break;
      }
      if (nivelAlumno.includes(keyLower) || keyLower.includes(nivelAlumno.split(' ')[0] || '')) {
        coincidencia = valor;
      }
    }
    return coincidencia;
  }, [alumnos, configuracion]);

  const sugerirSiguienteColegiatura = useCallback((alumnoId) => {
    const costos = obtenerCostosNivelAlumno(alumnoId);
    const totalEsperado = Number(costos?.meses || costos?.pagos || 0) || '';

    const colegiaturasAlumno = pagos
      .filter((pago) => pago.alumnoId === alumnoId && pago.tipo === 'Colegiatura');

    const numerosAsignados = new Set(
      colegiaturasAlumno
        .map((pago) => Number(pago.numeroColegiatura))
        .filter((numero) => Number.isFinite(numero) && numero > 0)
    );

    let numeroSugerido = 1;
    while (numerosAsignados.has(numeroSugerido)) {
      numeroSugerido += 1;
    }

    if (totalEsperado && numeroSugerido > totalEsperado) {
      numeroSugerido = '';
    }

    return {
      numero: numeroSugerido ? numeroSugerido.toString() : '',
      total: totalEsperado ? totalEsperado.toString() : ''
    };
  }, [obtenerCostosNivelAlumno, pagos]);

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

  const pagosDelAlumno = useMemo(() => {
    if (!becaForm.alumnoId) return [];
    return pagos.filter((pago) => pago.alumnoId === becaForm.alumnoId);
  }, [pagos, becaForm.alumnoId]);

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

  useEffect(() => {
    if (nuevoPago.tipo !== 'Colegiatura') {
      if (nuevoPago.numeroColegiatura || nuevoPago.totalColegiaturas) {
        setNuevoPago((prev) => ({ ...prev, numeroColegiatura: '', totalColegiaturas: '' }));
      }
      return;
    }
    if (!nuevoPago.alumnoId) return;
    const sugerencias = sugerirSiguienteColegiatura(nuevoPago.alumnoId);
    setNuevoPago((prev) => {
      const updates = {};
      if (!prev.numeroColegiatura && sugerencias.numero) {
        updates.numeroColegiatura = sugerencias.numero;
      }
      if (!prev.totalColegiaturas && sugerencias.total) {
        updates.totalColegiaturas = sugerencias.total;
      }
      return Object.keys(updates).length ? { ...prev, ...updates } : prev;
    });
  }, [nuevoPago.tipo, nuevoPago.alumnoId, nuevoPago.numeroColegiatura, nuevoPago.totalColegiaturas, sugerirSiguienteColegiatura]);

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

      const esColegiatura = nuevoPago.tipo === 'Colegiatura';
      let numeroColegiatura = null;
      let totalColegiaturas = null;

      if (esColegiatura) {
        numeroColegiatura = Number(nuevoPago.numeroColegiatura);
        if (!Number.isFinite(numeroColegiatura) || numeroColegiatura < 1) {
          showError('Ingresa un número de colegiatura válido (mayor o igual a 1)');
          return;
        }

        totalColegiaturas = nuevoPago.totalColegiaturas
          ? Number(nuevoPago.totalColegiaturas)
          : null;

        if (totalColegiaturas && (!Number.isFinite(totalColegiaturas) || totalColegiaturas < numeroColegiatura)) {
          showError('El total de colegiaturas no puede ser menor al número asignado');
          return;
        }

        const pagosAlumno = pagos.filter((pago) => pago.alumnoId === nuevoPago.alumnoId && pago.tipo === 'Colegiatura');
        if (pagosAlumno.some((pago) => Number(pago.numeroColegiatura) === numeroColegiatura)) {
          showError(`Ya existe una colegiatura con el número ${numeroColegiatura}.`);
          return;
        }

        if (!totalColegiaturas) {
          const costos = obtenerCostosNivelAlumno(nuevoPago.alumnoId);
          totalColegiaturas = Number(costos?.meses || costos?.pagos || '') || null;
        }
      }
      
      let descripcion = nuevoPago.descripcion?.trim() || '';
      if (esColegiatura) {
        const totalTexto = totalColegiaturas ? `${numeroColegiatura}/${totalColegiaturas}` : `${numeroColegiatura}`;
        if (!descripcion) {
          descripcion = `Colegiatura ${totalTexto}`;
        }
      }

      const payload = {
        alumnoId: nuevoPago.alumnoId,
        tipo: nuevoPago.tipo,
        monto,
        montoOriginal: monto, // Siempre guardar el monto original explícitamente
        fechaVencimiento: Timestamp.fromDate(fechaVenc),
        estado: 'Pendiente',
        descripcion,
        recargoPorcentaje: esColegiatura ? (configuracion?.recargoPorcentaje || 10) : 0,
        recargoActivo: esColegiatura ? (configuracion?.recargoActivo !== false) : false
      };
      
      console.log('📝 Creando pago con payload:', { ...payload, fechaVencimiento: 'Timestamp' });

      if (esColegiatura) {
        payload.numeroColegiatura = numeroColegiatura;
        if (totalColegiaturas) {
          payload.totalColegiaturas = totalColegiaturas;
        }
      }

      await crearPago(payload);

      // Aplicar descuentos activos al nuevo pago
      try {
        if (payload.alumnoId) {
          await recalcularPagosConBecasActivas(payload.alumnoId);
        }
      } catch (errorBecas) {
        console.warn('No se pudieron aplicar los descuentos al nuevo pago:', errorBecas);
      }

      success('Pago creado exitosamente');
      setShowModalCrearPago(false);
      setNuevoPago(crearPagoInicial(''));
      await recargarPagos();
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

    const nivelAlumnoNombre = obtenerNombreNivelAlumno(alumno);
    if (!nivelAlumnoNombre) {
      showError('El alumno no tiene nivel asignado');
      return;
    }

    try {
      setGenerandoPagos(true);
      console.log('🔄 Iniciando generación de pagos para:', alumno.nombre || alumno.email);
      console.log('   - Nivel del alumno:', nivelAlumnoNombre);
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
                const alumnoSeleccionado = filtroAlumno || alumnoIdParam || '';
                setNuevoPago(crearPagoInicial(alumnoSeleccionado));
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
            <button
              onClick={() => handleAbrirDescuentos(filtroAlumno || alumnoIdParam || '')}
              disabled={!filtroAlumno && !alumnoIdParam}
              className="inline-flex items-center px-4 py-2 bg-yellow text-gray-900 dark:text-gray-900 rounded-lg hover:bg-yellow/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title={!filtroAlumno && !alumnoIdParam ? 'Selecciona un alumno para gestionar descuentos' : 'Gestionar descuentos y becas del alumno'}
            >
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              Descuentos
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
                .map((alumno) => {
                  const nivelNombre = obtenerNombreNivelAlumno(alumno);
                  return (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.nombre || alumno.email || 'Sin nombre'}
                      {nivelNombre ? ` (${nivelNombre})` : ''}
                    </option>
                  );
                })
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
                    disabled={generandoPagos || !obtenerNombreNivelAlumno(alumnos[filtroAlumno])}
                    title={!obtenerNombreNivelAlumno(alumnos[filtroAlumno]) ? 'El alumno no tiene nivel asignado' : 'Generar pagos para este alumno'}
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
              const nivelActualAlumno = obtenerNombreNivelAlumno(alumno);
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
              const becasAplicadasPago = Array.isArray(pago.becasAplicadas) ? pago.becasAplicadas : [];
              const descuentoRegistrado = pago.descuentoAplicado !== undefined
                ? Number(pago.descuentoAplicado)
                : pago.montoOriginal !== undefined
                  ? Number((pago.montoOriginal - (pago.monto ?? 0)).toFixed(2))
                  : 0;

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
                        {pago.montoOriginal !== undefined && pago.montoOriginal !== null && pago.montoOriginal !== pago.monto && (
                          <p>
                            <span className="font-medium">Monto original:</span> {formatearMoneda(pago.montoOriginal)}
                          </p>
                        )}
                        {descuentoRegistrado > 0 && (
                          <p>
                            <span className="font-medium">Descuento aplicado:</span> -{formatearMoneda(descuentoRegistrado)}
                            {becasAplicadasPago.length > 0 && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {becasAplicadasPago.map((beca) => beca.nombre || beca.tipo || 'Descuento').join(', ')}
                              </span>
                            )}
                          </p>
                        )}
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
                              disabled={generandoPagos || !nivelActualAlumno}
                              title={!nivelActualAlumno ? 'El alumno no tiene nivel asignado' : 'Generar pagos para este alumno'}
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
                              const fechaPagoReal = pago.fechaPago?.toDate?.() || (pago.fechaPago ? new Date(pago.fechaPago) : null);
                              setPagoEditado({
                                monto: pago.monto || '',
                                fechaVencimiento: fechaVenc.toISOString().split('T')[0],
                                montoPagado: pago.montoPagado || '',
                                fechaPago: fechaPagoReal ? fechaPagoReal.toISOString().split('T')[0] : '',
                                recargoPorcentaje: pago.recargoPorcentaje !== undefined ? pago.recargoPorcentaje : (configuracion?.recargoPorcentaje || 10),
                                recargoActivo: pago.recargoActivo !== undefined ? pago.recargoActivo : (configuracion?.recargoActivo && pago.tipo === 'Colegiatura'),
                                observaciones: pago.observaciones || '',
                                estado: pago.estado || 'Pendiente',
                                descripcion: pago.descripcion || ''
                              });
                              setShowModalEditarPago(true);
                            }}
                            className="inline-flex items-center px-3 py-2 bg-purple/10 text-purple rounded-lg hover:bg-purple/20 dark:hover:bg-purple/30 transition-colors text-sm border border-purple/20"
                            title="Editar pago completo"
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

      {/* Modal Descuentos / Becas */}
      {showModalBeca && (() => {
        console.log('🎭 MODAL DE DESCUENTOS RENDERIZÁNDOSE');
        console.log('📋 showModalBeca:', showModalBeca);
        console.log('📋 becaForm:', JSON.stringify(becaForm, null, 2));
        console.log('📋 becaForm.alumnoId:', becaForm.alumnoId);
        return null;
      })()}
      {showModalBeca && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Descuentos y becas del alumno
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona descuentos adicionales para pagos específicos o para todas las colegiaturas. Los cambios se reflejan inmediatamente en los montos pendientes.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModalBeca(false);
                  handleCancelarEdicionBeca();
                }}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue/10 border border-blue/20 rounded-lg text-sm text-gray-700 dark:text-gray-200">
              <p>
                <span className="font-medium">Alumno:</span>{' '}
                {alumnos[becaForm.alumnoId]?.nombre || alumnos[becaForm.alumnoId]?.email || 'Selecciona un alumno'}
              </p>
              {nivelAlumnoSeleccionadoBeca && (
                <p className="mt-1">
                  <span className="font-medium">Nivel:</span> {nivelAlumnoSeleccionadoBeca}
                </p>
              )}
            </div>

            {loadingBecas ? (
              <LoadingSpinner
                message="Cargando descuentos del alumno..."
                className="h-40"
              />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Atajos rápidos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {plantillasDescuentos.map((plantilla) => (
                        <button
                          key={plantilla.id}
                          onClick={() => aplicarPlantillaBeca(plantilla)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-yellow/40 bg-yellow/20 text-yellow-900 hover:bg-yellow/30 transition-colors"
                        >
                          {plantilla.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Estos atajos precargan valores comunes (por ejemplo, 5% por pago de contado). Ajusta los datos según sea necesario antes de guardar.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {becaEditando ? 'Editar descuento' : 'Nuevo descuento'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Nombre del descuento
                        </label>
                        <input
                          type="text"
                          value={becaForm.nombre}
                          onChange={(e) => setBecaForm({ ...becaForm, nombre: e.target.value })}
                          placeholder="Ej. Descuento por pago de contado"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Tipo de descuento
                        </label>
                        <select
                          value={becaForm.tipo}
                          onChange={(e) => setBecaForm({ ...becaForm, tipo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="porcentaje">Porcentaje (%)</option>
                          <option value="fijo">Monto fijo ($)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Valor del descuento
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={becaForm.valor}
                          onChange={(e) => setBecaForm({ ...becaForm, valor: e.target.value })}
                          placeholder={becaForm.tipo === 'porcentaje' ? 'Ej. 5' : 'Ej. 500'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Alcance
                        </label>
                        <select
                          value={becaForm.alcance}
                          onChange={(e) => setBecaForm({ ...becaForm, alcance: e.target.value, pagoId: e.target.value === 'pago' ? becaForm.pagoId : '' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="colegiaturas">Todas las colegiaturas</option>
                          <option value="global">Todos los pagos</option>
                          <option value="pago">Pago específico</option>
                          <option value="inscripcion">Inscripción</option>
                          <option value="certificado">Certificado</option>
                        </select>
                      </div>

                      {becaForm.alcance === 'pago' && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Selecciona el pago
                          </label>
                          <select
                            value={becaForm.pagoId}
                            onChange={(e) => setBecaForm({ ...becaForm, pagoId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="">Seleccionar...</option>
                            {pagosDelAlumno.map((pago) => (
                              <option key={pago.id} value={pago.id}>
                                {`${pago.tipo}${pago.numeroColegiatura ? ` ${pago.numeroColegiatura}/${pago.totalColegiaturas || ''}` : ''} · ${formatearMoneda(pago.monto)} · ${pago.descripcion || ''}`}
                              </option>
                            ))}
                          </select>
                          {pagosDelAlumno.length === 0 && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              No se encontraron pagos para este alumno. Genera pagos primero para aplicar un descuento específico.
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Vigencia desde
                        </label>
                        <input
                          type="date"
                          value={becaForm.fechaInicio}
                          onChange={(e) => setBecaForm({ ...becaForm, fechaInicio: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Vigencia hasta
                        </label>
                        <input
                          type="date"
                          value={becaForm.fechaFin}
                          onChange={(e) => setBecaForm({ ...becaForm, fechaFin: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center gap-2">
                        <input
                          id="descuento-aplica-recargos"
                          type="checkbox"
                          checked={becaForm.aplicaRecargos}
                          onChange={(e) => setBecaForm({ ...becaForm, aplicaRecargos: e.target.checked })}
                          className="h-4 w-4 text-blue border-gray-300 rounded"
                        />
                        <label htmlFor="descuento-aplica-recargos" className="text-xs text-gray-600 dark:text-gray-400">
                          Mantener recargos en pagos con descuento (recomendado desactivar para descuentos por pronto pago)
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Motivo
                        </label>
                        <input
                          type="text"
                          value={becaForm.motivo}
                          onChange={(e) => setBecaForm({ ...becaForm, motivo: e.target.value })}
                          placeholder="Ej. Pago completo anticipado"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Descripción detallada (opcional)
                        </label>
                        <textarea
                          value={becaForm.descripcion}
                          onChange={(e) => setBecaForm({ ...becaForm, descripcion: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Anota condiciones o acuerdos específicos del descuento"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      {becaEditando && (
                        <button
                          onClick={handleCancelarEdicionBeca}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancelar edición
                        </button>
                      )}
                      <button
                        onClick={handleGuardarBeca}
                        disabled={guardandoBeca}
                        className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {guardandoBeca ? 'Guardando...' : becaEditando ? 'Actualizar descuento' : 'Guardar descuento'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Descuentos activos ({becasAlumno.length})
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔘🔘🔘 BOTÓN CLICKEADO - Aplicar descuentos');
                          console.log('📋 becaForm completo:', JSON.stringify(becaForm, null, 2));
                          console.log('📋 becaForm.alumnoId:', becaForm.alumnoId);
                          console.log('📋 recalculandoDescuentos:', recalculandoDescuentos);
                          
                          if (!becaForm.alumnoId) {
                            console.warn('⚠️ No hay alumnoId seleccionado');
                            showError('Selecciona un alumno primero');
                            return;
                          }
                          
                          setRecalculandoDescuentos(true);
                          try {
                            console.log('🔄 Iniciando recalculación de descuentos para alumno:', becaForm.alumnoId);
                            const resultado = await recalcularPagosConBecasActivas(becaForm.alumnoId);
                            console.log('✅ Recalculación completada:', resultado);
                            
                            if (resultado.actualizados === 0 && resultado.omitidos === 0) {
                              console.warn('⚠️ No se actualizó ningún pago');
                              showError('No se encontraron pagos para actualizar');
                            } else {
                              success(`Descuentos recalculados: ${resultado.actualizados} pagos actualizados, ${resultado.omitidos} omitidos`);
                            }
                            
                            // Esperar un momento para que Firestore procese las actualizaciones
                            console.log('⏳ Esperando 500ms para que Firestore procese...');
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            console.log('🔄 Recargando becas...');
                            await cargarBecasAlumno(becaForm.alumnoId);
                            
                            console.log('🔄 Recargando pagos...');
                            await recargarPagos();
                            console.log('✅ Pagos recargados');
                          } catch (error) {
                            console.error('❌ Error al recalcular descuentos:', error);
                            console.error('❌ Stack trace:', error.stack);
                            showError(`Error al recalcular los descuentos: ${error.message || 'Error desconocido'}`);
                          } finally {
                            setRecalculandoDescuentos(false);
                            console.log('🏁 Proceso de recalculación finalizado');
                          }
                        }}
                        disabled={recalculandoDescuentos || !becaForm.alumnoId}
                        className="text-xs px-3 py-1.5 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!becaForm.alumnoId ? 'Selecciona un alumno primero' : 'Recalcular descuentos en todos los pagos del alumno'}
                      >
                        {recalculandoDescuentos ? 'Recalculando...' : 'Aplicar descuentos'}
                        {!becaForm.alumnoId && ' (Selecciona alumno)'}
                      </button>
                      <button
                        onClick={() => becaForm.alumnoId && cargarBecasAlumno(becaForm.alumnoId)}
                        className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Actualizar lista
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {becasAlumno.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No hay descuentos activos para este alumno.
                      </p>
                    ) : (
                      becasAlumno.map((beca) => {
                        const vigenciaInicio = convertirFechaAInput(beca.fechaInicio);
                        const vigenciaFin = convertirFechaAInput(beca.fechaFin);
                        const alcanceLabel = {
                          global: 'Todos los pagos',
                          colegiaturas: 'Colegiaturas',
                          pago: 'Pago específico',
                          inscripcion: 'Inscripción',
                          certificado: 'Certificado'
                        }[beca.alcance || 'global'] || 'Personalizado';
                        return (
                          <div key={beca.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900/40">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {beca.nombre || 'Descuento'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {beca.tipo === 'porcentaje'
                                    ? `${beca.valor}%`
                                    : formatearMoneda(beca.valor)}{' '}
                                  · {alcanceLabel}
                                </p>
                                {beca.motivo && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Motivo: {beca.motivo}
                                  </p>
                                )}
                                {beca.descripcion && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {beca.descripcion}
                                  </p>
                                )}
                                {(vigenciaInicio || vigenciaFin) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Vigencia: {vigenciaInicio ? vigenciaInicio : 'sin inicio definido'}{vigenciaFin ? ` a ${vigenciaFin}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEditarBeca(beca)}
                                  className="px-3 py-1.5 text-xs rounded-lg border border-blue text-blue hover:bg-blue/10 transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDesactivarBeca(beca)}
                                  disabled={eliminandoBecaId === beca.id}
                                  className="px-3 py-1.5 text-xs rounded-lg border border-red text-red hover:bg-red/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {eliminandoBecaId === beca.id ? 'Eliminando...' : 'Eliminar'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
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
                  onChange={(e) => setNuevoPago({ ...nuevoPago, alumnoId: e.target.value, numeroColegiatura: '', totalColegiaturas: '' })}
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
                      .map((alumno) => {
                        const nivelNombre = obtenerNombreNivelAlumno(alumno);
                        return (
                          <option key={alumno.id} value={alumno.id}>
                            {alumno.nombre || alumno.email || 'Sin nombre'}
                            {nivelNombre ? ` (${nivelNombre})` : ''}
                          </option>
                        );
                      })
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
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    setNuevoPago((prev) => ({
                      ...prev,
                      tipo: nuevoTipo,
                      numeroColegiatura: nuevoTipo === 'Colegiatura' ? '' : '',
                      totalColegiaturas: nuevoTipo === 'Colegiatura' ? '' : ''
                    }));
                  }}
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
                    setNuevoPago(crearPagoInicial(''));
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
              {nuevoPago.tipo === 'Colegiatura' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de colegiatura *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={nuevoPago.numeroColegiatura}
                      onChange={(e) => setNuevoPago({ ...nuevoPago, numeroColegiatura: e.target.value })}
                      placeholder="Ej. 1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Se sugiere el siguiente número faltante según los pagos del alumno.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total de colegiaturas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={nuevoPago.totalColegiaturas}
                      onChange={(e) => setNuevoPago({ ...nuevoPago, totalColegiaturas: e.target.value })}
                      placeholder="Ej. 16"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Si se deja vacío, se usará el total configurado para el nivel del alumno.
                    </p>
                  </div>
                </div>
              )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Editar Pago
            </h3>
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Estado *
                  </label>
                  <select
                    value={pagoEditado.estado}
                    onChange={(e) => setPagoEditado({ ...pagoEditado, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Validado">Validado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
              </div>

              {/* Monto y fecha de vencimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {selectedPago.montoOriginal !== undefined && selectedPago.montoOriginal !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Monto original: {formatearMoneda(selectedPago.montoOriginal)}
                    </p>
                  )}
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
                    Original: {(selectedPago.fechaVencimiento?.toDate?.() || new Date(selectedPago.fechaVencimiento)).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>

              {/* Monto pagado y fecha de pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto Pagado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoEditado.montoPagado}
                    onChange={(e) => setPagoEditado({ ...pagoEditado, montoPagado: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Dejar vacío si no se ha pagado
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={pagoEditado.fechaPago}
                    onChange={(e) => setPagoEditado({ ...pagoEditado, fechaPago: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Fecha en que se realizó el pago
                  </p>
                </div>
              </div>

              {/* Recargo */}
              {selectedPago.tipo === 'Colegiatura' && (
                <div className="bg-yellow/10 border border-yellow/20 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Configuración de Recargo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Porcentaje de Recargo
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={pagoEditado.recargoPorcentaje}
                        onChange={(e) => setPagoEditado({ ...pagoEditado, recargoPorcentaje: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pagoEditado.recargoActivo}
                          onChange={(e) => setPagoEditado({ ...pagoEditado, recargoActivo: e.target.checked })}
                          className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Recargo activo
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={pagoEditado.descripcion}
                  onChange={(e) => setPagoEditado({ ...pagoEditado, descripcion: e.target.value })}
                  placeholder="Descripción del pago"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={pagoEditado.observaciones}
                  onChange={(e) => setPagoEditado({ ...pagoEditado, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionales sobre este pago..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Comprobante */}
              {selectedPago.comprobanteUrl && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-medium">Comprobante:</span>
                  </p>
                  <a
                    href={selectedPago.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue hover:underline inline-flex items-center gap-1"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    Ver comprobante actual
                  </a>
                  <button
                    onClick={() => {
                      setShowModalEditarPago(false);
                      setSelectedPago(selectedPago);
                      setArchivoComprobante(null);
                      setShowModalComprobante(true);
                    }}
                    className="ml-4 text-sm text-blue hover:underline"
                  >
                    Reemplazar comprobante
                  </button>
                </div>
              )}

              <div className="bg-blue/10 border border-blue/20 rounded-lg p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Nota:</strong> Los cambios en el monto o fecha de vencimiento pueden afectar el cálculo de recargos. Si hay descuentos activos, estos se mantendrán aplicados.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalEditarPago(false);
                    setSelectedPago(null);
                    setPagoEditado({
                      monto: '',
                      fechaVencimiento: '',
                      montoPagado: '',
                      fechaPago: '',
                      recargoPorcentaje: '',
                      recargoActivo: true,
                      observaciones: '',
                      estado: 'Pendiente',
                      descripcion: ''
                    });
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

                      const updateData = {
                        monto: montoEditado,
                        fechaVencimiento: nuevaFecha,
                        estado: pagoEditado.estado,
                        observaciones: pagoEditado.observaciones || '',
                        descripcion: pagoEditado.descripcion || ''
                      };

                      // Actualizar monto pagado si se especificó
                      if (pagoEditado.montoPagado) {
                        const montoPagadoNum = parseFloat(pagoEditado.montoPagado);
                        if (!isNaN(montoPagadoNum) && montoPagadoNum >= 0) {
                          updateData.montoPagado = montoPagadoNum;
                          // Calcular monto pendiente
                          const montoTotal = calcularMontoTotal(
                            montoEditado,
                            nuevaFecha,
                            pagoEditado.recargoPorcentaje || configuracion?.recargoPorcentaje || 10,
                            pagoEditado.recargoActivo && selectedPago.tipo === 'Colegiatura',
                            null,
                            selectedPago.tipo
                          );
                          const pendiente = Number((montoTotal - montoPagadoNum).toFixed(2));
                          if (pendiente > 0) {
                            updateData.montoPendiente = pendiente;
                          }
                        }
                      }

                      // Actualizar fecha de pago si se especificó
                      if (pagoEditado.fechaPago) {
                        const fechaPagoDate = new Date(pagoEditado.fechaPago);
                        if (!isNaN(fechaPagoDate.getTime())) {
                          if (fechaPagoDate > new Date()) {
                            showError('La fecha de pago no puede ser futura');
                            return;
                          }
                          updateData.fechaPago = Timestamp.fromDate(fechaPagoDate);
                        }
                      }

                      // Actualizar configuración de recargo para colegiaturas
                      if (selectedPago.tipo === 'Colegiatura') {
                        updateData.recargoPorcentaje = Number(pagoEditado.recargoPorcentaje) || configuracion?.recargoPorcentaje || 10;
                        updateData.recargoActivo = pagoEditado.recargoActivo;
                      }

                      await actualizarPago(selectedPago.id, updateData);
                      success('Pago actualizado exitosamente');
                      setShowModalEditarPago(false);
                      setSelectedPago(null);
                      setPagoEditado({
                        monto: '',
                        fechaVencimiento: '',
                        montoPagado: '',
                        fechaPago: '',
                        recargoPorcentaje: '',
                        recargoActivo: true,
                        observaciones: '',
                        estado: 'Pendiente',
                        descripcion: ''
                      });
                      
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
