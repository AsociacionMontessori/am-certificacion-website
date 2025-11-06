import { useState, useCallback } from 'react';

/**
 * Hook para manejar estados de carga de manera consistente
 * @param {boolean} initialLoading - Estado inicial de carga
 * @returns {object} Objeto con loading, startLoading, stopLoading, withLoading
 */
const useLoading = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);

  const startLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  /**
   * Ejecuta una función asíncrona con manejo automático de loading
   * @param {Function} asyncFn - Función asíncrona a ejecutar
   * @param {Function} onError - Callback opcional para manejar errores
   * @returns {Promise} Promise de la función
   */
  const withLoading = useCallback(async (asyncFn, onError = null) => {
    try {
      setLoading(true);
      const result = await asyncFn();
      return result;
    } catch (error) {
      console.error('Error en withLoading:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    isLoading: loading,
    startLoading,
    stopLoading,
    withLoading,
    setLoading
  };
};

export default useLoading;

