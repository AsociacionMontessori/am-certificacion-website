import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  getExpedienteDocsUrls,
  guardarDatosExpediente,
  ESCOLARIDAD_OPCIONES,
} from '../services/expedienteService';

const CAMPOS = {
  escolaridad: 'Escolaridad',
  domicilio: 'Domicilio particular',
  curpPasaporte: 'CURP o pasaporte',
  ocupacion: 'Ocupación actual',
};

const VACIO = {
  escolaridad: '',
  domicilio: '',
  curpPasaporte: '',
  ocupacion: '',
  empresa: '',
  telefonoEmpresa: '',
};

/**
 * Datos administrativos del expediente.
 *
 * Los pedía la parte 2 del formulario de inscripción; quien no lo terminó se
 * quedó sin ellos y no había forma de aportarlos después. Aquí los captura el
 * propio alumno o administración por él.
 */
const ExpedienteDatos = ({ alumnoId, onGuardado }) => {
  const [form, setForm] = useState(VACIO);
  const [faltantes, setFaltantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (!alumnoId) return;
      setCargando(true);
      try {
        const estado = await getExpedienteDocsUrls(alumnoId);
        if (cancelado) return;
        setForm({ ...VACIO, ...(estado.datos || {}) });
        setFaltantes(estado.datosFaltantes || []);
      } catch (e) {
        if (!cancelado) setError(e.message || 'No se pudieron cargar los datos');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [alumnoId]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setExito('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);
    try {
      const r = await guardarDatosExpediente(alumnoId, form);
      setFaltantes([]);
      setExito(
        r.expedienteCompleto
          ? '¡Listo! Tu expediente quedó completo.'
          : 'Datos guardados. Aún faltan documentos por subir.',
      );
      onGuardado?.();
    } catch (e2) {
      setError(e2.message || 'No se pudieron guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  const input =
    'w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm';
  const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (cargando) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando datos…</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Datos del expediente
      </h2>

      {faltantes.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
          <span>
            Falta capturar: {faltantes.map((c) => CAMPOS[c] || c).join(', ')}.
          </span>
        </div>
      )}

      {exito && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-300">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>{exito}</span>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className={label} htmlFor="exp-escolaridad">Escolaridad *</label>
          <select
            id="exp-escolaridad"
            name="escolaridad"
            required
            value={form.escolaridad}
            onChange={cambiar}
            className={input}
          >
            <option value="">Selecciona…</option>
            {ESCOLARIDAD_OPCIONES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="exp-domicilio">Domicilio particular *</label>
          <textarea
            id="exp-domicilio"
            name="domicilio"
            required
            rows={2}
            value={form.domicilio}
            onChange={cambiar}
            className={input}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="exp-curp">CURP o pasaporte *</label>
            <input
              id="exp-curp"
              name="curpPasaporte"
              required
              value={form.curpPasaporte}
              onChange={cambiar}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="exp-ocupacion">Ocupación actual *</label>
            <input
              id="exp-ocupacion"
              name="ocupacion"
              required
              value={form.ocupacion}
              onChange={cambiar}
              className={input}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="exp-empresa">Empresa (opcional)</label>
            <input
              id="exp-empresa"
              name="empresa"
              value={form.empresa}
              onChange={cambiar}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="exp-telempresa">Teléfono de empresa (opcional)</label>
            <input
              id="exp-telempresa"
              name="telefonoEmpresa"
              value={form.telefonoEmpresa}
              onChange={cambiar}
              className={input}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="min-h-[44px] px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar datos'}
        </button>
      </form>
    </div>
  );
};

export default ExpedienteDatos;
