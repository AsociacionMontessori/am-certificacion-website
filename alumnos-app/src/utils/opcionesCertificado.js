// Reutiliza el parámetro «nivel» que ya interpreta CertificadoDigital.
// Los enlaces genéricos existentes se conservan para expedientes sin historial.
export const obtenerOpcionesCertificado = (alumno, origin) => {
  const base = `${origin}/certificado/${encodeURIComponent(alumno.id)}`;
  const historial = Array.isArray(alumno.niveles) ? alumno.niveles : [];
  const vistos = new Set();
  const opciones = historial.filter(nivel => {
    if (!nivel?.id || !nivel.nombre || vistos.has(nivel.id)) return false;
    vistos.add(nivel.id);
    return true;
  }).map(nivel => ({
    id: nivel.id,
    nombre: nivel.nombre,
    url: `${base}?nivel=${encodeURIComponent(nivel.id)}`,
  }));
  if (!opciones.length || (alumno.nivel && !opciones.some(n => n.nombre === alumno.nivel))) {
    opciones.push({ nombre: alumno.nivel || 'Certificado general', url: base });
  }
  return opciones;
};

// Misma clasificación que el certificado público: un estado distinto de
// «activo» no basta para acreditar que el nivel se completó.
export const obtenerDocumentosPorNivel = (alumno, origin) => {
  if (!alumno?.id || alumno.estado === 'Inactivo') return [];
  const historial = Array.isArray(alumno.niveles) ? alumno.niveles : [];
  return obtenerOpcionesCertificado(alumno, origin).map(opcion => {
    const nivel = historial.find(n => n?.id && n.id === opcion.id);
    const completado = nivel
      ? nivel.estado === 'completado' ||
        (alumno.estado === 'Graduado' && nivel.nombre === alumno.nivel)
      : alumno.estado === 'Graduado' || Boolean(alumno.fechaGraduacion);
    const tipo = completado ? 'Certificado' : 'Constancia';
    return {
      ...opcion,
      tipo,
      label: `${tipo} de ${opcion.nombre}`,
      url: completado ? opcion.url : `${opcion.url}${opcion.id ? '&' : '?'}tipo=constancia`,
    };
  });
};
