/**
 * Mapeo programa → SKUs Stripe (mantener alineado con src/data/programasOferta.js).
 * amountMxn: validación server-side (no confiar en el cliente).
 */

const PROGRAMAS_CHECKOUT = {
  "Educación Cósmica y Grandes Lecciones": {
    tipo: "diplomado",
    skuPrograma: "diplomado_educacion_cosmica",
    amountMxnPrograma: 2800,
    nivelFormulario: "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)",
  },
  "Diplomado en Neuroeducación": {
    tipo: "diplomado",
    skuPrograma: "diplomado_neuroeducacion",
    amountMxnPrograma: 4500,
    nivelFormulario: "Diplomado en Neuroeducación (3 meses)",
  },
  "Guía en Taller I y II": {
    tipo: "guia",
    skuPrograma: "colegiatura_taller_inicio",
    amountMxnPrograma: 3900,
    nivelFormulario: "Guía en Taller I y II (con duración 20 meses)",
  },
  "Guía en Casa de Niños": {
    tipo: "guia",
    skuPrograma: "colegiatura_casa_inicio",
    amountMxnPrograma: 3500,
    nivelFormulario: "Guía en Casa de Niños (con duración 17 meses)",
  },
  "Guía en Nido y Comunidad Infantil": {
    tipo: "guia",
    skuPrograma: "colegiatura_nido_inicio",
    amountMxnPrograma: 3100,
    nivelFormulario: "Guía en Nido & Comunidad Infantil (Duración 16 meses)",
  },
};

const SKU_INSCRIPCION = "inscripcion_diplomado";
const AMOUNT_INSCRIPCION_MXN = 4900;

/**
 * @param {string} programaLabel
 * @return {object|null}
 */
function getProgramaCheckout(programaLabel) {
  return PROGRAMAS_CHECKOUT[String(programaLabel || "").trim()] || null;
}

/**
 * @param {object} options
 * @param {string} [options.programa]
 * @param {boolean} [options.soloInscripcion]
 * @param {string} [options.sku]
 * @return {{items: Array<{sku: string, quantity: number}>, programaLabel: string|null, modo: string}}
 */
function buildCheckoutItemsFromRequest(options = {}) {
  const programaLabel = String(options.programa || "").trim();
  const soloInscripcion = Boolean(options.soloInscripcion);

  if (programaLabel) {
    const prog = getProgramaCheckout(programaLabel);
    if (!prog) {
      throw new Error("Programa no válido para pago en línea");
    }
    if (soloInscripcion) {
      return {
        items: [{sku: SKU_INSCRIPCION, quantity: 1}],
        programaLabel,
        modo: "solo_inscripcion",
      };
    }
    return {
      items: [
        {sku: SKU_INSCRIPCION, quantity: 1},
        {sku: prog.skuPrograma, quantity: 1},
      ],
      programaLabel,
      modo: "inicio_completo",
    };
  }

  const sku = String(options.sku || SKU_INSCRIPCION).trim();
  return {
    items: [{sku, quantity: options.quantity || 1}],
    programaLabel: null,
    modo: "sku_directo",
  };
}

/**
 * @param {string[]} skus
 * @return {string}
 */
function resolveOrdenTipo(skus) {
  const hasInscripcion = skus.includes(SKU_INSCRIPCION);
  const hasPrograma = skus.some((s) => s !== SKU_INSCRIPCION && !s.startsWith("libro_"));
  if (hasInscripcion && hasPrograma) return "inicio_programa";
  if (hasInscripcion) return "inscripcion";
  if (skus.some((s) => s.startsWith("libro_"))) return "libro";
  return "programa";
}

/**
 * Monto esperado en MXN para auditoría (no sustituye verificación Stripe).
 * @param {Array<{sku: string, quantity: number}>} items
 * @param {import('./catalog').CATALOG_META} catalogMeta
 */
function estimateTotalMxn(items, catalogMeta) {
  return items.reduce((sum, {sku, quantity}) => {
    const meta = catalogMeta[sku];
    const unit = meta?.amountMxn || 0;
    return sum + unit * (quantity || 1);
  }, 0);
}

const TIPOS_ORDEN_FLUJO_INSCRIPCION = new Set(["inscripcion", "inicio_programa"]);

/**
 * @param {string} tipo
 * @return {boolean}
 */
function isOrdenFlujoInscripcion(tipo) {
  return TIPOS_ORDEN_FLUJO_INSCRIPCION.has(tipo);
}

module.exports = {
  PROGRAMAS_CHECKOUT,
  SKU_INSCRIPCION,
  AMOUNT_INSCRIPCION_MXN,
  TIPOS_ORDEN_FLUJO_INSCRIPCION,
  getProgramaCheckout,
  buildCheckoutItemsFromRequest,
  resolveOrdenTipo,
  estimateTotalMxn,
  isOrdenFlujoInscripcion,
};
