const getCryptoRef = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  return null;
};

const ensureDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const generateNivelId = () => {
  const cryptoRef = getCryptoRef();
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  return `nivel-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const buildNivelEntry = ({
  nombre,
  estado = 'activo',
  fechaInicio,
  fechaFin = null,
  certificadoUrl = null,
  observaciones = ''
}) => {
  const nombreSanitizado = nombre?.trim() || '';
  return {
    id: generateNivelId(),
    nombre: nombreSanitizado,
    estado,
    fechaInicio: ensureDate(fechaInicio) || new Date(),
    fechaFin: ensureDate(fechaFin),
    certificadoUrl: certificadoUrl || null,
    observaciones: observaciones || '',
    creadoEn: new Date()
  };
};

export const getHistorialNiveles = (alumno) => {
  if (!alumno) {
    return [];
  }
  return Array.isArray(alumno.niveles) ? alumno.niveles : [];
};

export const getNivelActivo = (alumno) => {
  if (!alumno) {
    return null;
  }

  const historial = getHistorialNiveles(alumno);
  const activo = historial.find((nivel) => nivel?.estado === 'activo');
  if (activo) {
    return activo;
  }

  if (alumno.nivel) {
    return {
      id: null,
      nombre: alumno.nivel,
      estado: 'activo',
      fechaInicio: ensureDate(alumno.fechaIngreso),
      fechaFin: ensureDate(alumno.fechaEgresoEstimada),
      certificadoUrl: null,
      observaciones: alumno.observacionesNivel || ''
    };
  }

  return null;
};

export const actualizarHistorialNiveles = ({
  alumno,
  nuevoNivelNombre,
  fechaInicioNuevo,
  fechaFinAnterior
}) => {
  const historialExistente = getHistorialNiveles(alumno).map((nivel) => ({ ...nivel }));
  const nombreNormalizado = nuevoNivelNombre?.trim() || '';
  const fechaInicioNormalizada = ensureDate(fechaInicioNuevo) || new Date();
  let historialActualizado = historialExistente;
  let nivelActualId = alumno?.nivelActualId || null;

  const registrarNivelAnteriorSiFalta = () => {
    if (historialActualizado.length === 0 && alumno?.nivel) {
      const esMismoNivel = nombreNormalizado && alumno.nivel === nombreNormalizado;
      const nivelAnterior = {
        id: generateNivelId(),
        nombre: alumno.nivel,
        estado: esMismoNivel ? 'activo' : 'completado',
        fechaInicio: ensureDate(alumno.fechaIngreso),
        fechaFin: esMismoNivel ? null : ensureDate(fechaFinAnterior) || new Date(),
        certificadoUrl: null,
        observaciones: ''
      };
      historialActualizado = [nivelAnterior];
      nivelActualId = esMismoNivel ? nivelAnterior.id : null;
    }
  };

  registrarNivelAnteriorSiFalta();

  const nivelActivoActual = historialActualizado.find((nivel) => nivel.estado === 'activo');

  if (!nombreNormalizado) {
    if (nivelActivoActual) {
      const fin = ensureDate(fechaFinAnterior) || new Date();
      historialActualizado = historialActualizado.map((nivel) =>
        nivel.id === nivelActivoActual.id
          ? { ...nivel, estado: 'completado', fechaFin: fin }
          : nivel
      );
    }
    return { historialActualizado, nivelActualId: null };
  }

  if (nivelActivoActual && nivelActivoActual.nombre === nombreNormalizado) {
    historialActualizado = historialActualizado.map((nivel) =>
      nivel.id === nivelActivoActual.id
        ? { ...nivel, fechaInicio: nivel.fechaInicio || fechaInicioNormalizada }
        : nivel
    );
    return { historialActualizado, nivelActualId: nivelActivoActual.id };
  }

  if (nivelActivoActual) {
    const fin = ensureDate(fechaFinAnterior) || new Date();
    historialActualizado = historialActualizado.map((nivel) =>
      nivel.id === nivelActivoActual.id
        ? { ...nivel, estado: 'completado', fechaFin: fin }
        : nivel
    );
  }

  const nuevoNivel = buildNivelEntry({
    nombre: nombreNormalizado,
    estado: 'activo',
    fechaInicio: fechaInicioNormalizada
  });

  historialActualizado = [...historialActualizado, nuevoNivel];
  nivelActualId = nuevoNivel.id;

  return { historialActualizado, nivelActualId };
};

export const ensureNivelData = (alumno) => {
  const historial = getHistorialNiveles(alumno);
  const nivelActivo = getNivelActivo(alumno);

  return {
    historial,
    nivelActivo,
    nivelActualNombre: nivelActivo?.nombre || alumno?.nivel || null
  };
};
