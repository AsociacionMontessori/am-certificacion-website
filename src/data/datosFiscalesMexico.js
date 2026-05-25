/**
 * Datos fiscales para factura CFDI en México (solo aplica en territorio nacional).
 */
export const FACTURA_FISCAL_SOLO_MEXICO =
  "La factura fiscal con RFC solo aplica en México. Si nos visitas desde otro país, el comprobante será recibo normal sin deducción fiscal mexicana."

export const DATOS_FISCALES_FACTURA_MX = [
  { campo: "RFC", detalle: "Con homoclave, tal como aparece en tu constancia fiscal." },
  { campo: "Razón social", detalle: "Nombre o denominación exacta del contribuyente." },
  { campo: "Régimen fiscal", detalle: "Clave y descripción vigentes (ej. 612, 626, persona moral, etc.)." },
  { campo: "Uso de CFDI", detalle: "Ej. G03 (gastos en general), D10 (pagos por servicios educativos), según tu contador." },
  { campo: "Código postal fiscal", detalle: "Del domicilio registrado ante el SAT." },
  {
    campo: "Correo para envío de factura",
    detalle: "Donde recibirás el XML y el PDF.",
  },
]

export const NOTA_FACTURA_POST_PAGO =
  "Si elegiste factura fiscal, envía estos datos a admin@certificacionmontessori.com junto con tu comprobante de pago o en el paso 3 del expediente (cédula de identificación fiscal)."
