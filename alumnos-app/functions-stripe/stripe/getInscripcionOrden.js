const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {getReglamentoUrl} = require("./inscripcionCatalog");
const {isOrdenFlujoInscripcion} = require("./programasCheckout");

/**
 * Consulta estado de una orden de inscripción (público, sin datos sensibles).
 */
exports.getInscripcionOrdenHandler = onRequest(
    {
      region: "us-central1",
      cors: false,
      invoker: "public",
    },
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;

      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }

      try {
        const ordenId = String(req.body?.ordenId || "").trim();
        if (!ordenId) {
          res.status(400).json({error: "Referencia de orden requerida"});
          return;
        }

        const db = admin.firestore();
        const ordenSnap = await db.collection("ordenes").doc(ordenId).get();
        if (!ordenSnap.exists) {
          res.status(404).json({error: "Orden no encontrada"});
          return;
        }

        const orden = ordenSnap.data();
        if (!isOrdenFlujoInscripcion(orden.tipo)) {
          res.status(400).json({error: "Esta referencia no corresponde a una inscripción"});
          return;
        }

        const inscripcionesSnap = await db.collection("inscripciones")
            .where("ordenId", "==", ordenId)
            .limit(1)
            .get();

        const inscripcion = inscripcionesSnap.empty ? null : inscripcionesSnap.docs[0].data();
        const inscripcionId = inscripcionesSnap.empty ? null : inscripcionesSnap.docs[0].id;
        const pagado = orden.estado === "pagado";
        const parte1Completa = Boolean(inscripcion?.parte1Completa);
        const parte2Completa = Boolean(inscripcion?.parte2Completa || inscripcion?.expedienteCompleto);
        const nivelEsp = inscripcion?.nivelEspecializacion || orden.programa || "";

        res.json({
          ok: true,
          pagado,
          parte1Completa,
          parte2Completa,
          formularioCompleto: parte1Completa,
          expedienteCompleto: parte2Completa,
          ordenId,
          inscripcionId,
          alumnoId: inscripcion?.alumnoId || orden.alumnoId || null,
          emailInstitucional: inscripcion?.emailInstitucional || null,
          reglamentoUrl: inscripcion?.reglamentoUrl || getReglamentoUrl(nivelEsp),
          portalUrl: "https://alumnos.certificacionmontessori.com",
          cliente: {
            nombre: inscripcion?.nombre || orden.cliente?.nombre || "",
            email: inscripcion?.emailContacto || inscripcion?.email || orden.cliente?.email || "",
            telefono: inscripcion?.telefonoMovil || inscripcion?.telefono || orden.cliente?.telefono || "",
          },
          datosParte1: inscripcion ? {
            nombreCompleto: inscripcion.nombre || "",
            emailContacto: inscripcion.emailContacto || inscripcion.email || "",
            telefonoMovil: inscripcion.telefonoMovil || inscripcion.telefono || "",
            modalidad: inscripcion.modalidad || "",
            nivelEspecializacion: inscripcion.nivelEspecializacion || inscripcion.nivel || "",
            nacionalidad: inscripcion.nacionalidad || "",
            fechaNacimiento: inscripcion.fechaNacimiento?.toDate?.()?.toISOString?.()?.slice(0, 10) || "",
            usuarioInstitucional: inscripcion.usuarioInstitucional || "",
          } : {},
          datosParte2: inscripcion ? {
            escolaridad: inscripcion.escolaridad || "",
            domicilio: inscripcion.domicilio || "",
            curpPasaporte: inscripcion.curpPasaporte || "",
            ocupacion: inscripcion.ocupacion || "",
            empresa: inscripcion.empresa || "",
            telefonoEmpresa: inscripcion.telefonoEmpresa || "",
            documentos: inscripcion.documentos || {},
          } : {},
          programa: orden.programa || "",
        });
      } catch (err) {
        console.error("getInscripcionOrden:", err);
        res.status(500).json({error: "Error al consultar la orden"});
      }
    },
);
