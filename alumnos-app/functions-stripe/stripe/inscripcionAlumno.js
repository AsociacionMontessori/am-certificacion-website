const admin = require("firebase-admin");
const {getMateriasPorNivel} = require("./materiasPorNivel");

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
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
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
    fechaEgresoEstimada: null,
    estado: "Activo",
    origenInscripcion: "sitio_publico_stripe",
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    inscripcionAutomatica: true,
    passwordClassroom: passwordClassroom || null,
    passwordTemporal: passwordTemporal || null,
    mailClassroom: emailInstitucional,
  };

  await db.collection("alumnos").doc(uid).set(alumnoData);

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
