/**
 * Base de datos de materias organizadas por nivel
 * Esta estructura se usa para inicializar y gestionar las materias en Firestore
 */

export const materiasPorNivel = {
  // Propedéutico o Tronco Común - Todas las materias que toman todos los niveles excepto Neuroeducación
  'Propedéutico': [
    'Filosofía Montessori',
    'Métodos de observación',
    'Psicomotricidad',
    'Educación Inclusiva',
    'Psicología Educativa',
    'Inteligencia Creativa',
    'Musicoterapia',
    'Neuroeducación'
  ],
  
  // Nido & Comunidad Infantil
  'Nido & Comunidad infantil': [
    'Ambiente & Arte Nido',
    'Vida práctica Nido & Comunidad',
    'Sensorial & Matemáticas',
    'Lenguaje & Culturales',
    'Nutrición & Obstetricia'
  ],
  
  // Casa de Niños
  'Casa de Niños': [
    'Vida práctica Casa de Niños',
    'Sensorial Casa',
    'Lenguaje Casa',
    'Matemáticas Casa',
    'Culturales & Arte'
  ],
  
  // Taller
  'Taller': [
    'Presentaciones Preliminares',
    'Lenguaje Taller',
    'Matemáticas & Geometría',
    'Culturales'
  ],
  
  // Neuroeducación (solo toma Neuroeducación del tronco común)
  'Neuroeducación': [
    'Neuroeducación'
  ],
  
  // Diplomado en Neuroeducación
  'Diplomado en Neuroeducación': [
    'Principios básicos de neurociencia',
    'Introducción a la Neuroeducación',
    'Relación entre neurociencia y educación',
    'Memoria y aprendizaje',
    'Atención y concentración',
    'Funciones ejecutivas',
    'Estrategias pedagógicas basadas en la neurociencia',
    'Neuroeducación y dificultades de aprendizaje',
    'Emociones y aprendizaje',
    'Evaluaciones neurocognitivas',
    'Neurofeedback y biofeedback en la educación',
    'Investigación en Neuroeducación',
    'Estudios de caso en neuroeducación',
    'Desarrollo de programas de neuroeducación',
    'Talleres y actividades prácticas',
    'Presentación del proyecto final'
  ]
};

/**
 * Obtiene todas las materias para un nivel específico
 * Incluye las materias del tronco común (excepto si el nivel es Neuroeducación o Diplomado en Neuroeducación)
 */
export const getMateriasPorNivel = (nivel) => {
  if (!nivel) return [];
  
  const materias = [];
  
  // Si no es Neuroeducación ni Diplomado en Neuroeducación, agregar materias del tronco común
  if (nivel !== 'Neuroeducación' && nivel !== 'Diplomado en Neuroeducación') {
    materias.push(...materiasPorNivel['Propedéutico']);
  }
  
  // Agregar materias específicas del nivel
  if (materiasPorNivel[nivel]) {
    materias.push(...materiasPorNivel[nivel]);
  }
  
  // Eliminar duplicados (por si Neuroeducación está en ambos)
  return [...new Set(materias)];
};

/**
 * Obtiene todos los niveles disponibles
 */
export const getNiveles = () => {
  return Object.keys(materiasPorNivel);
};

/**
 * Verifica si una materia pertenece a un nivel
 */
export const materiaPerteneceANivel = (materia, nivel) => {
  const materiasDelNivel = getMateriasPorNivel(nivel);
  return materiasDelNivel.includes(materia);
};

