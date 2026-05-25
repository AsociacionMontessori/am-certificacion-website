const {defineString} = require("firebase-functions/params");
const {
  getOrgUnitPathForNivel,
  getClassroomCourseIdsForNivel,
} = require("./googleWorkspaceCatalog");
const {
  ensureWorkspaceUser,
  enrollStudentInCourse,
  parseServiceAccountJson,
} = require("./googleWorkspaceClient");

const GOOGLE_WORKSPACE_PROVISION_ENABLED = defineString(
    "GOOGLE_WORKSPACE_PROVISION_ENABLED",
    {default: "false"},
);

function isProvisionEnabled() {
  const flag = String(GOOGLE_WORKSPACE_PROVISION_ENABLED.value() || "")
      .trim()
      .toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

/**
 * Alta en Google Admin (usuario + OU) e inscripción en cursos Classroom.
 * No lanza si está deshabilitado; errores parciales se devuelven en el resultado.
 */
async function provisionGoogleWorkspaceAlumno({
  emailInstitucional,
  nombreCompleto,
  password,
  nivelPortal,
  emailContacto,
}) {
  if (!isProvisionEnabled()) {
    return {
      status: "skipped",
      reason: "GOOGLE_WORKSPACE_PROVISION_ENABLED no activo",
    };
  }

  if (!parseServiceAccountJson()) {
    return {
      status: "skipped",
      reason: "Falta secreto GOOGLE_SERVICE_ACCOUNT_JSON",
    };
  }

  const orgUnitPath = getOrgUnitPathForNivel(nivelPortal);
  const courseIds = getClassroomCourseIdsForNivel(nivelPortal);
  const result = {
    status: "ok",
    orgUnitPath,
    directoryAction: null,
    courses: [],
    errors: [],
  };

  try {
    const directory = await ensureWorkspaceUser({
      primaryEmail: emailInstitucional,
      nombreCompleto,
      password,
      orgUnitPath,
      recoveryEmail: emailContacto || undefined,
    });
    result.directoryAction = directory.directoryAction;
  } catch (err) {
    result.errors.push({step: "directory", message: err.message || String(err)});
  }

  for (const courseId of courseIds) {
    try {
      const enrollment = await enrollStudentInCourse(courseId, emailInstitucional);
      result.courses.push(enrollment);
    } catch (err) {
      result.errors.push({
        step: "classroom",
        courseId,
        message: err.message || String(err),
      });
    }
  }

  if (result.errors.length > 0) {
    result.status = result.directoryAction || result.courses.length > 0 ?
      "partial" :
      "error";
  }

  if (courseIds.length === 0) {
    result.coursesNote =
      "Sin cursos configurados para este nivel (GOOGLE_CLASSROOM_COURSE_MAP).";
  }

  return result;
}

module.exports = {
  GOOGLE_WORKSPACE_PROVISION_ENABLED,
  provisionGoogleWorkspaceAlumno,
  isProvisionEnabled,
};
