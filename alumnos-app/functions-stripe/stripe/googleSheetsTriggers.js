const {onDocumentCreated, onDocumentWritten} = require("firebase-functions/v2/firestore");
const {GOOGLE_SERVICE_ACCOUNT_JSON} = require("./googleWorkspaceClient");
const {
  syncAlumnoToSheets,
  syncInscripcionToSheets,
} = require("./googleSheetsSync");

const TRIGGER_OPTIONS = {
  region: "us-central1",
  retry: true,
  secrets: [GOOGLE_SERVICE_ACCOUNT_JSON],
};

const syncAlumnoToSheetsTrigger = onDocumentCreated(
    {
      ...TRIGGER_OPTIONS,
      document: "alumnos/{alumnoId}",
    },
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) return;
      const result = await syncAlumnoToSheets(event.params.alumnoId, {
        nombre: snapshot.get("nombre"),
        email: snapshot.get("email"),
        emailContacto: snapshot.get("emailContacto"),
        mailClassroom: snapshot.get("mailClassroom"),
        telefono: snapshot.get("telefono"),
        telefonoMovil: snapshot.get("telefonoMovil"),
        nivel: snapshot.get("nivel"),
        nivelEspecializacion: snapshot.get("nivelEspecializacion"),
      });
      console.info("syncAlumnoToSheets", {
        alumnoId: event.params.alumnoId,
        status: result.status,
        rowNumber: result.rowNumber || null,
        reason: result.reason || null,
      });
    },
);

const syncInscripcionToSheetsTrigger = onDocumentWritten(
    {
      ...TRIGGER_OPTIONS,
      document: "inscripciones/{inscripcionId}",
    },
    async (event) => {
      const snapshot = event.data?.after;
      if (!snapshot?.exists) return;
      const alumnoId = snapshot.get("alumnoId");
      const parte1Completa = snapshot.get("parte1Completa");
      if (!alumnoId || !parte1Completa) return;

      const result = await syncInscripcionToSheets(event.params.inscripcionId, {
        nombre: snapshot.get("nombre"),
        nivel: snapshot.get("nivel"),
        nivelEspecializacion: snapshot.get("nivelEspecializacion"),
        modalidad: snapshot.get("modalidad"),
        fechaInscripcion: snapshot.get("fechaInscripcion"),
        parte1CompletadaAt: snapshot.get("parte1CompletadaAt"),
        emailInstitucional: snapshot.get("emailInstitucional"),
      });
      console.info("syncInscripcionToSheets", {
        inscripcionId: event.params.inscripcionId,
        status: result.status,
        rowNumber: result.rowNumber || null,
        reason: result.reason || null,
      });
    },
);

module.exports = {
  syncAlumnoToSheetsTrigger,
  syncInscripcionToSheetsTrigger,
};
