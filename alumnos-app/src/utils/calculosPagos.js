/**
 * Utilidades para cálculos de pagos, recargos, becas, etc.
 */

/**
 * Calcular recargo por retraso
 * IMPORTANTE: El recargo se aplica a partir del día 11, ya que la fecha límite es el día 10
 */
export const calcularRecargo = (monto, fechaVencimiento, fechaPago, recargoPorcentaje = 10, recargoActivo = true, diaVencimiento = 10) => {
  if (!recargoActivo) return 0;
  
  const vencimiento = fechaVencimiento instanceof Date ? fechaVencimiento : fechaVencimiento?.toDate?.() || new Date(fechaVencimiento);
  const pago = fechaPago instanceof Date ? fechaPago : fechaPago?.toDate?.() || new Date(fechaPago);
  
  // Crear fecha límite (día 10 del mes de vencimiento, a las 23:59:59)
  const fechaLimite = new Date(vencimiento.getFullYear(), vencimiento.getMonth(), diaVencimiento, 23, 59, 59, 999);
  
  // Si el pago es antes o el día de la fecha límite (día 10), no hay recargo
  // El recargo se aplica a partir del día 11
  if (pago <= fechaLimite) return 0;
  
  // Calcular días de retraso desde la fecha límite
  const diasRetraso = Math.ceil((pago - fechaLimite) / (1000 * 60 * 60 * 24));
  
  // Solo aplicar recargo si hay retraso (día 11 o posterior)
  if (diasRetraso > 0) {
    return (monto * recargoPorcentaje) / 100;
  }
  
  return 0;
};

/**
 * Calcular si aplica recargo basado en fecha de vencimiento y fecha actual
 * IMPORTANTE: Los recargos solo se aplican a colegiaturas
 */
export const aplicaRecargo = (fechaVencimiento, diaVencimiento = 10, recargoActivo = true, tipoPago = null) => {
  // Solo aplicar recargo si es una colegiatura
  if (tipoPago !== 'Colegiatura') {
    return false;
  }
  
  if (!recargoActivo) return false;
  
  const hoy = new Date();
  const vencimiento = fechaVencimiento instanceof Date 
    ? fechaVencimiento 
    : fechaVencimiento?.toDate?.() || new Date(fechaVencimiento);
  
  // Crear fecha límite (día 10 del mes de vencimiento)
  const fechaLimite = new Date(vencimiento.getFullYear(), vencimiento.getMonth(), diaVencimiento);
  
  return hoy > fechaLimite;
};

/**
 * Calcular monto total con recargo
 * IMPORTANTE: Los recargos solo se aplican a colegiaturas
 * El recargo se aplica a partir del día 11, ya que la fecha límite es el día 10
 */
export const calcularMontoTotal = (monto, fechaVencimiento, recargoPorcentaje = 10, recargoActivo = true, fechaPago = null, tipoPago = null, diaVencimiento = 10) => {
  // Solo aplicar recargo si es una colegiatura
  if (tipoPago !== 'Colegiatura') {
    return monto;
  }
  
  if (!recargoActivo) {
    return monto;
  }
  
  const fechaCalculo = fechaPago || new Date();
  const recargo = calcularRecargo(monto, fechaVencimiento, fechaCalculo, recargoPorcentaje, recargoActivo, diaVencimiento);
  return monto + recargo;
};

/**
 * Calcular saldo pendiente
 */
export const calcularSaldoPendiente = (pagos) => {
  if (!pagos || pagos.length === 0) return 0;
  
  return pagos.reduce((total, pago) => {
    if (pago.estado === 'Validado') {
      return total - (pago.montoPagado || 0);
    }
    return total;
  }, 0);
};

/**
 * Calcular monto total adeudado
 */
export const calcularMontoAdeudado = (pagos, becas = [], configuracion = null) => {
  if (!pagos || pagos.length === 0) return 0;
  
  const pagosPendientes = pagos.filter(p => 
    p.estado === 'Pendiente' || p.estado === 'Vencido'
  );
  
  // Obtener día de vencimiento de la configuración (por defecto 10)
  const diaVencimiento = configuracion?.diaVencimiento || 10;
  
  let total = pagosPendientes.reduce((suma, pago) => {
    const montoBase = pago.montoOriginal !== undefined ? Number(pago.montoOriginal) : Number(pago.monto || 0);
    const montoConDescuentosRegistrados = Number((pago.monto ?? montoBase).toFixed(2));
    const montoConBeca = aplicarBeca(montoConDescuentosRegistrados, becas, { pago });
    // Solo aplicar recargo a colegiaturas
    const montoConRecargo = calcularMontoTotal(
      montoConBeca,
      pago.fechaVencimiento,
      pago.recargoPorcentaje || configuracion?.recargoPorcentaje,
      pago.recargoActivo !== undefined ? pago.recargoActivo : (configuracion?.recargoActivo && pago.tipo === 'Colegiatura'),
      null,
      pago.tipo, // Pasar el tipo de pago para verificar si es colegiatura
      diaVencimiento
    );
    return suma + montoConRecargo;
  }, 0);
  
  // Restar pagos validados
  const pagosValidados = pagos.filter(p => p.estado === 'Validado');
  const pagado = pagosValidados.reduce((suma, pago) => suma + (pago.montoPagado || 0), 0);
  
  return total - pagado;
};

/**
 * Generar fechas de vencimiento para colegiaturas
 */
export const generarFechasVencimiento = (fechaInicio, meses, diaVencimiento = 10) => {
  const fechas = [];
  const inicio = fechaInicio instanceof Date 
    ? fechaInicio 
    : fechaInicio?.toDate?.() || new Date(fechaInicio);
  
  for (let i = 0; i < meses; i++) {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth() + i, diaVencimiento);
    fechas.push(fecha);
  }
  
  return fechas;
};

/**
 * Formatear monto a moneda mexicana
 */
export const formatearMoneda = (monto) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
};

/**
 * Calcular próximos pagos
 */
export const obtenerProximosPagos = (pagos, cantidad = 5) => {
  if (!pagos || pagos.length === 0) return [];
  
  const hoy = new Date();
  const proximos = pagos
    .filter(pago => {
      const estado = pago.estado;
      const vencimiento = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
      return (estado === 'Pendiente' || estado === 'Vencido') && vencimiento >= hoy;
    })
    .sort((a, b) => {
      const fechaA = a.fechaVencimiento?.toDate?.() || new Date(a.fechaVencimiento);
      const fechaB = b.fechaVencimiento?.toDate?.() || new Date(b.fechaVencimiento);
      return fechaA - fechaB;
    })
    .slice(0, cantidad);
  
  return proximos;
};

/**
 * Calcular pagos vencidos
 */
export const obtenerPagosVencidos = (pagos) => {
  if (!pagos || pagos.length === 0) return [];
  
  const hoy = new Date();
  return pagos.filter(pago => {
    const estado = pago.estado;
    const vencimiento = pago.fechaVencimiento?.toDate?.() || new Date(pago.fechaVencimiento);
    return (estado === 'Pendiente' || estado === 'Vencido') && vencimiento < hoy;
  });
};

/**
 * Obtener costo según nivel
 */
export const obtenerCostoNivel = (nivel, configuracion) => {
  if (!configuracion?.costos) return null;
  
  const costos = configuracion.costos;
  
  // Buscar por nombre exacto o por coincidencia parcial
  for (const [key, valor] of Object.entries(costos)) {
    if (key.includes(nivel) || nivel.includes(key.split(' ')[0])) {
      return valor;
    }
  }
  
  return null;
};

const normalizarFechaValor = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  if (valor?.toDate) return valor.toDate();
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  return null;
};

const becaAplicaAPago = (beca, pago) => {
  if (!beca || beca.activa === false) return false;
  if (!pago) return true;
  const fechaVencimiento = normalizarFechaValor(pago.fechaVencimiento) || new Date();
  const inicio = normalizarFechaValor(beca.fechaInicio);
  const fin = normalizarFechaValor(beca.fechaFin);
  if (inicio && fechaVencimiento < inicio) return false;
  if (fin && fechaVencimiento > fin) return false;

  switch (beca.alcance) {
    case 'colegiaturas':
      return pago.tipo === 'Colegiatura';
    case 'inscripcion':
      return pago.tipo === 'Inscripción';
    case 'certificado':
      return pago.tipo === 'Certificado';
    case 'pago':
      return beca.pagoId && pago.id === beca.pagoId;
    case 'global':
    default:
      return true;
  }
};

export const aplicarBeca = (monto, becas = [], opciones = {}) => {
  const montoBase = Number(monto) || 0;
  if (!becas || becas.length === 0) return Number(Math.max(0, montoBase).toFixed(2));

  const pago = opciones?.pago;
  const becasAplicadasIds = new Set((pago?.becasAplicadas || []).map((item) => item.id));
  let montoConDescuento = montoBase;

  becas.forEach((beca) => {
    if (!beca?.activa) return;
    if (becasAplicadasIds.has(beca.id)) return;
    if (pago && !becaAplicaAPago(beca, pago)) return;

    if ((beca.tipo || 'porcentaje') === 'porcentaje') {
      const porcentaje = Math.min(100, Math.max(0, Number(beca.valor) || 0));
      montoConDescuento = montoConDescuento * (1 - porcentaje / 100);
    } else {
      const rebaja = Math.max(0, Number(beca.valor) || 0);
      montoConDescuento = montoConDescuento - Math.min(rebaja, montoConDescuento);
    }
  });

  return Number(Math.max(0, montoConDescuento).toFixed(2));
};

