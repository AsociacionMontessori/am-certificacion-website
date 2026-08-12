const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {ESCOLARIDAD, getDocumentosParte2} = require("./inscripcionCatalog");

/**
 * Datos administrativos del expediente capturados desde el portal.
 *
 * Son los mismos que pide la parte 2 del formulario público de inscripción.
 * Quien no terminó aquel formulario se quedaba sin ellos y sin manera de
 * aportarlos después: el expediente no podía cerrarse y nadie se lo reclamaba.
 * Aquí puede completarlos el propio alumno, ya autenticado, o administración
 * por él.
 *
 * Se aplican las mismas validaciones que en completeInscripcionParte2 para que
 * un expediente cerrado por esta vía sea indistinguible de uno cerrado por el
 * formulario original.
 */
async function isCallerAdmin(db, uid) {
  const snap = await db.collection("admins").doc(uid).get();
  return snap.exists;
}

exports.guardarDatosExpedienteHandler = onRequest(
    {region: "us-central1", cors: false, invoker: "public"},
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
          key: "guardarDatosExpediente",
          limit: 20,
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

        const body = req.body || {};
        const alumnoId = String(body.alumnoId || "").trim();
        const escolaridad = String(body.escolaridad || "").trim();
        const domicilio = String(body.domicilio || "").trim();
        const curpPasaporte = String(body.curpPasaporte || "").trim().toUpperCase();
        const ocupacion = String(body.ocupacion || "").trim();
        const empresa = String(body.empresa || "").trim();
        const telefonoEmpresa = String(body.telefonoEmpresa || "").trim();

        if (!alumnoId) {
          res.status(400).json({error: "Alumno requerido"});
          return;
        }

        const isOwner = callerUid === alumnoId;
        const isAdmin = isOwner ? false : await isCallerAdmin(db, callerUid);
        if (!isOwner && !isAdmin) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        if (!ESCOLARIDAD.has(escolaridad)) {
          res.status(400).json({error: "Selecciona tu escolaridad"});
          return;
        }
        if (!domicilio || domicilio.length < 5) {
          res.status(400).json({error: "Domicilio particular requerido"});
          return;
        }
        if (!curpPasaporte || curpPasaporte.length < 5) {
          res.status(400).json({error: "CURP o número de pasaporte requerido"});
          return;
        }
        if (!ocupacion) {
          res.status(400).json({error: "Ocupación actual requerida"});
          return;
        }

        const alumnoRef = db.collection("alumnos").doc(alumnoId);
        if (!(await alumnoRef.get()).exists) {
          res.status(404).json({error: "Alumno no encontrado"});
          return;
        }

        const datos = {
          escolaridad,
          domicilio,
          curpPasaporte,
          ocupacion,
          empresa: empresa || null,
          telefonoEmpresa: telefonoEmpresa || null,
        };

        // El expediente solo se da por completo cuando además están todos los
        // documentos obligatorios. Se comprueba contra Storage, que es la
        // fuente real: el mapa en Firestore puede venir vacío en expedientes
        // que quedaron a medias.
        const inscSnap = await db.collection("inscripciones")
            .where("alumnoId", "==", alumnoId)
            .limit(1)
            .get();
        const inscripcion = inscSnap.empty ? null : inscSnap.docs[0];
        const ordenId = inscripcion ? inscripcion.data().ordenId : null;

        let requiereFactura = false;
        if (ordenId) {
          const orden = await db.collection("ordenes").doc(ordenId).get();
          requiereFactura = Boolean(orden.exists && orden.data().requiereFacturaFiscal);
        }
        const {requeridos} = getDocumentosParte2(requiereFactura);

        const [files] = await admin.storage().bucket()
            .getFiles({prefix: `expediente/${alumnoId}/`});
        const entregados = new Set(
            files
                .filter((f) => !f.name.endsWith("/") && !f.name.includes("/historial/"))
                .map((f) => f.name.split("/")[2])
                .filter(Boolean),
        );
        const faltantes = [...requeridos].filter((t) => !entregados.has(t));
        const completo = faltantes.length === 0;

        await alumnoRef.set({...datos, expedienteCompleto: completo}, {merge: true});

        if (inscripcion) {
          await inscripcion.ref.set({
            ...datos,
            parte2Completa: completo,
            expedienteCompleto: completo,
            ...(completo ? {
              parte2CompletadaAt: admin.firestore.FieldValue.serverTimestamp(),
              estadoInscripcion: "Expediente completo",
            } : {}),
          }, {merge: true});
        }
        if (ordenId && completo) {
          await db.collection("ordenes").doc(ordenId)
              .set({expedienteCompleto: true}, {merge: true});
        }

        console.log("guardarDatosExpediente:guardado", {
          alumnoId,
          callerUid,
          comoAlumno: isOwner,
          comoAdmin: isAdmin,
          expedienteCompleto: completo,
          faltantes,
        });

        res.json({ok: true, expedienteCompleto: completo, faltantes});
      } catch (err) {
        console.error("guardarDatosExpediente:", err);
        if (err.code === "auth/id-token-expired" || err.code === "auth/argument-error") {
          res.status(401).json({error: "Sesión inválida o expirada"});
          return;
        }
        res.status(500).json({error: "No se pudieron guardar los datos"});
      }
    },
);
