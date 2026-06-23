// Allowlist por entorno. Cuando STRIPE_FUNCTIONS_ENV === "production",
// solo se permiten orígenes de producción (Live). En cualquier otro caso
// (test, preview, local) se incluyen también los orígenes de desarrollo.
// Esto evita que un atacante use un wrapper local para llamar a las
// Functions de Live desde un origen permitido.
const PROD_ORIGINS = [
  "https://certificacionmontessori.com",
  "https://www.certificacionmontessori.com",
  "https://certificacionmontessori.web.app",
  "https://certificacionmontessori.firebaseapp.com",
  "https://alumnos.certificacionmontessori.com",
  "https://alumnos-certificacionmontessori.web.app",
  "https://alumnos-certificacionmontessori.firebaseapp.com",
];

const TEST_ORIGINS = [
  "https://certificacionmontessori--stripe-test-sl45bkl4.web.app",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const IS_PRODUCTION = String(process.env.STRIPE_FUNCTIONS_ENV || "").toLowerCase() === "production";

const ALLOWED_ORIGINS = new Set(
    IS_PRODUCTION ? PROD_ORIGINS : [...PROD_ORIGINS, ...TEST_ORIGINS],
);

/**
 * @param {import('firebase-functions/v2/https').Request} req
 * @param {import('firebase-functions/v2/https').Response} res
 * @return {boolean} true si la petición fue OPTIONS y ya se respondió
 */
function handleCors(req, res) {
  const origin = req.get("Origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Expose-Headers", "Content-Disposition");
  res.set("Access-Control-Max-Age", "3600");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

/**
 * @param {import('firebase-functions/v2/https').Request} req
 * @param {import('firebase-functions/v2/https').Response} res
 */
function rejectIfOriginNotAllowed(req, res) {
  const origin = req.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({error: "Origen no permitido"});
    return true;
  }
  return false;
}

module.exports = {handleCors, rejectIfOriginNotAllowed, ALLOWED_ORIGINS};
