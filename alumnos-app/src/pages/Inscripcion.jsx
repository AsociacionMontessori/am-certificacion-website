import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Inscripcion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    nivel: '',
    fechaIngreso: '',
    fechaEgresoEstimada: '',
  });

  const niveles = [
    'Propedéutico',
    'Nido & Comunidad infantil',
    'Casa de Niños',
    'Taller'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear documento en Firestore
      const inscripcionData = {
        nombre: formData.nombreCompleto,
        email: formData.email,
        telefono: formData.telefono,
        nivel: formData.nivel,
        fechaIngreso: formData.fechaIngreso ? new Date(formData.fechaIngreso) : null,
        fechaEgresoEstimada: formData.fechaEgresoEstimada ? new Date(formData.fechaEgresoEstimada) : null,
        estadoInscripcion: 'Pendiente',
        fechaInscripcion: new Date(),
      };

      await addDoc(collection(db, 'inscripciones'), inscripcionData);

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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-blue mr-3" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Formulario de Inscripción
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Completa todos los campos para inscribirte en nuestros programas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre Completo */}
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

            {/* Email */}
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

            {/* Teléfono */}
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

            {/* Nivel */}
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

            {/* Fecha de ingreso */}
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

            {/* Fecha estimada de egreso */}
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

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 sm:py-3 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
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
