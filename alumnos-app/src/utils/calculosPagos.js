/**
 * Utilidades para cálculos de pagos, recargos, becas, etc.
 */

/**
 * Calcular recargo por retraso
 */
export const calcularRecargo = (monto, fechaVencimiento, fechaPago, recargoPorcentaje = 10, recargoActivo = true) => {
  if (!recargoActivo) return 0;
  
  const vencimiento = fechaVencimiento instanceof Date ? fechaVencimiento : fechaVencimiento?.toDate?.() || new Date(fechaVencimiento);
  const pago = fechaPago instanceof Date ? fechaPago : fechaPago?.toDate?.() || new Date(fechaPago);
  
  // Si el pago es antes o el día del vencimiento, no hay recargo
  if (pago <= vencimiento) return 0;
  
  // Calcular días de retraso
  const diasRetraso = Math.ceil((pago - vencimiento) / (1000 * 60 * 60 * 24));
  
  // Solo aplicar recargo si hay retraso
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
  
  // Obtener el día del mes del vencimiento
  const diaVenc = vencimiento.getDate();
  
  // Crear fecha límite (día 10 del mes de vencimiento)
  const fechaLimite = new Date(vencimiento.getFullYear(), vencimiento.getMonth(), diaVencimiento);
  
  return hoy > fechaLimite;
};

/**
 * Calcular monto total con recargo
 * IMPORTANTE: Los recargos solo se aplican a colegiaturas
 */
export const calcularMontoTotal = (monto, fechaVencimiento, recargoPorcentaje = 10, recargoActivo = true, fechaPago = null, tipoPago = null) => {
  // Solo aplicar recargo si es una colegiatura
  if (tipoPago !== 'Colegiatura') {
    return monto;
  }
  
  if (!recargoActivo) {
    return monto;
  }
  
  const fechaCalculo = fechaPago || new Date();
  const recargo = calcularRecargo(monto, fechaVencimiento, fechaCalculo, recargoPorcentaje, recargoActivo);
  return monto + recargo;
};

/**
 * Aplicar descuento de beca
 */
export const aplicarBeca = (monto, becas = []) => {
  if (!becas || becas.length === 0) return monto;
  
  let montoConDescuento = monto;
  becas.forEach(beca => {
    if (beca.activa && beca.tipo === 'porcentaje') {
      montoConDescuento = montoConDescuento * (1 - beca.valor / 100);
    } else if (beca.activa && beca.tipo === 'fijo') {
      montoConDescuento = montoConDescuento - beca.valor;
    }
  });
  
  return Math.max(0, montoConDescuento);
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
export const calcularMontoAdeudado = (pagos, becas = []) => {
  if (!pagos || pagos.length === 0) return 0;
  
  const pagosPendientes = pagos.filter(p => 
    p.estado === 'Pendiente' || p.estado === 'Vencido'
  );
  
  let total = pagosPendientes.reduce((suma, pago) => {
    const montoBase = pago.monto || 0;
    const montoConBeca = aplicarBeca(montoBase, becas);
    // Solo aplicar recargo a colegiaturas
    const montoConRecargo = calcularMontoTotal(
      montoConBeca,
      pago.fechaVencimiento,
      pago.recargoPorcentaje,
      pago.recargoActivo,
      null,
      pago.tipo // Pasar el tipo de pago para verificar si es colegiatura
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

