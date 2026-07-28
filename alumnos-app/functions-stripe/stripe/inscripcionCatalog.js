/** Catálogo server-side — mantener alineado con src/data/inscripcionForm.js */

const DOMINIO_INSTITUCIONAL = "certificacionmontessori.com";

const MODALIDAD_INSCRIPCION = "En línea";

const NIVELES_LABELS = [
  "Guía en Nido & Comunidad Infantil (Duración 16 meses)",
  "Guía en Casa de Niños (con duración 17 meses)",
  "Guía en Taller I y II (con duración 20 meses)",
  "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)",
  "Diplomado en Neuroeducación (3 meses)",
  "Curso de Filosofía Montessori y Psicología Educativa (3 meses)",
  "Otro",
];

const NIVELES_ESPECIALIZACION = new Set(NIVELES_LABELS);

const ESCOLARIDAD = new Set([
  "Secundaria",
  "Preparatoria / Bachillerato",
  "Licenciatura",
  "Maestría",
  "Doctorado",
  "Otro",
]);

const REGLAMENTOS_DRIVE = {
  "Guía en Nido & Comunidad Infantil (Duración 16 meses)":
    "https://drive.google.com/file/d/1Q6h7tWY2O_kbUlqWR0rMm8PogndDTvee/view?usp=drive_link",
  "Guía en Casa de Niños (con duración 17 meses)":
    "https://drive.google.com/file/d/1Aqsu9rH4W2KP2p0YdPyK2AHRQvJWWlPx/view?usp=sharing",
  "Guía en Taller I y II (con duración 20 meses)":
    "https://drive.google.com/file/d/1Nd9mAau5M0m1ijn_bgvUVHJ39aIKDnri/view?usp=sharing",
  "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)":
    "https://drive.google.com/file/d/141yAty6l1AuMfg2jZVsHum7nUj8msTOL/view?usp=sharing",
  "Curso de Filosofía Montessori y Psicología Educativa (3 meses)":
    "https://drive.google.com/file/d/1ipCiCly4w4RaAnjhnEmhURHgdyPe1g1N/view?usp=sharing",
  "Diplomado en Neuroeducación (3 meses)":
    "https://drive.google.com/file/d/1rnVzQDibP61P7OQisqOajDSOT1bqeVCc/view?usp=sharing",
  Otro: "https://drive.google.com/file/d/1py_FpfPN6vCGMs6_-A5jiuwaNaxAcQ0M/view?usp=sharing",
};

const NIVEL_PORTAL_MAP = {
  "Guía en Nido & Comunidad Infantil (Duración 16 meses)": "Nido & Comunidad infantil",
  "Guía en Casa de Niños (con duración 17 meses)": "Casa de Niños",
  "Guía en Taller I y II (con duración 20 meses)": "Taller",
  "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)": "Taller",
  "Curso de Filosofía Montessori y Psicología Educativa (3 meses)": "Propedéutico",
  "Diplomado en Neuroeducación (3 meses)": "Diplomado en Neuroeducación",
  Otro: "Propedéutico",
};

/** Labels de checkout Stripe → nivel de formulario (alineado con programasOferta.js). */
const PROGRAMA_CHECKOUT_A_NIVEL = {
  "Guía en Nido y Comunidad Infantil": "Guía en Nido & Comunidad Infantil (Duración 16 meses)",
  "Guía en Casa de Niños": "Guía en Casa de Niños (con duración 17 meses)",
  "Guía en Taller I y II": "Guía en Taller I y II (con duración 20 meses)",
  "Educación Cósmica y Grandes Lecciones":
    "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)",
  "Diplomado en Neuroeducación": "Diplomado en Neuroeducación (3 meses)",
  "Inscripción (primer programa)": "Otro",
};

function getNivelFromProgramaCheckout(programaLabel) {
  const key = String(programaLabel || "").trim();
  return PROGRAMA_CHECKOUT_A_NIVEL[key] || null;
}

const TIPO_PROGRAMA_MAP = {
  "Guía en Nido & Comunidad Infantil (Duración 16 meses)": "guia",
  "Guía en Casa de Niños (con duración 17 meses)": "guia",
  "Guía en Taller I y II (con duración 20 meses)": "guia",
  "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)": "diplomado",
  "Diplomado en Neuroeducación (3 meses)": "diplomado",
  "Curso de Filosofía Montessori y Psicología Educativa (3 meses)": "curso",
  Otro: "otro",
};

const DOCUMENTOS_PARTE2_REQUERIDOS = new Set([
  "actaNacimiento",
  "comprobanteEstudios",
  "identificacionOficial",
  "comprobanteDomicilio",
  "reglamentoFirmado",
]);

const DOCUMENTOS_PARTE2_OPCIONALES = new Set([
  "comprobantePagoTransferencia",
  "cedulaFiscal",
]);

const DOCUMENTOS_PARTE2 = new Set([
  ...DOCUMENTOS_PARTE2_REQUERIDOS,
  ...DOCUMENTOS_PARTE2_OPCIONALES,
]);

/**
 * La constancia de situación fiscal solo se exige a quien pidió factura en el
 * checkout; el formulario público únicamente muestra ese campo cuando
 * `requiereFacturaFiscal` viene en la orden.
 */
function getDocumentosParte2(requiereFacturaFiscal) {
  const requeridos = new Set(DOCUMENTOS_PARTE2_REQUERIDOS);
  const opcionales = new Set(DOCUMENTOS_PARTE2_OPCIONALES);
  if (requiereFacturaFiscal) {
    requeridos.add("cedulaFiscal");
    opcionales.delete("cedulaFiscal");
  }
  return {requeridos, opcionales};
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp)|application\/pdf$/;

function getReglamentoUrl(nivel) {
  return REGLAMENTOS_DRIVE[nivel] || REGLAMENTOS_DRIVE.Otro;
}

function getNivelPortal(nivelEspecializacion) {
  return NIVEL_PORTAL_MAP[nivelEspecializacion] || "Propedéutico";
}

function getTipoPrograma(nivelEspecializacion) {
  return TIPO_PROGRAMA_MAP[nivelEspecializacion] || "otro";
}

function buildEmailInstitucional(usuarioLocal) {
  return `${String(usuarioLocal || "").trim().toLowerCase()}@${DOMINIO_INSTITUCIONAL}`;
}

function isUsuarioLocalValid(usuarioLocal) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(String(usuarioLocal || "").trim().toLowerCase());
}

// Duración del programa en meses por nivel — para calcular la fecha estimada
// de egreso (fechaIngreso + meses).
const DURACION_MESES_POR_NIVEL = {
  "Guía en Nido & Comunidad Infantil (Duración 16 meses)": 16,
  "Guía en Casa de Niños (con duración 17 meses)": 17,
  "Guía en Taller I y II (con duración 20 meses)": 20,
  "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)": 5,
  "Diplomado en Neuroeducación (3 meses)": 3,
  "Curso de Filosofía Montessori y Psicología Educativa (3 meses)": 3,
};

function getDuracionMeses(nivelEspecializacion) {
  return DURACION_MESES_POR_NIVEL[String(nivelEspecializacion || "").trim()] || null;
}

module.exports = {
  DOMINIO_INSTITUCIONAL,
  MODALIDAD_INSCRIPCION,
  NIVELES_ESPECIALIZACION,
  ESCOLARIDAD,
  DOCUMENTOS_PARTE2,
  DOCUMENTOS_PARTE2_REQUERIDOS,
  DOCUMENTOS_PARTE2_OPCIONALES,
  getDocumentosParte2,
  MAX_FILE_BYTES,
  ALLOWED_MIME,
  getReglamentoUrl,
  getNivelPortal,
  getTipoPrograma,
  getNivelFromProgramaCheckout,
  buildEmailInstitucional,
  isUsuarioLocalValid,
  DURACION_MESES_POR_NIVEL,
  getDuracionMeses,
};
