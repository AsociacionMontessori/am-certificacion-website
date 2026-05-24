/** Copia CommonJS de alumnos-app/src/data/materiasPorNivel.js para Cloud Functions */

const materiasPorNivel = {
  "Propedéutico": [
    "Filosofía Montessori",
    "Métodos de observación",
    "Psicomotricidad",
    "Educación Inclusiva",
    "Psicología Educativa",
    "Inteligencia Creativa",
    "Musicoterapia",
    "Neuroeducación",
  ],
  "Nido & Comunidad infantil": [
    "Ambiente & Arte Nido",
    "Vida práctica Nido & Comunidad",
    "Sensorial & Matemáticas",
    "Lenguaje & Culturales",
    "Nutrición & Obstetricia",
  ],
  "Casa de Niños": [
    "Vida práctica Casa de Niños",
    "Sensorial Casa",
    "Lenguaje Casa",
    "Matemáticas Casa",
    "Culturales & Arte",
  ],
  Taller: [
    "Presentaciones Preliminares",
    "Lenguaje Taller",
    "Matemáticas & Geometría",
    "Culturales",
  ],
  Neuroeducación: ["Neuroeducación"],
  "Diplomado en Neuroeducación": [
    "Principios básicos de neurociencia",
    "Introducción a la Neuroeducación",
    "Relación entre neurociencia y educación",
    "Memoria y aprendizaje",
    "Atención y concentración",
    "Funciones ejecutivas",
    "Estrategias pedagógicas basadas en la neurociencia",
    "Neuroeducación y dificultades de aprendizaje",
    "Emociones y aprendizaje",
    "Evaluaciones neurocognitivas",
    "Neurofeedback y biofeedback en la educación",
    "Investigación en Neuroeducación",
    "Estudios de caso en neuroeducación",
    "Desarrollo de programas de neuroeducación",
    "Talleres y actividades prácticas",
    "Presentación del proyecto final",
  ],
};

function getMateriasPorNivel(nivel) {
  if (!nivel) return [];
  const materias = [];
  if (nivel !== "Neuroeducación" && nivel !== "Diplomado en Neuroeducación") {
    materias.push(...materiasPorNivel["Propedéutico"]);
  }
  if (materiasPorNivel[nivel]) {
    materias.push(...materiasPorNivel[nivel]);
  }
  return [...new Set(materias)];
}

module.exports = {getMateriasPorNivel};
