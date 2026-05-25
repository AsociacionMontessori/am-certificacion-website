/**
 * Catálogo OU + cursos Classroom por nivel del portal.
 * GOOGLE_CLASSROOM_COURSE_MAP agrega cursos por programa; Portal Montessori
 * queda como curso base para todos los niveles.
 */

const {defineString} = require("firebase-functions/params");

const GOOGLE_STUDENTS_OU_BASE = defineString("GOOGLE_STUDENTS_OU_BASE", {
  default: "/Diplomados",
});

const GOOGLE_CLASSROOM_COURSE_MAP = defineString("GOOGLE_CLASSROOM_COURSE_MAP", {
  default: "{}",
});

const PORTAL_MONTESSORI_COURSE_ID = "765463029199";

/** Ruta relativa de OU bajo GOOGLE_STUDENTS_OU_BASE. */
const NIVEL_OU_RELATIVE_PATH = {
  "Propedéutico": "",
  "Nido & Comunidad infantil": "Nido & Comunidad",
  "Casa de Niños": "Casa de Niños",
  Taller: "Taller",
  Neuroeducación: "Neuroeducación",
  "Diplomado en Neuroeducación": "Neuroeducación",
};

/** Cursos base: Portal Montessori para todos los niveles. */
const DEFAULT_CLASSROOM_COURSES = {
  "Propedéutico": [PORTAL_MONTESSORI_COURSE_ID],
  "Nido & Comunidad infantil": [PORTAL_MONTESSORI_COURSE_ID],
  "Casa de Niños": [PORTAL_MONTESSORI_COURSE_ID],
  Taller: [PORTAL_MONTESSORI_COURSE_ID],
  Neuroeducación: [PORTAL_MONTESSORI_COURSE_ID],
  "Diplomado en Neuroeducación": [PORTAL_MONTESSORI_COURSE_ID],
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

function normalizeBasePath(path) {
  const normalized = String(path || "/Diplomados").trim().replace(/\/+$/, "");
  return normalized || "/";
}

function normalizeRelativePath(path) {
  return String(path || "").trim().replace(/^\/+|\/+$/g, "");
}

function normalizeCourseIds(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  return raw.map((id) => String(id).trim()).filter(Boolean);
}

function getOrgUnitPathForNivel(nivelPortal) {
  const base = normalizeBasePath(GOOGLE_STUDENTS_OU_BASE.value());
  const relative = normalizeRelativePath(NIVEL_OU_RELATIVE_PATH[nivelPortal]);
  if (!relative) return base;
  return `${base}/${relative}`.replace(/\/{2,}/g, "/");
}

function getClassroomCourseIdsForNivel(nivelPortal) {
  const fromEnv = parseCourseMapJson(GOOGLE_CLASSROOM_COURSE_MAP.value());
  const defaults = DEFAULT_CLASSROOM_COURSES[nivelPortal] || [];
  const configured = normalizeCourseIds(fromEnv[nivelPortal]);
  return [...new Set([...defaults, ...configured])];
}

module.exports = {
  GOOGLE_STUDENTS_OU_BASE,
  GOOGLE_CLASSROOM_COURSE_MAP,
  PORTAL_MONTESSORI_COURSE_ID,
  getOrgUnitPathForNivel,
  getClassroomCourseIdsForNivel,
};
