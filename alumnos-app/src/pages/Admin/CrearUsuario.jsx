import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { crearUsuarioAlumno } from '../../services/adminService';
import { UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const CrearUsuario = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    nivel: '',
    fechaIngreso: '',
    fechaEgresoEstimada: '',
    estado: 'Activo',
    enviarEmailBienvenida: true,
  });

  const niveles = [
    'Propedéutico',
    'Nido & Comunidad infantil',
    'Casa de Niños',
    'Taller'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generarPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const resultado = await crearUsuarioAlumno({
        nombre: formData.nombreCompleto,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono,
        nivel: formData.nivel,
        fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0],
        fechaEgresoEstimada: formData.fechaEgresoEstimada,
        estado: formData.estado,
        creadoPor: currentUser?.uid,
      });

      if (resultado.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setError(resultado.error || 'Error al crear el usuario');
      }
    } catch (error) {
      setError(error.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-green text-white rounded-lg p-8 text-center">
          <UserPlusIcon className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Usuario creado exitosamente!</h2>
          <p className="mb-4">El alumno ha sido registrado correctamente.</p>
          <Link
            to="/admin"
            className="inline-block px-6 py-2 bg-white text-green rounded-lg hover:bg-gray-100 transition-colors"
          >
            Volver al Panel
          </Link>
        </div>
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

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Alumno
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Registra un nuevo alumno en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 space-y-6">
        {error && (
          <div className="bg-red-light border border-red rounded-md p-3 text-red text-sm">
            {error}
          </div>
        )}

        {/* Información Básica */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                name="nombreCompleto"
                required
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez García"
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mail de contacto *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono de contacto *
              </label>
              <input
                type="tel"
                name="telefono"
                required
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 5512345678"
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel *
              </label>
              <select
                name="nivel"
                required
                value={formData.nivel}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              >
                <option value="">Selecciona un nivel</option>
                {niveles.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de ingreso *
              </label>
              <input
                type="date"
                name="fechaIngreso"
                required
                value={formData.fechaIngreso}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha estimada de egreso *
              </label>
              <input
                type="date"
                name="fechaEgresoEstimada"
                required
                value={formData.fechaEgresoEstimada}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                name="estado"
                required
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Graduado">Graduado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Credenciales de Acceso */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Credenciales de Acceso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña *
                <button
                  type="button"
                  onClick={generarPassword}
                  className="ml-2 text-xs text-blue hover:underline"
                >
                  Generar automática
                </button>
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue transition-all duration-200"
              />
            </div>
          </div>
        </section>

        {/* Opciones */}
        <section>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="enviarEmailBienvenida"
              checked={formData.enviarEmailBienvenida}
              onChange={handleChange}
              className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Enviar email de bienvenida con instrucciones para cambiar contraseña
            </label>
          </div>
        </section>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 sm:py-3 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium shadow-sm hover:shadow-md flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Crear Usuario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearUsuario;
