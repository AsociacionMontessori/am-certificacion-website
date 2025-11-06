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
    // Información básica
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Información académica
    matricula: '',
    programa: '',
    cohorte: '',
    nivelEducativo: '',
    fechaIngreso: '',
    estado: 'Activo',
    
    // Información de contacto
    telefono: '',
    direccion: '',
    ciudad: '',
    estadoDireccion: '',
    codigoPostal: '',
    
    // Privacidad
    mostrarEmail: false,
    mostrarTelefono: false,
    nombrePublico: '',
    
    // Opciones
    enviarEmailBienvenida: true,
  });

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
        ...formData,
        creadoPor: currentUser?.uid,
        fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0],
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Alumno
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Registra un nuevo alumno en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-light border border-red rounded-md p-3 text-red text-sm">
            {error}
          </div>
        )}

        {/* Información Básica */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
        </section>

        {/* Información Académica */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Académica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Matrícula
              </label>
              <input
                type="text"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Programa *
              </label>
              <select
                name="programa"
                required
                value={formData.programa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="">Selecciona un programa</option>
                <option value="Diplomado Guía Montessori">Diplomado Guía Montessori</option>
                <option value="Certificación Internacional">Certificación Internacional</option>
                <option value="Masterclass">Masterclass</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cohorte
              </label>
              <input
                type="text"
                name="cohorte"
                value={formData.cohorte}
                onChange={handleChange}
                placeholder="Ej: 2024-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nivel Educativo
              </label>
              <select
                name="nivelEducativo"
                value={formData.nivelEducativo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="">Selecciona</option>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Maestría">Maestría</option>
                <option value="Doctorado">Doctorado</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                name="fechaIngreso"
                value={formData.fechaIngreso}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado *
              </label>
              <select
                name="estado"
                required
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Graduado">Graduado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Información de Contacto */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información de Contacto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <input
                type="text"
                name="estadoDireccion"
                value={formData.estadoDireccion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
        </section>

        {/* Configuración de Privacidad */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Configuración de Privacidad
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="mostrarEmail"
                checked={formData.mostrarEmail}
                onChange={handleChange}
                className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Permitir que el email sea visible en el perfil público
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="mostrarTelefono"
                checked={formData.mostrarTelefono}
                onChange={handleChange}
                className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Permitir que el teléfono sea visible en el perfil público
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre para mostrar públicamente (opcional)
              </label>
              <input
                type="text"
                name="nombrePublico"
                value={formData.nombrePublico}
                onChange={handleChange}
                placeholder="Dejar vacío para usar nombre completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
        </section>

        {/* Opciones */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Opciones
          </h2>
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
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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

