/**
 * Cuentas bancarias para inscripción por transferencia.
 * HSBC: recibo normal / público en general (sin factura fiscal con RFC).
 * BANORTE: factura fiscal para deducciones.
 */

export const CUENTAS_BANCARIAS = {
  recibo: {
    id: "hsbc",
    label: "Recibo normal",
    subtitulo: "Sin factura fiscal (público en general)",
    titular: "Carlos Alfonso Romero Muñoz",
    banco: "HSBC",
    cuenta: "6514494223",
    clabe: "021180065144942230",
  },
  factura: {
    id: "banorte",
    label: "Factura fiscal",
    subtitulo: "Con RFC para deducciones fiscales",
    titular: "Ernestina Roxana Muñoz Guevara",
    banco: "BANORTE",
    cuenta: "0245193426",
    clabe: "072180002451934260",
  },
}

export const DATOS_BANCARIOS_INSCRIPCION = {
  moneda: "MXN",
  montoReferencia: "$4,900",
  concepto:
    "Inscripción + tu nombre completo (ej. Inscripción Juan Pérez García)",
  correoComprobante:
    process.env.GATSBY_INSCRIPCION_EMAIL_COMPROBANTE ||
    "inscripciones@certificacionmontessori.com",
}

/** @param {boolean} requiereFacturaFiscal */
export const getCuentaBancaria = (requiereFacturaFiscal) =>
  requiereFacturaFiscal ? CUENTAS_BANCARIAS.factura : CUENTAS_BANCARIAS.recibo

export const tieneDatosBancariosCompletos = () =>
  Boolean(
    CUENTAS_BANCARIAS.recibo.clabe &&
      CUENTAS_BANCARIAS.factura.clabe
  )

/** Etiqueta contable para órdenes (Stripe / admin). */
export const getCuentaContableId = (requiereFacturaFiscal) =>
  requiereFacturaFiscal ? "banorte" : "hsbc"
