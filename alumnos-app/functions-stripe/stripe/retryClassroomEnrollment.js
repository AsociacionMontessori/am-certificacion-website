const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const {
  GOOGLE_SERVICE_ACCOUNT_JSON,
  enrollStudentInCourse,
  parseServiceAccountJson,
} = require("./googleWorkspaceClient");
const {getClassroomCourseIdsForNivel} = require("./googleWorkspaceCatalog");

// Tope de reintentos por alumno (12 × 15 min = 3 h de ventana). Tras eso se
// deja en "partial" y se cuenta con el aviso a admin para alta manual.
const MAX_RETRIES = 12;
const BATCH = 40;

/**
 * Reintenta inscribir en Classroom a los alumnos cuyo alta automática quedó
 * "partial"/"error" porque la cuenta de Google estaba recién creada
 * (`@CannotDirectAddUser`: Google tarda en propagar la cuenta antes de poder
 * agregarla directamente a un curso). Reintenta periódicamente hasta lograrlo
 * o agotar MAX_RETRIES.
 */
exports.retryClassroomEnrollmentHandler = onSchedule(
    {
      schedule: "every 15 minutes",
      region: "us-central1",
      timeoutSeconds: 300,
      secrets: [GOOGLE_SERVICE_ACCOUNT_JSON],
    },
    async () => {
      const db = admin.firestore();
      if (!parseServiceAccountJson()) {
        console.warn("retryClassroomEnrollment: falta GOOGLE_SERVICE_ACCOUNT_JSON, omitido");
        return;
      }

      const snap = await db.collection("alumnos")
          .where("googleWorkspace.status", "in", ["partial", "error"])
          .limit(BATCH)
          .get();

      if (snap.empty) {
        console.log("retryClassroomEnrollment: nada pendiente");
        return;
      }

      let procesados = 0;
      let resueltos = 0;

      for (const doc of snap.docs) {
        const data = doc.data();
        const gw = data.googleWorkspace || {};

        // Solo reintentamos Classroom si la cuenta de Workspace ya existe.
        if (!gw.directoryAction) continue;
        if ((gw.classroomRetryCount || 0) >= MAX_RETRIES) continue;

        const email = data.mailClassroom || data.email;
        const nivelPortal = data.nivel || "";
        if (!email || !nivelPortal) continue;

        const targetCourses = getClassroomCourseIdsForNivel(nivelPortal);
        if (targetCourses.length === 0) continue;

        const enrolled = new Set(
            (gw.courses || [])
                .filter((c) => c && (c.status === "enrolled" || c.status === "already_enrolled"))
                .map((c) => c.courseId),
        );
        const pending = targetCourses.filter((id) => !enrolled.has(id));
        const nonClassroomErrors = (gw.errors || []).filter((e) => e.step !== "classroom");

        // Ya está todo inscrito: normalizamos el estado y seguimos.
        if (pending.length === 0) {
          await doc.ref.set({
            googleWorkspace: {
              ...gw,
              errors: nonClassroomErrors,
              status: nonClassroomErrors.length > 0 ? "partial" : "ok",
            },
          }, {merge: true});
          resueltos++;
          continue;
        }

        procesados++;
        const courses = [...(gw.courses || [])];
        const classroomErrors = [];

        for (const courseId of pending) {
          try {
            const enr = await enrollStudentInCourse(courseId, email);
            courses.push(enr);
          } catch (err) {
            classroomErrors.push({
              step: "classroom",
              courseId,
              message: err.message || String(err),
            });
          }
        }

        const errors = [...nonClassroomErrors, ...classroomErrors];
        const status = errors.length > 0 ? "partial" : "ok";
        await doc.ref.set({
          googleWorkspace: {
            ...gw,
            courses,
            errors,
            status,
            classroomRetryCount: (gw.classroomRetryCount || 0) + 1,
            classroomLastRetryAt: admin.firestore.Timestamp.now(),
          },
        }, {merge: true});
        if (status === "ok") resueltos++;
      }

      console.log(
          `retryClassroomEnrollment: procesados=${procesados} resueltos=${resueltos} de ${snap.size}`,
      );
    },
);
