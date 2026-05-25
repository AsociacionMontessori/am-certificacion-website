/**
 * Catálogo OU + cursos Classroom por nivel del portal.
 * Sobrescribir con GOOGLE_CLASSROOM_COURSE_MAP (JSON) en secretos Firebase.
 */

const {defineString} = require("firebase-functions/params");

const GOOGLE_STUDENTS_OU_BASE = defineString("GOOGLE_STUDENTS_OU_BASE", {
  default: "/Students/Certificacion",
});

const GOOGLE_CLASSROOM_COURSE_MAP = defineString("GOOGLE_CLASSROOM_COURSE_MAP", {
  default: "{}",
});

/** Slug de OU bajo GOOGLE_STUDENTS_OU_BASE */
const NIVEL_OU_SLUG = {
  "Propedéutico": "Propedeutico",
  "Nido & Comunidad infantil": "Nido",
  "Casa de Niños": "Casa",
  Taller: "Taller",
  Neuroeducación: "Neuroeducacion",
  "Diplomado en Neuroeducación": "Neuroeducacion",
};

/** Cursos por defecto (vacío hasta configurar en Firebase). */
const DEFAULT_CLASSROOM_COURSES = {
  "Propedéutico": [],
  "Nido & Comunidad infantil": [],
  "Casa de Niños": [],
  Taller: [],
  Neuroeducación: [],
  "Diplomado en Neuroeducación": [],
};

function parseCourseMapJson(raw) {
  if (!raw || !String(raw).trim()) return {};
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("GOOGLE_CLASSROOM_COURSE_MAP inválido:", err.message);
    return {};
  }
}

function getOrgUnitPathForNivel(nivelPortal) {
  const base = String(GOOGLE_STUDENTS_OU_BASE.value() || "/Students/Certificacion")
      .replace(/\/+$/, "");
  const slug = NIVEL_OU_SLUG[nivelPortal] || "General";
  return `${base}/${slug}`;
}

function getClassroomCourseIdsForNivel(nivelPortal) {
  const fromEnv = parseCourseMapJson(GOOGLE_CLASSROOM_COURSE_MAP.value());
  const ids = fromEnv[nivelPortal] || DEFAULT_CLASSROOM_COURSES[nivelPortal] || [];
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
}

module.exports = {
  GOOGLE_STUDENTS_OU_BASE,
  GOOGLE_CLASSROOM_COURSE_MAP,
  getOrgUnitPathForNivel,
  getClassroomCourseIdsForNivel,
};
