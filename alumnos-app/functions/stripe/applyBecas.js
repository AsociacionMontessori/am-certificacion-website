/**
 * Lógica de becas para el servidor (alineada con calculosPagos.js del cliente).
 */

const normalizarFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === "string") {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  if (valor?.toDate) return valor.toDate();
  if (typeof valor?.seconds === "number") return new Date(valor.seconds * 1000);
  return null;
};

const becaAplicaAPago = (beca, pago) => {
  if (!beca || beca.activa === false) return false;
  if (!pago) return true;
  const fechaVencimiento = normalizarFecha(pago.fechaVencimiento) || new Date();
  const inicio = normalizarFecha(beca.fechaInicio);
  const fin = normalizarFecha(beca.fechaFin);
  if (inicio && fechaVencimiento < inicio) return false;
  if (fin && fechaVencimiento > fin) return false;

  switch (beca.alcance) {
    case "colegiaturas":
      return pago.tipo === "Colegiatura";
    case "inscripcion":
      return pago.tipo === "Inscripción";
    case "certificado":
      return pago.tipo === "Certificado";
    case "pago":
      return beca.pagoId && pago.id === beca.pagoId;
    case "global":
    default:
      return true;
  }
};

/**
 * @param {number} monto
 * @param {Array} becas
 * @param {object} pago
 * @return {number}
 */
function aplicarBecasServidor(monto, becas = [], pago = null) {
  let montoActual = Number(monto) || 0;
  if (!becas.length) return Number(Math.max(0, montoActual).toFixed(2));

  const becasAplicadasIds = new Set((pago?.becasAplicadas || []).map((b) => b.id));

  becas.forEach((beca) => {
    if (!beca?.activa) return;
    if (becasAplicadasIds.has(beca.id)) return;
    if (pago && !becaAplicaAPago(beca, pago)) return;

    if ((beca.tipo || "porcentaje") === "porcentaje") {
      const porcentaje = Math.min(100, Math.max(0, Number(beca.valor) || 0));
      montoActual = montoActual * (1 - porcentaje / 100);
    } else {
      const rebaja = Math.max(0, Number(beca.valor) || 0);
      montoActual = montoActual - Math.min(rebaja, montoActual);
    }
  });

  return Number(Math.max(0, montoActual).toFixed(2));
}

/**
 * Calcula recargo de colegiatura (día 11+).
 */
function calcularMontoConRecargo(monto, pago, configuracion) {
  if (pago.tipo !== "Colegiatura") return monto;
  const recargoActivo = pago.recargoActivo !== undefined ?
    pago.recargoActivo :
    configuracion?.recargoActivo !== false;
  if (!recargoActivo) return monto;

  const diaVencimiento = configuracion?.diaVencimiento || 10;
  const porcentaje = pago.recargoPorcentaje || configuracion?.recargoPorcentaje || 10;
  const vencimiento = normalizarFecha(pago.fechaVencimiento);
  if (!vencimiento) return monto;

  const hoy = new Date();
  const fechaLimite = new Date(
      vencimiento.getFullYear(),
      vencimiento.getMonth(),
      diaVencimiento,
      23,
      59,
      59,
      999,
  );

  if (hoy <= fechaLimite) return monto;
  return monto + (monto * porcentaje) / 100;
}

module.exports = {aplicarBecasServidor, calcularMontoConRecargo};
