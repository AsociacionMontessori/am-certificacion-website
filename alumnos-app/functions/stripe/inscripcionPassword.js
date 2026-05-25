const crypto = require("crypto");
const {defineString} = require("firebase-functions/params");

/** Contraseña única portal + Classroom (configurar en Firebase / .env). */
const INSCRIPCION_PASSWORD_UNIFICADA = defineString("INSCRIPCION_PASSWORD_UNIFICADA", {
  default: "",
});

/**
 * Contraseña institucional: prioridad secret unificado; si no hay, genera una temporal.
 * @param {string} [bodyPassword] — ignorado en flujo público (ya no la envía el alumno).
 * @return {{ password: string, passwordClassroom: string, generada: boolean }}
 */
function resolvePasswordInscripcion(bodyPassword) {
  const unified = String(INSCRIPCION_PASSWORD_UNIFICADA.value() || "").trim();
  if (unified.length >= 8) {
    return {password: unified, passwordClassroom: unified, generada: false};
  }
  const generated = crypto.randomBytes(9).toString("base64url").slice(0, 12);
  return {password: generated, passwordClassroom: generated, generada: true};
}

module.exports = {resolvePasswordInscripcion, INSCRIPCION_PASSWORD_UNIFICADA};
