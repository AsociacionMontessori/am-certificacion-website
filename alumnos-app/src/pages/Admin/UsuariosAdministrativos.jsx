import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { ClipboardDocumentIcon, ArrowLeftIcon, IdentificationIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotifications } from '../../contexts/NotificationContext';
import useCanEdit from '../../hooks/useCanEdit';
import { useAuth } from '../../contexts/AuthContext';

const rolesConfiguracion = [
  {
    clave: 'admins',
    titulo: 'Administradores',
    descripcion: 'Usuarios con acceso total al panel y permisos de edición.',
    badgeColor: 'bg-blue/10 text-blue border-blue/30',
    iconColor: 'text-blue',
    icon: IdentificationIcon,
  },
  {
    clave: 'directivos',
    titulo: 'Directivos',
    descripcion: 'Usuarios con acceso de solo lectura para supervisión académica.',
    badgeColor: 'bg-green/10 text-green border-green/30',
    iconColor: 'text-green',
    icon: UserGroupIcon,
  },
  {
    clave: 'catedraticos',
    titulo: 'Catedráticos',
    descripcion: 'Docentes con acceso de consulta para seguimiento académico.',
    badgeColor: 'bg-yellow/10 text-yellow border-yellow/30',
    iconColor: 'text-yellow',
    icon: UserGroupIcon,
  },
];

const convertirFechaRegistro = (valor) => {
  if (!valor) {
    return null;
  }
  if (typeof valor.toDate === 'function') {
    return valor.toDate();
  }
  if (valor instanceof Date) {
    return valor;
  }
  if (typeof valor.seconds === 'number') {
    return new Date(valor.seconds * 1000);
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const UsuariosAdministrativos = () => {
  const [usuarios, setUsuarios] = useState({ admins: [], directivos: [], catedraticos: [] });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const { success, prompt: showPrompt } = useNotifications();
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { loading: authLoading, userData } = useAuth();

  useEffect(() => {
    if (!authLoading && (!canEdit || userData?.rol !== 'admin')) {
      navigate('/admin');
    }
  }, [authLoading, canEdit, userData, navigate]);

  useEffect(() => {
    if (authLoading || !canEdit || userData?.rol !== 'admin') {
      return;
    }

    let activo = true;
    const cargarUsuarios = async () => {
      setLoading(true);
      setError('');
      try {
        const resultados = {};

        await Promise.all(
          rolesConfiguracion.map(async (rol) => {
            const snapshot = await getDocs(collection(db, rol.clave));
            if (!activo) {
              return;
            }
            resultados[rol.clave] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
          })
        );

        if (activo) {
          setUsuarios({
            admins: resultados.admins || [],
            directivos: resultados.directivos || [],
            catedraticos: resultados.catedraticos || [],
          });
        }
      } catch (error) {
        console.error('Error al cargar usuarios administrativos:', error);
        if (activo) {
          setError('No fue posible cargar los usuarios administrativos. Verifica los permisos de lectura de Firestore.');
          setUsuarios({ admins: [], directivos: [], catedraticos: [] });
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarUsuarios();

    return () => {
      activo = false;
    };
  }, [authLoading, canEdit, userData]);

  const handleCopyToClipboard = async (texto, tipo = '') => {
    if (!texto) {
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      success(`${tipo ? `${tipo} ` : ''}copiado al portapapeles`);
    } catch (error) {
      console.error('Error al copiar:', error);
      await showPrompt(`Copia este ${tipo || 'texto'} manualmente:`, {
        defaultValue: texto,
        title: 'Copiar al portapapeles',
      });
    }
  };

  const resumen = useMemo(() => {
    const total = Object.values(usuarios).reduce((acc, lista) => acc + lista.length, 0);
    return {
      total,
      admins: usuarios.admins.length,
      directivos: usuarios.directivos.length,
      catedraticos: usuarios.catedraticos.length,
    };
  }, [usuarios]);

  const filtrarLista = (lista) => {
    if (!busqueda.trim()) {
      return lista;
    }
    const termino = busqueda.trim().toLowerCase();
    return lista.filter((usuario) => {
      return (
        usuario.nombre?.toLowerCase().includes(termino) ||
        usuario.email?.toLowerCase().includes(termino) ||
        usuario.telefono?.toLowerCase().includes(termino)
      );
    });
  };

  if (!canEdit || userData?.rol !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="montessori" message="Cargando usuarios..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin" className="inline-flex items-center text-blue hover:text-blue/80 text-sm mb-3">
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Volver al panel
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Usuarios Administrativos
            </h1>
            <p className="mt-2 text-sm text-red font-semibold">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center text-blue hover:text-blue/80 text-sm mb-3">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Volver al panel
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Usuarios Administrativos
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Consulta a los usuarios con permisos especiales dentro del portal: administradores, directivos y catedráticos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumenCard titulo="Total" valor={resumen.total} descripcion="Usuarios administrativos registrados" colorClass="bg-blue/10 text-blue" />
        <ResumenCard titulo="Administradores" valor={resumen.admins} descripcion="Control total" colorClass="bg-blue/10 text-blue" />
        <ResumenCard titulo="Directivos" valor={resumen.directivos} descripcion="Solo lectura" colorClass="bg-green/10 text-green" />
        <ResumenCard titulo="Catedráticos" valor={resumen.catedraticos} descripcion="Seguimiento académico" colorClass="bg-yellow/10 text-yellow" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Búsqueda rápida
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filtra por nombre, correo o teléfono
            </p>
          </div>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full sm:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          />
        </div>

        <div className="space-y-8">
          {rolesConfiguracion.map((rol) => {
            const usuariosRol = filtrarLista(usuarios[rol.clave] || []);
            const Icono = rol.icon;

            return (
              <section key={rol.clave} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border ${rol.badgeColor}`}>
                      <Icono className={`w-5 h-5 ${rol.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rol.titulo}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rol.descripcion}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {usuariosRol.length} usuario(s)
                  </span>
                </div>

                {usuariosRol.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron usuarios para este rol.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {usuariosRol.map((usuario) => (
                      <article
                        key={`${rol.clave}-${usuario.id}`}
                        className="flex flex-col gap-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4"
                      >
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {usuario.nombre || 'Sin nombre'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            ID: {usuario.id}
                          </p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <p className="flex items-center justify-between gap-2">
                            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Correo</span>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(usuario.email, 'Email')}
                              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Copiar email"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </p>
                          <p className="font-medium break-words">
                            {usuario.email || 'Sin correo registrado'}
                          </p>
                          {usuario.telefono && (
                            <p>
                              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Teléfono</span>
                              <span className="block font-medium">{usuario.telefono}</span>
                            </p>
                          )}
                          {usuario.activo === false && (
                            <p className="text-xs font-semibold text-red">Cuenta desactivada</p>
                          )}
                          {usuario.fechaCreacion && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Registrado el{' '}
                              {(() => {
                                const fecha = convertirFechaRegistro(usuario.fechaCreacion);
                                return fecha
                                  ? fecha.toLocaleDateString('es-MX', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : 'Fecha desconocida';
                              })()}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ResumenCard = ({ titulo, valor, descripcion, colorClass }) => (
  <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-2 ${colorClass.includes('bg-') ? '' : ''}`}>
    <p className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>{titulo}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{valor}</p>
    <p className="text-xs text-gray-600 dark:text-gray-400">{descripcion}</p>
  </div>
);

export default UsuariosAdministrativos;
