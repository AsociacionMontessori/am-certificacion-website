import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { ArrowLeftIcon, CalendarIcon, ChartBarIcon, AcademicCapIcon, CurrencyDollarIcon, PencilIcon, CheckIcon, XMarkIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { formatearFechaLarga, formatearFechaInput } from '../../utils/formatearFecha';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';
import { getNivelActivo, getHistorialNiveles, actualizarHistorialNiveles } from '../../utils/alumnos';
import { obtenerNiveles } from '../../services/nivelesService';

const AlumnoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [formData, setFormData] = useState({
    matricula: '',
    email: '',
    emailContacto: '',
    telefono: '',
    nivel: '',
    programa: '',
    cohorte: '',
    fechaIngreso: '',
    fechaEgresoEstimada: '',
    estado: 'Activo',
    mailClassroom: '',
    passwordClassroom: ''
  });
  const [nivelesHistorial, setNivelesHistorial] = useState([]);
  const [nivelesDisponibles, setNivelesDisponibles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const { success, error: showError, prompt: showPrompt } = useNotifications();

  const convertirFecha = (valor) => {
    if (!valor) {
      return null;
    }
    if (valor instanceof Date) {
      return valor;
    }
    if (typeof valor?.toDate === 'function') {
      return valor.toDate();
    }
    const parsed = new Date(valor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const prepararFormulario = (datos) => {
    if (!datos) {
      return;
    }
    const fechaIngreso = formatearFechaInput(datos.fechaIngreso);
    const fechaEgresoEstimada = formatearFechaInput(datos.fechaEgresoEstimada);
    const nivelActivoActual = getNivelActivo(datos);

    setFormData({
      matricula: datos.matricula || '',
      email: datos.email || '',
      emailContacto: datos.emailContacto || '',
      telefono: datos.telefono || '',
      nivel: nivelActivoActual?.nombre || '',
      programa: datos.programa || '',
      cohorte: datos.cohorte || '',
      fechaIngreso: fechaIngreso,
      fechaEgresoEstimada: fechaEgresoEstimada,
      estado: datos.estado || 'Activo',
      mailClassroom: datos.mailClassroom || '',
      passwordClassroom: datos.passwordClassroom || ''
    });
    setNivelesHistorial(getHistorialNiveles(datos));
  };

  // Función para copiar al portapapeles
  const handleCopyToClipboard = async (texto, tipo = '') => {
    try {
      await navigator.clipboard.writeText(texto);
      success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
    } catch (error) {
      console.error('Error al copiar:', error);
      const userInput = await showPrompt(`Copia este ${tipo || 'texto'}:`, {
        defaultValue: texto,
        title: 'Copiar al portapapeles'
      });
      if (userInput) {
        success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
      }
    }
  };

  useEffect(() => {
    const loadAlumno = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          const data = { id: alumnoDoc.id, ...alumnoDoc.data() };
          setAlumno(data);
          prepararFormulario(data);
        }
      } catch (error) {
        console.error('Error al cargar alumno:', error);
      }
      setLoading(false);
    };

    loadAlumno();
  }, [id]);

  useEffect(() => {
    const cargarNiveles = async () => {
      try {
        const resultado = await obtenerNiveles();
        if (resultado.success) {
          const nivelesActivos = resultado.niveles
            .filter((nivel) => nivel.activo !== false && nivel?.nombre)
            .map((nivel) => nivel.nombre);
          setNivelesDisponibles(nivelesActivos);
          return;
        }
      } catch (error) {
        console.error('Error al cargar niveles:', error);
      }
      setNivelesDisponibles([
        'Propedéutico',
        'Nido & Comunidad infantil',
        'Comunidad Infantil (0-3 años)',
        'Casa de Niños',
        'Casa de Niños (3-6 años)',
        'Taller',
        'Taller 1 (6-9 años)',
        'Taller 2 (9-12 años)',
        'Neuroeducación'
      ]);
    };

    cargarNiveles();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const nombreNivelNuevo = formData.nivel?.trim() || '';
      const programaNormalizado = formData.programa?.trim() || '';
      const cohorteNormalizado = formData.cohorte?.trim() || '';
      const nivelActivoAnterior = getNivelActivo(alumno);
      const nombreNivelAnterior = nivelActivoAnterior?.nombre || alumno?.nivel || '';

      let fechaFinAnterior = null;
      if (nombreNivelAnterior && nombreNivelAnterior !== nombreNivelNuevo) {
        const fechaFinInput = await showPrompt(
          '¿Cuál fue la fecha de finalización del nivel anterior?',
          {
            title: 'Finalización de nivel previo',
            type: 'date'
          }
        );
        if (fechaFinInput) {
          const parsedFechaFin = new Date(fechaFinInput);
          if (!Number.isNaN(parsedFechaFin.getTime())) {
            fechaFinAnterior = parsedFechaFin;
          }
        }
      }

      const { historialActualizado, nivelActualId } = actualizarHistorialNiveles({
        alumno,
        nuevoNivelNombre: nombreNivelNuevo,
        fechaInicioNuevo: formData.fechaIngreso ? new Date(formData.fechaIngreso) : undefined,
        fechaFinAnterior
      });

      let estadoActualizado = formData.estado;
      if (estadoActualizado === 'Graduado' && nombreNivelNuevo) {
        estadoActualizado = 'Activo';
      }

      const updateData = {
        matricula: formData.matricula || null,
        email: formData.email,
        emailContacto: formData.emailContacto || null,
        telefono: formData.telefono || null,
        nivel: nombreNivelNuevo || null,
        programa: programaNormalizado || null,
        cohorte: cohorteNormalizado || null,
        nivelActualId: nivelActualId || null,
        niveles: historialActualizado,
        fechaIngreso: formData.fechaIngreso ? new Date(formData.fechaIngreso) : null,
        fechaEgresoEstimada: formData.fechaEgresoEstimada ? new Date(formData.fechaEgresoEstimada) : null,
        estado: estadoActualizado,
        mailClassroom: formData.mailClassroom || null,
        passwordClassroom: formData.passwordClassroom || null
      };

      await updateDoc(doc(db, 'alumnos', id), updateData);
      
      // Recargar datos
      const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
      if (alumnoDoc.exists()) {
        const data = { id: alumnoDoc.id, ...alumnoDoc.data() };
        setAlumno(data);
        prepararFormulario(data);
      }
      
      setEditing(false);
      success('Datos guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al guardar los datos');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (alumno) {
      prepararFormulario(alumno);
    }
    setEditing(false);
  };

  // Función para iniciar sesión como este usuario
  const handleSignInAsUser = async () => {
    if (!alumno?.email) {
      showError('No se puede iniciar sesión: el usuario no tiene email');
      return;
    }

    // Obtener la contraseña del documento del alumno en Firestore
    const password = alumno.passwordTemporal;

    if (!password) {
      const userPassword = await showPrompt(
        'La contraseña no está disponible en el sistema. Por favor, ingresa la contraseña del usuario:',
        {
          title: 'Ingresar contraseña',
          type: 'password',
          placeholder: 'Contraseña del usuario'
        }
      );
      if (!userPassword) {
        return;
      }
      try {
        setSigningIn(true);
        await signInWithEmailAndPassword(auth, alumno.email, userPassword);
        // Redirigir al dashboard del alumno
        navigate('/');
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showError(`Error al iniciar sesión: ${error.message}`);
      } finally {
        setSigningIn(false);
      }
      return;
    }

    try {
      setSigningIn(true);
      await signInWithEmailAndPassword(auth, alumno.email, password);
      // Redirigir al dashboard del alumno
      navigate('/');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      // Si la contraseña no funciona, pedirla manualmente
      const userPassword = await showPrompt(
        'La contraseña registrada no funcionó. Por favor, ingresa la contraseña del usuario:',
        {
          title: 'Ingresar contraseña',
          type: 'password',
          placeholder: 'Contraseña del usuario'
        }
      );
      if (userPassword) {
        try {
          await signInWithEmailAndPassword(auth, alumno.email, userPassword);
          navigate('/');
        } catch (retryError) {
          showError(`Error al iniciar sesión: ${retryError.message}`);
        }
      }
    } finally {
      setSigningIn(false);
    }
  };

  const historialOrdenado = [...nivelesHistorial].sort((a, b) => {
    const fechaA = convertirFecha(a?.fechaInicio)?.getTime() || 0;
    const fechaB = convertirFecha(b?.fechaInicio)?.getTime() || 0;
    return fechaB - fechaA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <p className="text-gray-600 dark:text-gray-400">Alumno no encontrado</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue hover:text-blue/80 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Volver al panel
      </Link>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {alumno.nombre}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detalles del alumno
          </p>
        </div>
        <button
          onClick={handleSignInAsUser}
          disabled={signingIn}
          className="inline-flex items-center px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signingIn ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Iniciando sesión...
            </>
          ) : (
            <>
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Iniciar sesión como este usuario
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Información Personal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información Personal
            </h2>
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-blue hover:bg-blue/10 rounded-lg transition-colors"
                title="Editar"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            {canEdit && editing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 text-green hover:bg-green/10 rounded-lg transition-colors"
                  title="Guardar"
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="p-2 text-red hover:bg-red/10 rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.nombre}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Matrícula</dt>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Matrícula"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.matricula || 'N/A'}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              {editing && canEdit ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Email"
                  required
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.email}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email de recuperación</dt>
              {editing && canEdit ? (
                <input
                  type="email"
                  value={formData.emailContacto}
                  onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Email de recuperación"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.emailContacto || 'N/A'}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              {editing && canEdit ? (
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Teléfono"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.telefono || 'N/A'}</dd>
              )}
            </div>
            {alumno.fechaNacimiento && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatearFechaLarga(alumno.fechaNacimiento)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Información Académica */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Académica
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Programa</dt>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.programa}
                  onChange={(e) => setFormData({ ...formData, programa: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Ej: Diplomado Montessori"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.programa || 'N/A'}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cohorte</dt>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.cohorte}
                  onChange={(e) => setFormData({ ...formData, cohorte: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Ej: Generación 2025"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.cohorte || 'N/A'}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nivel</dt>
              {editing && canEdit ? (
                <select
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Seleccionar nivel</option>
                  {[...new Set([...(nivelesDisponibles || []), formData.nivel].filter(Boolean))].map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{formData.nivel || 'N/A'}</dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Historial de niveles</dt>
              <dd className="mt-2">
                {historialOrdenado.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {historialOrdenado.map((nivelItem, index) => {
                      const fechaInicioNivel = convertirFecha(nivelItem?.fechaInicio);
                      const fechaFinNivel = convertirFecha(nivelItem?.fechaFin);
                      const keyBase = `${nivelItem?.nombre || 'nivel'}-${fechaInicioNivel?.getTime() || index}`;
                      const key = nivelItem?.id || keyBase;
                      const estadoActivo = nivelItem?.estado === 'activo';

                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                {nivelItem?.nombre || 'Nivel sin nombre'}
                              </p>
                              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {estadoActivo ? 'En progreso' : 'Finalizado'}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center self-start rounded-full px-2.5 py-1 text-xs font-medium ${
                                estadoActivo
                                  ? 'bg-blue/10 text-blue'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              }`}
                            >
                              {estadoActivo ? 'Activo' : 'Completado'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                            <p>
                              <span className="font-medium text-gray-700 dark:text-gray-200">Inicio:</span>{' '}
                              {fechaInicioNivel ? formatearFechaLarga(fechaInicioNivel) : 'Sin registro'}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700 dark:text-gray-200">Fin:</span>{' '}
                              {fechaFinNivel ? formatearFechaLarga(fechaFinNivel) : 'En curso'}
                            </p>
                            {nivelItem?.certificadoUrl && (
                              <p className="sm:col-span-2">
                                <span className="font-medium text-gray-700 dark:text-gray-200">Certificado:</span>{' '}
                                <a
                                  href={nivelItem.certificadoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue hover:text-blue/80 underline break-words"
                                >
                                  Ver constancia
                                </a>
                              </p>
                            )}
                            {nivelItem?.observaciones && (
                              <p className="sm:col-span-2">
                                <span className="font-medium text-gray-700 dark:text-gray-200">Notas:</span>{' '}
                                {nivelItem.observaciones}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay historial registrado.</p>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de ingreso</dt>
              {editing && canEdit ? (
                <input
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatearFechaLarga(alumno.fechaIngreso)}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha estimada de egreso</dt>
              {editing && canEdit ? (
                <input
                  type="date"
                  value={formData.fechaEgresoEstimada}
                  onChange={(e) => setFormData({ ...formData, fechaEgresoEstimada: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatearFechaLarga(alumno.fechaEgresoEstimada)}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              {editing && canEdit ? (
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Activo">Activo</option>
                  <option value="Graduado">Graduado</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              ) : (
                <dd className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alumno.estado === 'Activo' 
                      ? 'bg-green text-gray-900 dark:text-gray-900'
                      : alumno.estado === 'Graduado'
                      ? 'bg-yellow text-gray-900 dark:text-gray-900'
                      : 'bg-gray-700 text-white'
                  }`}>
                    {alumno.estado || 'N/A'}
                  </span>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Usuario de Classroom</dt>
              {editing && canEdit ? (
                <input
                  type="email"
                  value={formData.mailClassroom}
                  onChange={(e) => setFormData({ ...formData, mailClassroom: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="usuario@classroom.com"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono flex-1">
                      {alumno.mailClassroom || 'N/A'}
                    </span>
                    {alumno.mailClassroom && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(alumno.mailClassroom, 'Usuario de Classroom')}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue dark:hover:text-blue"
                        title="Copiar usuario"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contraseña de Classroom</dt>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.passwordClassroom}
                  onChange={(e) => setFormData({ ...formData, passwordClassroom: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Contraseña de Classroom"
                />
              ) : (
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono flex-1">
                      {showPassword ? (alumno.passwordClassroom || 'N/A') : (alumno.passwordClassroom ? '••••••••' : 'N/A')}
                    </span>
                    {alumno.passwordClassroom && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(alumno.passwordClassroom, 'Contraseña de Classroom')}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue dark:hover:text-blue"
                          title="Copiar contraseña"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </dd>
              )}
            </div>
          </dl>
        </div>

        {/* Gestión Académica */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gestión Académica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to={`/admin/alumno/${alumno.id}/materias`}
              className="flex items-center p-4 bg-blue/10 dark:bg-blue/20 rounded-lg hover:bg-blue/20 dark:hover:bg-blue/30 transition-colors"
            >
              <CalendarIcon className="w-6 h-6 text-blue mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Materias</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar calendario</p>
              </div>
            </Link>
            <Link
              to={`/admin/alumno/${alumno.id}/calificaciones`}
              className="flex items-center p-4 bg-yellow/10 dark:bg-yellow/20 rounded-lg hover:bg-yellow/20 dark:hover:bg-yellow/30 transition-colors"
            >
              <ChartBarIcon className="w-6 h-6 text-yellow mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Calificaciones</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar calificaciones</p>
              </div>
            </Link>
            <Link
              to={`/admin/alumno/${alumno.id}/graduacion`}
              className="flex items-center p-4 bg-green/10 dark:bg-green/20 rounded-lg hover:bg-green/20 dark:hover:bg-green/30 transition-colors"
            >
              <AcademicCapIcon className="w-6 h-6 text-green mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Graduación</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar graduación</p>
              </div>
            </Link>
            <Link
              to={`/admin/pagos?alumno=${alumno.id}`}
              className="flex items-center p-4 bg-blue/10 dark:bg-blue/20 rounded-lg hover:bg-blue/20 dark:hover:bg-blue/30 transition-colors border border-blue/20"
            >
              <CurrencyDollarIcon className="w-6 h-6 text-blue mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Pagos</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ver y gestionar pagos</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Vista Pública y Certificado */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Enlaces Públicos
          </h2>
          
          {/* Vista Pública */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Vista pública del perfil:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/public/alumno/${alumno.id}`}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
              />
              <Link
                to={`/public/alumno/${alumno.id}`}
                target="_blank"
                className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm whitespace-nowrap sm:flex-shrink-0"
              >
                Ver
              </Link>
            </div>
          </div>

          {/* Certificado Digital */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Certificado digital / Constancia de estudios:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/certificado/${alumno.id}`}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
              />
              <Link
                to={`/certificado/${alumno.id}`}
                target="_blank"
                className="px-4 py-2 bg-green text-gray-900 dark:text-gray-900 rounded-lg hover:bg-green/90 transition-colors text-sm whitespace-nowrap sm:flex-shrink-0"
              >
                Ver Certificado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumnoDetail;
