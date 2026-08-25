import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import {
  ArrowLeftIcon,
  MegaphoneIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';
import { formatearFechaLarga } from '../../utils/formatearFecha';
import {
  DESTINO_TODOS,
  DESTINO_ALUMNO,
  TIPOS_MENSAJE,
  crearMensaje,
  obtenerMensajes,
  cambiarEstadoMensaje,
  eliminarMensaje,
  mensajeVigente,
  fechaFinDesdeInput,
  aFecha
} from '../../services/mensajesService';

const FORM_INICIAL = {
  destino: DESTINO_TODOS,
  alumnoId: '',
  titulo: '',
  cuerpo: '',
  tipo: 'info',
  fechaFin: ''
};

/**
 * Publicación de mensajes de administración hacia el tablero de los alumnos.
 * Vive en su propia página en vez de dentro de AlumnoDetail, que ya es un
 * archivo muy grande, y así se atienden igual los avisos generales.
 */
const Mensajes = () => {
  const canEdit = useCanEdit();
  const { currentUser } = useAuth();
  const { success, error: showError, confirm } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [mensajes, setMensajes] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState(null);

  const cargarMensajes = useCallback(async () => {
    const resultado = await obtenerMensajes();
    if (resultado.success) {
      setMensajes(resultado.mensajes);
    } else {
      showError('No se pudieron cargar los mensajes');
    }
  }, [showError]);

  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      try {
        const alumnosSnapshot = await getDocs(
          query(collection(db, 'alumnos'), orderBy('nombre', 'asc'))
        );
        setAlumnos(
          alumnosSnapshot.docs.map((alumnoDoc) => ({
            id: alumnoDoc.id,
            nombre: alumnoDoc.data().nombre || '(sin nombre)',
            matricula: alumnoDoc.data().matricula || ''
          }))
        );
      } catch (error) {
        console.error('Error al cargar los alumnos:', error);
        showError('No se pudo cargar la lista de alumnos');
      }
      await cargarMensajes();
      setLoading(false);
    };
    cargarTodo();
  }, [cargarMensajes, showError]);

  const alumnosFiltrados = useMemo(() => {
    const termino = busquedaAlumno.trim().toLowerCase();
    if (!termino) return alumnos;
    return alumnos.filter(
      (alumno) =>
        alumno.nombre.toLowerCase().includes(termino) ||
        alumno.matricula.toString().toLowerCase().includes(termino)
    );
  }, [alumnos, busquedaAlumno]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previo) => ({ ...previo, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setGuardando(true);
    try {
      const alumno = alumnos.find((a) => a.id === formData.alumnoId);
      const resultado = await crearMensaje(
        {
          ...formData,
          alumnoNombre: alumno?.nombre || '',
          fechaFin: fechaFinDesdeInput(formData.fechaFin)
        },
        currentUser?.uid || null
      );

      if (resultado.success) {
        success('Mensaje publicado');
        setFormData(FORM_INICIAL);
        setBusquedaAlumno('');
        await cargarMensajes();
      } else {
        showError(resultado.error || 'No se pudo publicar el mensaje');
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (mensaje) => {
    if (!canEdit) return;
    setProcesando(mensaje.id);
    const resultado = await cambiarEstadoMensaje(mensaje.id, !mensaje.activo);
    if (resultado.success) {
      success(mensaje.activo ? 'Mensaje desactivado' : 'Mensaje reactivado');
      await cargarMensajes();
    } else {
      showError('No se pudo cambiar el estado del mensaje');
    }
    setProcesando(null);
  };

  const handleEliminar = async (mensaje) => {
    if (!canEdit) return;
    const confirmado = await confirm(
      `¿Eliminar el mensaje "${mensaje.titulo}"? Esta acción no se puede deshacer.`,
      { title: 'Eliminar mensaje', confirmText: 'Eliminar' }
    );
    if (!confirmado) return;

    setProcesando(mensaje.id);
    const resultado = await eliminarMensaje(mensaje.id);
    if (resultado.success) {
      success('Mensaje eliminado');
      await cargarMensajes();
    } else {
      showError('No se pudo eliminar el mensaje');
    }
    setProcesando(null);
  };

  const estadoDe = (mensaje) => {
    if (!mensaje.activo) return { texto: 'Desactivado', clase: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' };
    if (!mensajeVigente(mensaje)) return { texto: 'Caducado', clase: 'bg-yellow/20 text-yellow-800 dark:text-yellow-200' };
    return { texto: 'Visible', clase: 'bg-green/20 text-green-800 dark:text-green-200' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="xl" variant="montessori" message="Cargando mensajes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          to="/admin"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Volver al panel"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Mensajes a alumnos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lo que publiques aquí lo verá el alumno en su tablero al iniciar sesión.
          </p>
        </div>
      </div>

      {canEdit && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-blue" />
            Nuevo mensaje
          </h2>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destinatario
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="destino"
                  value={DESTINO_TODOS}
                  checked={formData.destino === DESTINO_TODOS}
                  onChange={handleChange}
                />
                Todos los alumnos
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="destino"
                  value={DESTINO_ALUMNO}
                  checked={formData.destino === DESTINO_ALUMNO}
                  onChange={handleChange}
                />
                Un alumno en particular
              </label>
            </div>
          </div>

          {formData.destino === DESTINO_ALUMNO && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={busquedaAlumno}
                onChange={(e) => setBusquedaAlumno(e.target.value)}
                placeholder="Buscar por nombre o matrícula"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                name="alumnoId"
                value={formData.alumnoId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecciona un alumno</option>
                {alumnosFiltrados.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre}
                    {alumno.matricula ? ` — ${alumno.matricula}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              id="titulo"
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              maxLength={120}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="cuerpo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje
            </label>
            <textarea
              id="cuerpo"
              name="cuerpo"
              value={formData.cuerpo}
              onChange={handleChange}
              rows={4}
              maxLength={2000}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {TIPOS_MENSAJE.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Se deja de mostrar el (opcional)
              </label>
              <input
                id="fechaFin"
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-blue text-white font-semibold hover:bg-blue/90 disabled:opacity-60"
          >
            {guardando ? 'Publicando...' : 'Publicar mensaje'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mensajes publicados
        </h2>

        {mensajes.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 py-6 text-center">
            Todavía no has publicado ningún mensaje.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {mensajes.map((mensaje) => {
              const estado = estadoDe(mensaje);
              const fin = aFecha(mensaje.fechaFin);
              return (
                <li key={mensaje.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estado.clase}`}>
                        {estado.texto}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {mensaje.destino === DESTINO_ALUMNO ? (
                          <>
                            <UserIcon className="w-4 h-4" />
                            {mensaje.alumnoNombre || 'Alumno'}
                          </>
                        ) : (
                          <>
                            <UserGroupIcon className="w-4 h-4" />
                            Todos los alumnos
                          </>
                        )}
                      </span>
                      {mensaje.tipo === 'importante' && (
                        <span className="text-xs font-semibold text-red">Importante</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{mensaje.titulo}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {mensaje.cuerpo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {mensaje.creadoEn && <>Publicado el {formatearFechaLarga(mensaje.creadoEn)}. </>}
                      {fin && <>Se deja de mostrar el {formatearFechaLarga(fin)}. </>}
                      {mensaje.lecturas === 1
                        ? '1 alumno ya lo cerró.'
                        : `${mensaje.lecturas || 0} alumnos ya lo cerraron.`}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCambiarEstado(mensaje)}
                        disabled={procesando === mensaje.id}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                        title={mensaje.activo ? 'Desactivar' : 'Reactivar'}
                      >
                        {mensaje.activo ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(mensaje)}
                        disabled={procesando === mensaje.id}
                        className="p-2 rounded-lg text-red hover:bg-red/10 disabled:opacity-60"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Mensajes;
