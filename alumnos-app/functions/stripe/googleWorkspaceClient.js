const {google} = require("googleapis");
const {defineString, defineSecret} = require("firebase-functions/params");

const GOOGLE_ADMIN_EMAIL = defineString("GOOGLE_ADMIN_EMAIL", {
  default: "admin@asociacionmontessori.com.mx",
});

const GOOGLE_SERVICE_ACCOUNT_JSON = defineSecret("GOOGLE_SERVICE_ACCOUNT_JSON");

const DIRECTORY_SCOPE = "https://www.googleapis.com/auth/admin.directory.user";
const CLASSROOM_ROSTERS_SCOPE = "https://www.googleapis.com/auth/classroom.rosters";

function parseServiceAccountJson() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido");
    return null;
  }
}

function buildJwtAuth(scopes) {
  const sa = parseServiceAccountJson();
  const adminEmail = String(GOOGLE_ADMIN_EMAIL.value() || "").trim();
  if (!sa?.client_email || !sa?.private_key || !adminEmail) {
    return null;
  }
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes,
    subject: adminEmail,
  });
}

function isNotFoundError(err) {
  const code = err?.code ?? err?.response?.status;
  return code === 404 || code === "404";
}

function isConflictError(err) {
  const code = err?.code ?? err?.response?.status;
  return code === 409 || code === "409";
}

function splitNombreCompleto(nombre) {
  const parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return {givenName: "Alumno", familyName: "Montessori"};
  }
  if (parts.length === 1) {
    return {givenName: parts[0], familyName: parts[0]};
  }
  const familyName = parts.pop();
  return {givenName: parts.join(" "), familyName};
}

/**
 * @param {object} params
 * @param {string} params.primaryEmail
 * @param {string} params.nombreCompleto
 * @param {string} params.password
 * @param {string} params.orgUnitPath
 * @param {string} [params.recoveryEmail]
 */
async function ensureWorkspaceUser(params) {
  const auth = buildJwtAuth([DIRECTORY_SCOPE]);
  if (!auth) {
    throw new Error("Credenciales Google Workspace no configuradas");
  }

  const directory = google.admin({version: "directory_v1", auth});
  const {givenName, familyName} = splitNombreCompleto(params.nombreCompleto);
  const body = {
    primaryEmail: params.primaryEmail,
    name: {givenName, familyName},
    password: params.password,
    changePasswordAtNextLogin: false,
    orgUnitPath: params.orgUnitPath,
  };
  if (params.recoveryEmail) {
    body.recoveryEmail = params.recoveryEmail;
  }

  try {
    await directory.users.get({userKey: params.primaryEmail});
    await directory.users.patch({
      userKey: params.primaryEmail,
      body: {
        orgUnitPath: params.orgUnitPath,
        name: {givenName, familyName},
      },
    });
    return {directoryAction: "updated", primaryEmail: params.primaryEmail};
  } catch (err) {
    if (!isNotFoundError(err)) throw err;
  }

  await directory.users.insert({requestBody: body});
  return {directoryAction: "created", primaryEmail: params.primaryEmail};
}

/**
 * @param {string} courseId
 * @param {string} studentEmail
 */
async function enrollStudentInCourse(courseId, studentEmail) {
  const auth = buildJwtAuth([CLASSROOM_ROSTERS_SCOPE]);
  if (!auth) {
    throw new Error("Credenciales Google Classroom no configuradas");
  }
  const classroom = google.classroom({version: "v1", auth});
  try {
    await classroom.courses.students.create({
      courseId,
      requestBody: {userId: studentEmail},
    });
    return {courseId, status: "enrolled"};
  } catch (err) {
    if (isConflictError(err)) {
      return {courseId, status: "already_enrolled"};
    }
    throw err;
  }
}

module.exports = {
  GOOGLE_ADMIN_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_JSON,
  splitNombreCompleto,
  ensureWorkspaceUser,
  enrollStudentInCourse,
  parseServiceAccountJson,
};
