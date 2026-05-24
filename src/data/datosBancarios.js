/**
 * Datos bancarios para inscripción por transferencia (sin tarjeta).
 * Actualizar aquí cuando cambien; también visibles en /inscripcion/transferencia
 */
export const DATOS_BANCARIOS_INSCRIPCION = {
  titular: "Asociación Montessori de México A.C.",
  banco: process.env.GATSBY_INSCRIPCION_BANCO || "BBVA México",
  cuenta: process.env.GATSBY_INSCRIPCION_CUENTA || "",
  clabe: process.env.GATSBY_INSCRIPCION_CLABE || "",
  moneda: "MXN",
  montoReferencia: "$4,900",
  concepto:
    "Inscripción + tu nombre completo (ej. Inscripción Juan Pérez García)",
  correoComprobante:
    process.env.GATSBY_INSCRIPCION_EMAIL_COMPROBANTE ||
    "inscripciones@certificacionmontessori.com",
}

export const tieneDatosBancariosCompletos = () =>
  Boolean(DATOS_BANCARIOS_INSCRIPCION.clabe || DATOS_BANCARIOS_INSCRIPCION.cuenta)
