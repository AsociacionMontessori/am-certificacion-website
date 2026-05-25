const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {credentialsEncryptionKey, decryptPassword} = require("./credenciales");

/**
 * F-03 — Lectura de credenciales del alumno desde la colección cifrada
 * `alumnoCredenciales/{alumnoId}`.
 *
 * - Requiere ID token Firebase (Bearer).
 * - El propio alumno puede leer sus credenciales.
 * - Un admin o directivo puede leer credenciales de cualquier alumno.
 * - Catedráticos y grupos NO pueden leer credenciales (no las necesitan).
 *
 * Si el documento cifrado aún no existe (alumno antiguo todavía no migrado),
 * devolvemos `notMigrated: true` para que el frontend, en periodo de
 * coexistencia, sepa caer al campo plaintext en `alumnos/{uid}` como
 * fallback temporal.
 */
async function isCallerAdminOrDirectivo(db, uid) {
  const [adminSnap, directivoSnap] = await Promise.all([
    db.collection("admins").doc(uid).get(),
    db.collection("directivos").doc(uid).get(),
  ]);
  return adminSnap.exists || directivoSnap.exists;
}

exports.getCredencialesAlumnoHandler = onRequest(
    {
      region: "us-central1",
      cors: false,
      invoker: "public",
      secrets: [credentialsEncryptionKey],
    },
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;

      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }

      try {
        const db = admin.firestore();
        if (await enforceRateLimit(db, req, res, {
          key: "getCredencialesAlumno",
          limit: 30,
          windowSeconds: 600,
        })) return;

        const authHeader = req.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          res.status(401).json({error: "No autenticado"});
          return;
        }

        const decoded = await admin.auth().verifyIdToken(token);
        const callerUid = decoded.uid;
        const requestedId = String(req.body?.alumnoId || callerUid).trim();

        const isOwner = callerUid === requestedId;
        let isPrivileged = false;
        if (!isOwner) {
          isPrivileged = await isCallerAdminOrDirectivo(db, callerUid);
        }

        if (!isOwner && !isPrivileged) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        const credSnap = await db.collection("alumnoCredenciales").doc(requestedId).get();
        if (!credSnap.exists) {
          res.json({
            ok: true,
            alumnoId: requestedId,
            notMigrated: true,
            password: null,
            passwordClassroom: null,
          });
          return;
        }

        const cred = credSnap.data() || {};
        let password = null;
        let passwordClassroom = null;
        try {
          password = decryptPassword(cred.passwordEnc);
          passwordClassroom = decryptPassword(cred.passwordClassroomEnc);
        } catch (decErr) {
          console.error("getCredencialesAlumno: descifrado falló", {
            requestedId,
            callerUid,
            error: decErr.message,
          });
          res.status(500).json({error: "No se pudo descifrar la credencial. Contacta a administración."});
          return;
        }

        // Log auditable mínimo en consola — Cloud Logging lo conserva.
        console.log("getCredencialesAlumno:lectura", {
          requestedId,
          callerUid,
          asOwner: isOwner,
          asPrivileged: isPrivileged,
        });

        res.json({
          ok: true,
          alumnoId: requestedId,
          notMigrated: false,
          password,
          passwordClassroom,
          rotatedAt: cred.rotatedAt || null,
          version: cred.version || null,
        });
      } catch (err) {
        console.error("getCredencialesAlumno:", err);
        if (err.code === "auth/id-token-expired" || err.code === "auth/argument-error") {
          res.status(401).json({error: "Sesión inválida o expirada"});
          return;
        }
        res.status(500).json({error: "Error al obtener credenciales"});
      }
    },
);
