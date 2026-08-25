import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { getExpedienteDocsUrls } from '../services/expedienteService';
import { debePedirseExpediente } from '../utils/expediente';

const LABELS = {
  actaNacimiento: 'acta de nacimiento',
  comprobanteEstudios: 'comprobante de estudios',
  cedulaFiscal: 'constancia de situación fiscal',
  identificacionOficial: 'identificación oficial',
  comprobanteDomicilio: 'comprobante de domicilio',
  reglamentoFirmado: 'contrato firmado',
  comprobantePagoTransferencia: 'comprobante de pago',
};

/**
 * Aviso en el tablero cuando al alumno le faltan documentos del expediente.
 *
 * Existe porque el expediente podía quedar incompleto sin que nadie se
 * enterara: si el formulario de inscripción se abandonaba a media captura, los
 * documentos faltantes no se le reclamaban por ningún lado. Se mantiene
 * silencioso ante errores — es un recordatorio, no debe romper el tablero.
 *
 * Solo aplica a los alumnos dados de alta desde que el portal captura el
 * expediente; ver [[debePedirseExpediente]] en utils/expediente.
 */
const CAMPOS = {
  escolaridad: 'escolaridad',
  domicilio: 'domicilio',
  curpPasaporte: 'CURP o pasaporte',
  ocupacion: 'ocupación',
};

const AvisoDocumentosPendientes = () => {
  const { currentUser, userData } = useAuth();
  const [faltantes, setFaltantes] = useState([]);
  const [datosFaltantes, setDatosFaltantes] = useState([]);

  useEffect(() => {
    let cancelado = false;
    const revisar = async () => {
      if (!currentUser?.uid || userData?.rol !== 'alumno') return;
      // A los alumnos anteriores al portal no se les reclama el expediente:
      // ya lo entregaron en el sistema anterior.
      if (!debePedirseExpediente(userData)) return;
      try {
        const estado = await getExpedienteDocsUrls(currentUser.uid);
        if (cancelado) return;
        setFaltantes(estado.faltantes || []);
        setDatosFaltantes(estado.datosFaltantes || []);
      } catch {
        // Sin ruido: si no se puede consultar, simplemente no se avisa.
      }
    };
    revisar();
    return () => {
      cancelado = true;
    };
  }, [currentUser?.uid, userData]);

  const pendientes = faltantes.length + datosFaltantes.length;
  if (pendientes === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-1">
            Tu expediente está incompleto
          </h2>
          <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mb-3">
            {faltantes.length > 0 && (
              <>
                Nos {faltantes.length === 1 ? 'falta tu' : 'faltan tus'}{' '}
                {faltantes.map((t) => LABELS[t] || t).join(', ')}.{' '}
              </>
            )}
            {datosFaltantes.length > 0 && (
              <>
                Falta capturar {datosFaltantes.map((c) => CAMPOS[c] || c).join(', ')}.{' '}
              </>
            )}
            Puedes completarlo tú desde tu expediente, sin trámites ni correos.
          </p>
          <Link
            to="/expediente"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
          >
            Completar mi expediente
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AvisoDocumentosPendientes;
