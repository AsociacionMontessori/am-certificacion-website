import { useState, useEffect, useCallback } from 'react';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import useCanEdit from '../hooks/useCanEdit';
import { obtenerPlantillas, guardarPlantilla, eliminarPlantilla } from '../services/mensajesService';

/**
 * Selector de mensajes reutilizables sobre un formulario de mensaje.
 *
 * Lo usan tanto la caja de la ficha del alumno como los avisos generales: se
 * elige un texto guardado, se rellena el formulario y de ahí se ajusta lo que
 * haga falta sin tocar la plantilla.
 */
const MensajesPlantillas = ({ valores, onUsar }) => {
  const canEdit = useCanEdit();
  const { currentUser } = useAuth();
  const { success, error: showError, confirm } = useNotifications();

  const [plantillas, setPlantillas] = useState([]);
  const [seleccionada, setSeleccionada] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const resultado = await obtenerPlantillas();
    if (resultado.success) {
      setPlantillas(resultado.plantillas);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleUsar = (e) => {
    const plantillaId = e.target.value;
    setSeleccionada(plantillaId);
    const plantilla = plantillas.find((item) => item.id === plantillaId);
    if (plantilla) {
      onUsar({
        titulo: plantilla.titulo || '',
        cuerpo: plantilla.cuerpo || '',
        tipo: plantilla.tipo || 'info'
      });
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const resultado = await guardarPlantilla(valores, currentUser?.uid || null);
      if (resultado.success) {
        success(resultado.actualizada ? 'Mensaje guardado actualizado' : 'Mensaje guardado para reutilizarlo');
        await cargar();
      } else {
        showError(resultado.error || 'No se pudo guardar el mensaje');
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    const plantilla = plantillas.find((item) => item.id === seleccionada);
    if (!plantilla) return;

    const confirmado = await confirm(
      `¿Eliminar el mensaje guardado "${plantilla.titulo}"? Los mensajes ya enviados no se tocan.`,
      { title: 'Eliminar mensaje guardado', type: 'danger', confirmText: 'Sí, eliminar', cancelText: 'Cancelar' }
    );
    if (!confirmado) return;

    const resultado = await eliminarPlantilla(plantilla.id);
    if (resultado.success) {
      success('Mensaje guardado eliminado');
      setSeleccionada('');
      await cargar();
    } else {
      showError('No se pudo eliminar el mensaje guardado');
    }
  };

  if (!canEdit) return null;

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="plantilla-mensaje" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Usar un mensaje guardado
          </label>
          <select
            id="plantilla-mensaje"
            value={seleccionada}
            onChange={handleUsar}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">
              {plantillas.length === 0 ? 'Todavía no guardas ninguno' : 'Escribir desde cero'}
            </option>
            {plantillas.map((plantilla) => (
              <option key={plantilla.id} value={plantilla.id}>
                {plantilla.titulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-blue text-blue text-sm font-semibold hover:bg-blue/10 disabled:opacity-60"
            title="Guarda el texto que tienes escrito para volver a usarlo"
          >
            <BookmarkIcon className="w-5 h-5" />
            {guardando ? 'Guardando...' : 'Guardar este texto'}
          </button>
          {seleccionada && (
            <button
              type="button"
              onClick={handleEliminar}
              className="p-2 rounded-lg text-red hover:bg-red/10"
              title="Eliminar el mensaje guardado seleccionado"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Al elegir uno se llena el formulario; lo que edites aquí no cambia el mensaje guardado.
        Guardar con un título que ya existe lo actualiza.
      </p>
    </div>
  );
};

export default MensajesPlantillas;
