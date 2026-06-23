const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {
  MODALIDAD_INSCRIPCION,
  NIVELES_ESPECIALIZACION,
  buildEmailInstitucional,
  isUsuarioLocalValid,
  getNivelPortal,
  getReglamentoUrl,
  getTipoPrograma,
  getNivelFromProgramaCheckout,
} = require("./inscripcionCatalog");
const {crearAlumnoDesdeInscripcion} = require("./inscripcionAlumno");
const {notifyAlumnoCuentaCreada} = require("./notifications");
const {isOrdenFlujoInscripcion} = require("./programasCheckout");
const {resolvePasswordInscripcion} = require("./inscripcionPassword");
const {provisionGoogleWorkspaceAlumno} = require("./googleWorkspaceProvision");
const {GOOGLE_SERVICE_ACCOUNT_JSON} = require("./googleWorkspaceClient");
const {escapeHtml} = require("./escape");
const {credentialsEncryptionKey} = require("./credenciales");
const {requireAccessToken} = require("./accessToken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDateField(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

async function getInscripcionByOrden(db, ordenId) {
  const snap = await db.collection("inscripciones").where("ordenId", "==", ordenId).limit(1).get();
  if (snap.empty) return {ref: null, data: null, id: null};
  return {ref: snap.docs[0].ref, data: snap.docs[0].data(), id: snap.docs[0].id};
}

/**
 * Parte 1: datos básicos + creación de cuenta institucional del alumno.
 */
exports.completeInscripcionParte1Handler = onRequest(
    {
      region: "us-central1",
      cors: false,
      invoker: "public",
      secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, credentialsEncryptionKey],
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
          key: "completeInscripcionParte1",
          limit: 12,
          windowSeconds: 600,
        })) return;

        const body = req.body || {};
        const ordenId = String(body.ordenId || "").trim();
        const accessToken = String(body.accessToken || body.t || "").trim();
        const nombre = String(body.nombreCompleto || "").trim();
        const emailContacto = String(body.emailContacto || body.email || "").trim().toLowerCase();
        const telefono = String(body.telefonoMovil || body.telefono || "").trim();
        const modalidad = MODALIDAD_INSCRIPCION;
        const nivelEspecializacion = String(body.nivelEspecializacion || body.nivel || "").trim();
        const nacionalidad = String(body.nacionalidad || "").trim();
        const usuarioLocal = String(body.usuarioInstitucional || "").trim().toLowerCase();

        if (!ordenId) {
          res.status(400).json({error: "Referencia de orden requerida"});
          return;
        }
        if (!nombre || nombre.length < 2) {
          res.status(400).json({error: "Nombre completo requerido"});
          return;
        }
        if (!EMAIL_REGEX.test(emailContacto)) {
          res.status(400).json({error: "Correo de contacto no válido"});
          return;
        }
        if (!telefono || telefono.length < 8) {
          res.status(400).json({error: "Teléfono móvil requerido"});
          return;
        }
        if (!nacionalidad || nacionalidad.length < 2) {
          res.status(400).json({error: "Nacionalidad requerida"});
          return;
        }
        if (!isUsuarioLocalValid(usuarioLocal)) {
          res.status(400).json({
            error: "Usuario institucional inválido (3–32 caracteres: letras, números, . _ -)",
          });
          return;
        }
        const fechaNacimiento = parseDateField(body.fechaNacimiento);
        if (!fechaNacimiento) {
          res.status(400).json({error: "Fecha de nacimiento requerida"});
          return;
        }

        const ordenRef = db.collection("ordenes").doc(ordenId);
        const ordenSnap = await ordenRef.get();
        if (!ordenSnap.exists) {
          res.status(404).json({error: "Orden no encontrada"});
          return;
        }
        const orden = ordenSnap.data();

        // F-02: validar accessToken (con backward-compat para órdenes legacy).
        if (!requireAccessToken(orden, accessToken, res)) return;

        // F-05: detectar (sin bloquear) emailContacto distinto al email que
        // el comprador usó en Stripe. Si ya tenemos accessToken, el riesgo
        // de impersonación es bajo; el log permite auditoría a posteriori.
        const ordenClienteEmail = String(orden.cliente?.email || "").trim().toLowerCase();
        if (ordenClienteEmail && emailContacto && ordenClienteEmail !== emailContacto) {
          console.warn("completeInscripcionParte1:email_distinto_al_de_pago", {
            ordenId,
            stripeEmail: ordenClienteEmail,
            emailContacto,
          });
        }

        const {password, passwordClassroom, generada: passwordGenerada} =
          resolvePasswordInscripcion();

        if (!isOrdenFlujoInscripcion(orden.tipo)) {
          res.status(400).json({error: "Esta referencia no corresponde a una inscripción"});
          return;
        }
        if (orden.estado !== "pagado") {
          res.status(402).json({error: "El pago de inscripción aún no está confirmado"});
          return;
        }

        const ordenProgramaLabel = String(orden.programa || "").trim();
        const nivelEsperadoOrden = getNivelFromProgramaCheckout(ordenProgramaLabel);
        if (nivelEsperadoOrden) {
          if (!nivelEspecializacion) {
            res.status(400).json({error: "Nivel de especialización requerido"});
            return;
          }
          if (nivelEspecializacion !== nivelEsperadoOrden) {
            res.status(400).json({
              error: "El programa pagado no coincide con el nivel indicado. Contacta a soporte.",
            });
            return;
          }
        } else if (!NIVELES_ESPECIALIZACION.has(nivelEspecializacion)) {
          res.status(400).json({error: "Nivel de especialización no válido"});
          return;
        }

        const existing = await getInscripcionByOrden(db, ordenId);
        if (existing.data?.parte1Completa && existing.data?.alumnoId) {
          res.json({
            ok: true,
            alreadyCompleted: true,
            inscripcionId: existing.id,
            alumnoId: existing.data.alumnoId,
            emailInstitucional: existing.data.emailInstitucional,
            portalUrl: "https://alumnos.certificacionmontessori.com",
          });
          return;
        }

        const emailInstitucional = buildEmailInstitucional(usuarioLocal);
        try {
          await admin.auth().getUserByEmail(emailInstitucional);
          res.status(409).json({error: "Ese usuario institucional ya está registrado. Elige otro."});
          return;
        } catch (authErr) {
          if (authErr.code !== "auth/user-not-found") throw authErr;
        }

        const nivelPortal = getNivelPortal(nivelEspecializacion);
        const {uid} = await crearAlumnoDesdeInscripcion(db, {
          emailInstitucional,
          password,
          nombre,
          emailContacto,
          telefono,
          nivelPortal,
          modalidad,
          nivelEspecializacion,
          nacionalidad,
          fechaNacimiento,
          usuarioInstitucional: usuarioLocal,
          passwordClassroom,
          passwordTemporal: password,
        });

        const inscripcionPayload = {
          nombre,
          email: emailContacto,
          emailContacto,
          telefono,
          telefonoMovil: telefono,
          modalidad,
          nivel: nivelPortal,
          nivelEspecializacion,
          tipoPrograma: getTipoPrograma(nivelEspecializacion),
          nacionalidad,
          fechaNacimiento,
          usuarioInstitucional: usuarioLocal,
          emailInstitucional,
          alumnoId: uid,
          metodoPago: "stripe",
          ordenId,
          origen: "sitio_publico_stripe",
          estadoInscripcion: "Cuenta creada",
          parte1Completa: true,
          parte1CompletadaAt: admin.firestore.FieldValue.serverTimestamp(),
          reglamentoUrl: getReglamentoUrl(nivelEspecializacion),
          stripeCheckoutSessionId: orden.stripeCheckoutSessionId || null,
        };

        let inscripcionId = existing.id;
        if (existing.ref) {
          await existing.ref.set(inscripcionPayload, {merge: true});
        } else {
          const ref = await db.collection("inscripciones").add({
            ...inscripcionPayload,
            fechaInscripcion: admin.firestore.FieldValue.serverTimestamp(),
            parte2Completa: false,
            expedienteCompleto: false,
          });
          inscripcionId = ref.id;
        }

        await ordenRef.set({inscripcionId, alumnoId: uid, parte1Completa: true}, {merge: true});

        let googleWorkspace = {
          status: "skipped",
          reason: "No ejecutado",
        };
        const warnings = [];

        try {
          googleWorkspace = await provisionGoogleWorkspaceAlumno({
            emailInstitucional,
            nombreCompleto: nombre,
            password,
            nivelPortal,
            emailContacto,
          });
        } catch (googleErr) {
          console.error("completeInscripcionParte1:googleWorkspace", googleErr);
          googleWorkspace = {
            status: "error",
            errors: [{step: "workspace", message: googleErr.message || String(googleErr)}],
          };
          warnings.push("No se pudo completar Google Workspace/Classroom automáticamente");
        }

        try {
          await db.collection("alumnos").doc(uid).set({
            inscripcionId,
            ordenId,
            googleWorkspace,
            googleWorkspaceAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        } catch (alumnoUpdateErr) {
          console.error("completeInscripcionParte1:updateAlumno", alumnoUpdateErr);
          warnings.push("No se pudo guardar el estado de Google en el expediente");
        }

        if (googleWorkspace.status === "partial" || googleWorkspace.status === "error") {
          try {
            await db.collection("emails_pendientes").add({
              to: "admin@certificacionmontessori.com",
              subject: `[Inscripción] Revisar alta Google — ${emailInstitucional}`,
              html: `<p>La cuenta Firebase se creó, pero Google Workspace/Classroom requiere revisión.</p>
                <p><strong>Alumno:</strong> ${escapeHtml(nombre)} (${escapeHtml(emailInstitucional)})</p>
                <p><strong>Nivel:</strong> ${escapeHtml(nivelEspecializacion)}</p>
                <pre>${escapeHtml(JSON.stringify(googleWorkspace, null, 2))}</pre>`,
              text: `Revisar Google Workspace para ${emailInstitucional}: ${JSON.stringify(googleWorkspace)}`,
              tipo: "google_provision_alerta",
              ordenId,
              alumnoId: uid,
            });
          } catch (emailPendienteErr) {
            console.error("completeInscripcionParte1:googleAlert", emailPendienteErr);
            warnings.push("No se pudo notificar al equipo sobre la incidencia de Google Workspace");
          }
        }

        try {
          await notifyAlumnoCuentaCreada(db, {
            nombre,
            emailContacto,
            emailInstitucional,
            portalUrl: "https://alumnos.certificacionmontessori.com",
            nivelEspecializacion,
            passwordGenerada,
            passwordAcceso: passwordGenerada ? password : null,
          });
        } catch (notifyErr) {
          console.error("completeInscripcionParte1:notify", notifyErr);
          warnings.push("No se pudo enviar el correo automático de bienvenida");
        }

        res.json({
          ok: true,
          inscripcionId,
          alumnoId: uid,
          emailInstitucional,
          portalUrl: "https://alumnos.certificacionmontessori.com",
          reglamentoUrl: getReglamentoUrl(nivelEspecializacion),
          googleWorkspace,
          warnings,
        });
      } catch (err) {
        console.error("completeInscripcionParte1:", err);
        if (err.code === "auth/email-already-exists") {
          res.status(409).json({error: "El correo institucional ya está en uso"});
          return;
        }
        res.status(500).json({error: "Error al crear la cuenta de inscripción"});
      }
    },
);
