import { useState, useEffect, useCallback } from 'react';
import { MegaphoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import {
  obtenerMensajesParaAlumno,
  marcarMensajeCerrado,
  aFecha
} from '../services/mensajesService';
import { formatearFechaLarga } from '../utils/formatearFecha';

/**
 * Mensajes que administración le publica al alumno, arriba de su tablero.
 *
 * Existe porque avisar por correo o WhatsApp no garantiza que el alumno se
 * entere: aquí lo ve al iniciar sesión. Cerrarlo deja un acuse en Firestore,
 * así que no reaparece ni siquiera desde otro dispositivo. Silencioso ante
 * errores: es un aviso, no debe tumbar el tablero.
 */
const AvisosDelAdmin = () => {
  const { currentUser, userData } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [cerrando, setCerrando] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (!currentUser?.uid || userData?.rol !== 'alumno') return;
      try {
        const pendientes = await obtenerMensajesParaAlumno(currentUser.uid);
        if (!cancelado) setMensajes(pendientes);
      } catch {
        // Sin ruido: si no se pueden consultar, simplemente no se muestran.
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [currentUser?.uid, userData?.rol]);

  const handleCerrar = useCallback(async (mensajeId) => {
    setCerrando(mensajeId);
    await marcarMensajeCerrado(mensajeId, currentUser?.uid);
    setMensajes((previos) => previos.filter((mensaje) => mensaje.id !== mensajeId));
    setCerrando(null);
  }, [currentUser?.uid]);

  if (mensajes.length === 0) return null;

  return (
    <div className="space-y-4">
      {mensajes.map((mensaje) => {
        const esImportante = mensaje.tipo === 'importante';
        const Icono = esImportante ? ExclamationTriangleIcon : MegaphoneIcon;
        const fecha = aFecha(mensaje.creadoEn);

        return (
          <div
            key={mensaje.id}
            className={`${
              esImportante
                ? 'bg-red/10 dark:bg-red/20 border-red/30 dark:border-red/40'
                : 'bg-blue/10 dark:bg-blue/20 border-blue/30 dark:border-blue/40'
            } border rounded-xl p-5 sm:p-6`}
          >
            <div className="flex items-start gap-3">
              <Icono
                className={`h-6 w-6 shrink-0 ${esImportante ? 'text-red' : 'text-blue'}`}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {mensaje.titulo}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line mb-3">
                  {mensaje.cuerpo}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCerrar(mensaje.id)}
                    disabled={cerrando === mensaje.id}
                    className={`inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-60 ${
                      esImportante ? 'bg-red hover:bg-red/90' : 'bg-blue hover:bg-blue/90'
                    }`}
                  >
                    {cerrando === mensaje.id ? 'Guardando...' : 'Entendido'}
                  </button>
                  {fecha && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Publicado el {formatearFechaLarga(fecha)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AvisosDelAdmin;
