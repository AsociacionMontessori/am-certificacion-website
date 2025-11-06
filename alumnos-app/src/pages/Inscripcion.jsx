import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Inscripcion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Información Personal
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    lugarNacimiento: '',
    curp: '',
    rfc: '',
    
    // Contacto
    email: '',
    telefono: '',
    telefonoAlternativo: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    
    // Información Académica
    programa: '',
    cohorte: '',
    nivelEducativo: '',
    institucionAnterior: '',
    
    // Documentos
    comprobantePago: null,
    identificacion: null,
    actaNacimiento: null,
    certificadoEstudios: null,
    
    // Privacidad
    mostrarEmail: false,
    mostrarTelefono: false,
    nombrePublico: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combinar nombre completo
      const nombreCompleto = `${formData.nombre} ${formData.apellidoPaterno} ${formData.apellidoMaterno}`.trim();

      // Crear documento en Firestore
      const inscripcionData = {
        nombre: nombreCompleto,
        nombrePublico: formData.nombrePublico || nombreCompleto,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : null,
        lugarNacimiento: formData.lugarNacimiento,
        curp: formData.curp,
        rfc: formData.rfc,
        email: formData.email,
        telefono: formData.telefono,
        telefonoAlternativo: formData.telefonoAlternativo,
        direccion: formData.direccion,
        colonia: formData.colonia,
        ciudad: formData.ciudad,
        estado: formData.estado,
        codigoPostal: formData.codigoPostal,
        programa: formData.programa,
        cohorte: formData.cohorte,
        nivelEducativo: formData.nivelEducativo,
        institucionAnterior: formData.institucionAnterior,
        mostrarEmail: formData.mostrarEmail,
        mostrarTelefono: formData.mostrarTelefono,
        estadoInscripcion: 'Pendiente', // Estado inicial de la inscripción
        fechaInscripcion: new Date(),
        fechaIngreso: null,
        matricula: null, // Se asignará después por admin
      };

      await addDoc(collection(db, 'inscripciones'), inscripcionData);

      // TODO: Subir archivos a Firebase Storage si es necesario

      alert('¡Inscripción enviada exitosamente! Te contactaremos pronto.');
      navigate('/');
    } catch (error) {
      console.error('Error al enviar inscripción:', error);
      alert('Error al enviar la inscripción. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-blue mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Formulario de Inscripción
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Completa todos los campos para inscribirte en nuestros programas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Personal */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
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
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    name="apellidoPaterno"
                    required
                    value={formData.apellidoPaterno}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    required
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CURP
                  </label>
                  <input
                    type="text"
                    name="curp"
                    value={formData.curp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Información de Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    required
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
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
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
                    Programa de Interés *
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
              </div>
            </section>

            {/* Privacidad */}
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
                    Permitir que mi email sea visible en mi perfil público
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
                    Permitir que mi teléfono sea visible en mi perfil público
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

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Inscripción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Inscripcion;

