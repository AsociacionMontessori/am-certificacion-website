import { useState, useEffect, useCallback } from 'react';
import { ChatBubbleLeftRightIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import useCanEdit from '../hooks/useCanEdit';
import MensajesPlantillas from './MensajesPlantillas';
import { formatearFechaLarga } from '../utils/formatearFecha';
import {
  DESTINO_ALUMNO,
  TIPOS_MENSAJE,
  crearMensaje,
  obtenerMensajesDeAlumno,
  cambiarEstadoMensaje,
  eliminarMensaje,
  mensajeVigente,
  fechaFinDesdeInput,
  aFecha
} from '../services/mensajesService';

const FORM_INICIAL = { titulo: '', cuerpo: '', tipo: 'info', fechaFin: '' };

/**
 * Mensajes dirigidos a un alumno, dentro de su propia ficha.
 *
 * Vive aquí porque la necesidad de escribirle nace mientras administración
 * revisa su expediente; obligar a ir a otra pantalla y volver a buscarlo era
 * trabajo de más. Los avisos para todos siguen en /admin/mensajes.
 */
const MensajesDelAlumno = ({ alumnoId, alumnoNombre }) => {
  const canEdit = useCanEdit();
  const { currentUser } = useAuth();
  const { success, error: showError, confirm } = useNotifications();

  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState(null);

  const cargar = useCallback(async () => {
    const resultado = await obtenerMensajesDeAlumno(alumnoId);
    if (resultado.success) {
      setMensajes(resultado.mensajes);
    } else {
      showError('No se pudieron cargar los mensajes del alumno');
    }
    setCargando(false);
  }, [alumnoId, showError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previo) => ({ ...previo, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setGuardando(true);
    try {
      const resultado = await crearMensaje(
        {
          ...formData,
          destino: DESTINO_ALUMNO,
          alumnoId,
          alumnoNombre: alumnoNombre || '',
          fechaFin: fechaFinDesdeInput(formData.fechaFin)
        },
        currentUser?.uid || null
      );

      if (resultado.success) {
        success('Mensaje enviado al alumno');
        setFormData(FORM_INICIAL);
        await cargar();
      } else {
        showError(resultado.error || 'No se pudo enviar el mensaje');
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
      await cargar();
    } else {
      showError('No se pudo cambiar el estado del mensaje');
    }
    setProcesando(null);
  };

  const handleEliminar = async (mensaje) => {
    if (!canEdit) return;
    const confirmado = await confirm(
      `¿Eliminar el mensaje "${mensaje.titulo}"? Esta acción no se puede deshacer.`,
      { title: 'Eliminar mensaje', type: 'danger', confirmText: 'Sí, eliminar', cancelText: 'Cancelar' }
    );
    if (!confirmado) return;

    setProcesando(mensaje.id);
    const resultado = await eliminarMensaje(mensaje.id);
    if (resultado.success) {
      success('Mensaje eliminado');
      await cargar();
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

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue" />
        Mensajes para este alumno
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Los verá en su tablero al iniciar sesión. Para un aviso dirigido a todos, usa la sección Mensajes del menú.
      </p>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <MensajesPlantillas
            valores={{ titulo: formData.titulo, cuerpo: formData.cuerpo, tipo: formData.tipo }}
            onUsar={(plantilla) => setFormData((previo) => ({ ...previo, ...plantilla }))}
          />
          <div>
            <label htmlFor="mensaje-titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              id="mensaje-titulo"
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
            <label htmlFor="mensaje-cuerpo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje
            </label>
            <textarea
              id="mensaje-cuerpo"
              name="cuerpo"
              value={formData.cuerpo}
              onChange={handleChange}
              rows={3}
              maxLength={2000}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mensaje-tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                id="mensaje-tipo"
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
              <label htmlFor="mensaje-fecha-fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Se deja de mostrar el (opcional)
              </label>
              <input
                id="mensaje-fecha-fin"
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
            {guardando ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      )}

      {cargando ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
      ) : mensajes.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Todavía no le has enviado ningún mensaje.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700 border-t border-gray-100 dark:border-gray-700">
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {mensaje.cerrado ? 'Ya lo leyó' : 'Sin leer'}
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
                    {mensaje.creadoEn && <>Enviado el {formatearFechaLarga(mensaje.creadoEn)}. </>}
                    {fin && <>Se deja de mostrar el {formatearFechaLarga(fin)}.</>}
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
                      {mensaje.activo ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
  );
};

export default MensajesDelAlumno;
