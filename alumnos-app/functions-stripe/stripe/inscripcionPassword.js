const crypto = require("crypto");

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
// Solo letras y números: nada de = * u otros signos que rompen al pegar en
// Excel/WhatsApp o al dictar la contraseña.
const ALL = LOWER + UPPER + DIGITS;

/**
 * Contraseña única por alumno (misma en Firebase Auth y Google Directory).
 * 16 caracteres alfanuméricos, con al menos una minúscula, mayúscula y dígito.
 */
function generatePasswordInscripcion(length = 16) {
  const minLen = Math.max(12, length);
  const pick = (charset) => charset[crypto.randomInt(0, charset.length)];

  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < minLen) {
    chars.push(pick(ALL));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join("");
}

/**
 * @return {{ password: string, passwordClassroom: string, generada: boolean }}
 */
function resolvePasswordInscripcion() {
  const password = generatePasswordInscripcion(16);
  return {
    password,
    passwordClassroom: password,
    generada: true,
  };
}

module.exports = {generatePasswordInscripcion, resolvePasswordInscripcion};
