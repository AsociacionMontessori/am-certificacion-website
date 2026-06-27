const admin = require("firebase-admin");
const {getMateriasPorNivel} = require("./materiasPorNivel");
const {encryptPassword, CREDENTIALS_SCHEMA_VERSION} = require("./credenciales");
const {getDuracionMeses} = require("./inscripcionCatalog");

/**
 * Fecha estimada de egreso = ingreso + meses de duración del nivel.
 * @param {Date} fechaIngreso
 * @param {string} nivelEspecializacion
 * @return {import('firebase-admin').firestore.Timestamp|null}
 */
function calcularFechaEgreso(fechaIngreso, nivelEspecializacion) {
  const meses = getDuracionMeses(nivelEspecializacion);
  if (!meses) return null;
  const egreso = new Date(fechaIngreso.getTime());
  egreso.setMonth(egreso.getMonth() + meses);
  return admin.firestore.Timestamp.fromDate(egreso);
}

function buildNivelEntry(nombre, fechaInicio) {
  const id = `nivel-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const fecha = fechaInicio instanceof Date ? fechaInicio : new Date();
  return {
    id,
    nombre: String(nombre || "").trim(),
    estado: "activo",
    fechaInicio: admin.firestore.Timestamp.fromDate(fecha),
    fechaFin: null,
    certificadoUrl: null,
    observaciones: "",
    // serverTimestamp() no es válido dentro de un array en Firestore;
    // usamos un Timestamp concreto para el elemento de `niveles`.
    creadoEn: admin.firestore.Timestamp.now(),
  };
}

/**
 * Crea usuario Auth + documento alumno + materias iniciales.
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} params
 */
async function crearAlumnoDesdeInscripcion(db, params) {
  const {
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
    usuarioInstitucional,
    passwordClassroom,
    passwordTemporal,
  } = params;

  const userRecord = await admin.auth().createUser({
    email: emailInstitucional,
    password,
    displayName: nombre,
  });

  const uid = userRecord.uid;
  const nivelInicial = buildNivelEntry(nivelPortal, new Date());

  const alumnoData = {
    nombre,
    email: emailInstitucional,
    emailContacto: emailContacto || null,
    telefono: telefono || null,
    nivel: nivelPortal,
    nivelActualId: nivelInicial.id,
    niveles: [nivelInicial],
    modalidad: modalidad || null,
    nivelEspecializacion: nivelEspecializacion || null,
    nacionalidad: nacionalidad || null,
    fechaNacimiento: fechaNacimiento || null,
    usuarioInstitucional: usuarioInstitucional || null,
    fechaIngreso: admin.firestore.FieldValue.serverTimestamp(),
    fechaEgresoEstimada: calcularFechaEgreso(new Date(), nivelEspecializacion),
    estado: "Activo",
    origenInscripcion: "sitio_publico_stripe",
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    inscripcionAutomatica: true,
    passwordClassroom: passwordClassroom || null,
    passwordTemporal: passwordTemporal || null,
    mailClassroom: emailInstitucional,
  };

  await db.collection("alumnos").doc(uid).set(alumnoData);

  // Dual-write F-03: además del plaintext (legacy, leído por el frontend
  // durante la coexistencia), guardar las credenciales cifradas en una
  // colección separada con reglas estrictas. Si la clave maestra no está
  // configurada todavía, no rompemos la creación de la cuenta — sólo
  // dejamos un warning para que el equipo lo detecte y aprovisione el
  // secret antes del cleanup final.
  try {
    const passwordEnc = encryptPassword(passwordTemporal);
    const passwordClassroomEnc = encryptPassword(passwordClassroom);
    if (passwordEnc || passwordClassroomEnc) {
      await db.collection("alumnoCredenciales").doc(uid).set({
        passwordEnc: passwordEnc || null,
        passwordClassroomEnc: passwordClassroomEnc || null,
        version: CREDENTIALS_SCHEMA_VERSION,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        rotatedAt: null,
        origen: "inscripcion_alumno",
      });
    }
  } catch (credErr) {
    console.warn("crearAlumnoDesdeInscripcion: no se pudo guardar alumnoCredenciales", credErr.message);
  }

  const materias = getMateriasPorNivel(nivelPortal);
  if (materias.length > 0) {
    const batch = db.batch();
    materias.forEach((nombreMateria) => {
      const ref = db.collection("materias").doc();
      batch.set(ref, {
        alumnoId: uid,
        nombre: nombreMateria,
        nivel: nivelPortal,
        fechaInicio: null,
        fechaFin: null,
        profesor: null,
        aula: null,
        horario: null,
        estado: "Pendiente",
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return {uid, emailInstitucional, nivelPortal};
}

module.exports = {crearAlumnoDesdeInscripcion, buildNivelEntry};
