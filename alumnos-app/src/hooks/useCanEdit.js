import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para verificar si el usuario actual tiene permisos de edición
 * Solo los administradores pueden editar, los directivos y grupos solo pueden leer
 */
export const useCanEdit = () => {
  const { userData } = useAuth();
  
  // Solo admin puede editar, directivo, grupos y alumno no pueden
  return userData?.rol === 'admin';
};

export default useCanEdit;


