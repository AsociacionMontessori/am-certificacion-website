/* eslint-env node */
/**
 * Script de migración F-03 — Backfill de credenciales cifradas.
 *
 * Lee `alumnos/{uid}` y, si tiene `passwordTemporal` o `passwordClassroom`
 * en texto plano, escribe los valores cifrados con AES-256-GCM en
 * `alumnoCredenciales/{uid}`. NO toca los campos plaintext: este script
 * solo agrega la fuente cifrada. El cleanup de plaintext es un paso
 * posterior (script aparte), una vez verificado que el frontend ya lee
 * de la nueva colección.
 *
 * Idempotente: si `alumnoCredenciales/{uid}` ya existe, salta el alumno
 * salvo que se pase `--force`.
 *
 * Uso:
 *   # 1) Tener un service account JSON local o ADC configurado.
 *   #    export GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/sa.json
 *
 *   # 2) Exportar la misma clave que está en Firebase Secrets como
 *   #    CREDENTIALS_ENCRYPTION_KEY. La clave es 32 bytes en base64 o
 *   #    64 chars hex.
 *   export CREDENTIALS_ENCRYPTION_KEY="$(firebase functions:secrets:access CREDENTIALS_ENCRYPTION_KEY)"
 *
 *   # 3) Dry-run primero
 *   node alumnos-app/scripts/migrar-credenciales.js --dry-run
 *
 *   # 4) Apply
 *   node alumnos-app/scripts/migrar-credenciales.js
 *
 *   # Forzar re-escritura de credenciales ya migradas
 *   node alumnos-app/scripts/migrar-credenciales.js --force
 */

const admin = require("firebase-admin");
const crypto = require("crypto");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run") || args.has("-n");
const FORCE = args.has("--force") || args.has("-f");
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "certificacionmontessori";
const BATCH_SIZE = 200;

function loadKey() {
  const raw = String(process.env.CREDENTIALS_ENCRYPTION_KEY || "").trim();
  if (!raw) {
    console.error("ERROR: define CREDENTIALS_ENCRYPTION_KEY en el entorno antes de correr.");
    console.error("       firebase functions:secrets:access CREDENTIALS_ENCRYPTION_KEY");
    process.exit(2);
  }
  if (/^[A-Fa-f0-9]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    console.error(`ERROR: CREDENTIALS_ENCRYPTION_KEY no es 32 bytes (recibí ${buf.length})`);
    process.exit(2);
  }
  return buf;
}

function encryptPassword(key, plain) {
  if (plain === undefined || plain === null || plain === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

async function main() {
  const key = loadKey();

  if (!admin.apps.length) {
    admin.initializeApp({projectId: PROJECT_ID});
  }
  const db = admin.firestore();

  console.log(`Proyecto: ${PROJECT_ID}`);
  console.log(`Modo: ${DRY_RUN ? "DRY-RUN" : "APPLY"}`);
  console.log(`Force: ${FORCE ? "sí (re-cifra alumnos ya migrados)" : "no (salta los ya migrados)"}`);
  console.log("");

  let cursor = null;
  let totalProcesados = 0;
  let totalNuevos = 0;
  let totalActualizados = 0;
  let totalSaltados = 0;
  let totalSinPassword = 0;
  let errores = 0;

  while (true) {
    let q = db.collection("alumnos").orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH_SIZE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      totalProcesados += 1;
      const data = doc.data() || {};
      const uid = doc.id;
      const passwordPlain = data.passwordTemporal || null;
      const passwordClassroomPlain = data.passwordClassroom || null;

      if (!passwordPlain && !passwordClassroomPlain) {
        totalSinPassword += 1;
        continue;
      }

      const credRef = db.collection("alumnoCredenciales").doc(uid);
      const existing = await credRef.get();
      if (existing.exists && !FORCE) {
        totalSaltados += 1;
        continue;
      }

      let passwordEnc = null;
      let passwordClassroomEnc = null;
      try {
        passwordEnc = encryptPassword(key, passwordPlain);
        passwordClassroomEnc = encryptPassword(key, passwordClassroomPlain);
      } catch (encErr) {
        console.error(`  ✗ ${uid}: error al cifrar: ${encErr.message}`);
        errores += 1;
        continue;
      }

      if (DRY_RUN) {
        if (existing.exists) {
          totalActualizados += 1;
          console.log(`  [dry] ${uid} actualizaría (force)`);
        } else {
          totalNuevos += 1;
          console.log(`  [dry] ${uid} crearía`);
        }
        continue;
      }

      try {
        await credRef.set({
          passwordEnc,
          passwordClassroomEnc,
          version: 1,
          createdAt: existing.exists ? (existing.data().createdAt || admin.firestore.FieldValue.serverTimestamp()) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          rotatedAt: existing.exists ? admin.firestore.FieldValue.serverTimestamp() : null,
          origen: existing.exists ? "migracion_force" : "migracion_inicial",
        }, {merge: true});
        if (existing.exists) {
          totalActualizados += 1;
          console.log(`  ↻ ${uid} actualizado`);
        } else {
          totalNuevos += 1;
          console.log(`  + ${uid} creado`);
        }
      } catch (writeErr) {
        console.error(`  ✗ ${uid}: error al guardar: ${writeErr.message}`);
        errores += 1;
      }
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < BATCH_SIZE) break;
  }

  console.log("");
  console.log("Resumen:");
  console.log(`  Alumnos procesados:           ${totalProcesados}`);
  console.log(`  Sin password (sin migrar):    ${totalSinPassword}`);
  console.log(`  Ya migrados (saltados):       ${totalSaltados}`);
  console.log(`  Nuevos cifrados${DRY_RUN ? " (dry)" : "             "}:        ${totalNuevos}`);
  console.log(`  Actualizados${DRY_RUN ? " (dry)" : "             "}:           ${totalActualizados}`);
  console.log(`  Errores:                      ${errores}`);
  console.log("");
  if (errores > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fallo total:", err);
  process.exit(1);
});
