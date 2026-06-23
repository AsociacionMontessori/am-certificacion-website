/**
 * Cifrado at-rest de credenciales de alumno (Fase 1 / F-03).
 *
 * Diseño completo: docs/PASSWORD_HARDENING_DESIGN.md
 *
 * Objetivo: las contraseñas (`passwordTemporal`, `passwordClassroom`) dejan
 * de quedar en texto plano en `alumnos/{uid}` y pasan a una colección
 * separada `alumnoCredenciales/{uid}` cifradas con AES-256-GCM. La clave
 * vive en Firebase Secrets como `CREDENTIALS_ENCRYPTION_KEY` y nunca se
 * guarda en Firestore.
 *
 * Periodo de coexistencia: mientras dura la migración, el código de creación
 * de alumno escribe en AMBAS colecciones (plaintext en `alumnos` para que el
 * frontend actual siga funcionando + cifrado en `alumnoCredenciales`). Una
 * vez validado que el frontend lee de la nueva fuente, se elimina el plaintext.
 */
const crypto = require("crypto");
const {defineSecret} = require("firebase-functions/params");

const credentialsEncryptionKey = defineSecret("CREDENTIALS_ENCRYPTION_KEY");

/**
 * Carga la clave maestra desde Secrets. Acepta base64 (44 chars) o hex
 * (64 chars). Cualquier otro formato lanza para que el deploy falle ruidoso.
 * @return {Buffer}
 */
function getKey() {
  const raw = String(credentialsEncryptionKey.value() || "").trim();
  if (!raw) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY no está configurada");
  }
  if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes (base64 o hex de 64)");
  }
  return key;
}

/**
 * Devuelve `iv|ciphertext|authTag` en base64. Si `plain` es vacío, devuelve null.
 * @param {string} plain
 * @return {string|null}
 */
function encryptPassword(plain) {
  if (plain === undefined || plain === null || plain === "") return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

/**
 * Descifra un valor producido por `encryptPassword`.
 * @param {string|null|undefined} stored
 * @return {string|null}
 */
function decryptPassword(stored) {
  if (!stored) return null;
  const buf = Buffer.from(String(stored), "base64");
  if (buf.length < 12 + 16 + 1) {
    throw new Error("Cipher inválido: payload demasiado corto");
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);
  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return out.toString("utf8");
}

/**
 * Versión del esquema. Permite rotar la clave/algoritmo en el futuro.
 */
const CREDENTIALS_SCHEMA_VERSION = 1;

module.exports = {
  credentialsEncryptionKey,
  encryptPassword,
  decryptPassword,
  CREDENTIALS_SCHEMA_VERSION,
};
