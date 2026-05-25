/** Catálogo del formulario de inscripción (sitio público Gatsby). */

import { mapProgramaCheckoutANivel as mapFromOferta } from "./programasOferta"

export const DOMINIO_INSTITUCIONAL = "certificacionmontessori.com"

/** Todos los programas actuales son en línea. */
export const MODALIDAD_INSCRIPCION = "En línea"

/**
 * Niveles del formulario (1:1 con Google Form y reglamentos Drive).
 * tipoPrograma: guia | diplomado | curso | otro
 */
export const NIVELES_ESPECIALIZACION = [
  {
    id: "guia-nido",
    label: "Guía en Nido & Comunidad Infantil (Duración 16 meses)",
    tipoPrograma: "guia",
    reglamentoKey: "nido",
  },
  {
    id: "guia-casa",
    label: "Guía en Casa de Niños (con duración 17 meses)",
    tipoPrograma: "guia",
    reglamentoKey: "casa",
  },
  {
    id: "guia-taller",
    label: "Guía en Taller I y II (con duración 20 meses)",
    tipoPrograma: "guia",
    reglamentoKey: "taller",
  },
  {
    id: "dip-cosmica",
    label: "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)",
    tipoPrograma: "diplomado",
    reglamentoKey: "cosmica",
  },
  {
    id: "dip-neuro",
    label: "Diplomado en Neuroeducación (3 meses)",
    tipoPrograma: "diplomado",
    reglamentoKey: "neuro",
  },
  {
    id: "curso-filosofia",
    label: "Curso de Filosofía Montessori y Psicología Educativa (3 meses)",
    tipoPrograma: "curso",
    reglamentoKey: "filosofia",
  },
  {
    id: "otro",
    label: "Otro",
    tipoPrograma: "otro",
    reglamentoKey: "otro",
  },
]

export const getNivelByLabel = (label) =>
  NIVELES_ESPECIALIZACION.find((n) => n.label === label) || null

export const ESCOLARIDAD_OPCIONES = [
  "Secundaria",
  "Preparatoria / Bachillerato",
  "Licenciatura",
  "Maestría",
  "Doctorado",
  "Otro",
]

/** Reglamentos públicos en Drive */
const REGLAMENTOS_POR_KEY = {
  nido: "https://drive.google.com/file/d/1Q6h7tWY2O_kbUlqWR0rMm8PogndDTvee/view?usp=drive_link",
  casa: "https://drive.google.com/file/d/1Aqsu9rH4W2KP2p0YdPyK2AHRQvJWWlPx/view?usp=sharing",
  taller: "https://drive.google.com/file/d/1Nd9mAau5M0m1ijn_bgvUVHJ39aIKDnri/view?usp=sharing",
  cosmica: "https://drive.google.com/file/d/141yAty6l1AuMfg2jZVsHum7nUj8msTOL/view?usp=sharing",
  filosofia: "https://drive.google.com/file/d/1ipCiCly4w4RaAnjhnEmhURHgdyPe1g1N/view?usp=sharing",
  neuro: "https://drive.google.com/file/d/1rnVzQDibP61P7OQisqOajDSOT1bqeVCc/view?usp=sharing",
  otro: "https://drive.google.com/file/d/1py_FpfPN6vCGMs6_-A5jiuwaNaxAcQ0M/view?usp=sharing",
}

export const getReglamentoUrl = (nivelEspecializacion) => {
  const nivel = getNivelByLabel(nivelEspecializacion)
  if (nivel?.reglamentoKey) return REGLAMENTOS_POR_KEY[nivel.reglamentoKey]
  return REGLAMENTOS_POR_KEY.otro
}

export const DOCUMENTOS_PARTE2 = [
  {
    id: "actaNacimiento",
    label: "Acta de nacimiento",
    required: true,
    hint: "PDF o imagen, máximo 10 MB",
  },
  {
    id: "comprobanteEstudios",
    label: "Comprobante de último certificado de estudios",
    required: true,
    hint: "PDF o imagen, máximo 10 MB",
  },
  {
    id: "cedulaFiscal",
    label: "Cédula de identificación fiscal",
    required: true,
    hint: "PDF o imagen, máximo 10 MB",
  },
  {
    id: "identificacionOficial",
    label: "Identificación oficial",
    required: true,
    hint: "PDF o imagen, máximo 10 MB",
  },
  {
    id: "comprobanteDomicilio",
    label: "Comprobante de domicilio",
    required: true,
    hint: "PDF o imagen, máximo 10 MB",
  },
  {
    id: "reglamentoFirmado",
    label: "Reglamento firmado (descarga, imprime, firma y escanea)",
    required: true,
    hint: "PDF, máximo 10 MB",
  },
  {
    id: "comprobantePagoTransferencia",
    label: "Comprobante de pago por transferencia (solo si no pagaste en línea)",
    required: false,
    hint: "PDF o imagen. No aplica si pagaste en línea.",
  },
]

export const PORTAL_ALUMNOS_URL =
  process.env.GATSBY_PORTAL_ALUMNOS_URL || "https://alumnos.certificacionmontessori.com"

/** Mapeo programa de pago en línea → nivel sugerido */
export const mapProgramaCheckoutANivel = (programa) => {
  const fromOferta = mapFromOferta(programa)
  if (fromOferta) return fromOferta
  const map = {
    "Nido y Comunidad Infantil": NIVELES_ESPECIALIZACION[0].label,
    "Guía en Nido y Comunidad Infantil": NIVELES_ESPECIALIZACION[0].label,
    "Casa de Niños": NIVELES_ESPECIALIZACION[1].label,
    "Guía en Casa de Niños": NIVELES_ESPECIALIZACION[1].label,
    Taller: NIVELES_ESPECIALIZACION[2].label,
    "Guía en Taller I y II": NIVELES_ESPECIALIZACION[2].label,
    Neuroeducación: NIVELES_ESPECIALIZACION[4].label,
    "Diplomado en Neuroeducación": NIVELES_ESPECIALIZACION[4].label,
    "Grandes Lecciones": NIVELES_ESPECIALIZACION[3].label,
    "Educación Cósmica y Grandes Lecciones": NIVELES_ESPECIALIZACION[3].label,
  }
  return map[programa] || ""
}

export { REGLAMENTOS_POR_KEY }
