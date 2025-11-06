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
  ]
};

/**
 * Obtiene todas las materias para un nivel específico
 * Incluye las materias del tronco común (excepto si el nivel es Neuroeducación)
 */
export const getMateriasPorNivel = (nivel) => {
  if (!nivel) return [];
  
  const materias = [];
  
  // Si no es Neuroeducación, agregar materias del tronco común
  if (nivel !== 'Neuroeducación') {
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

