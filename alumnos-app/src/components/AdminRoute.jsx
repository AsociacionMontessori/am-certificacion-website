import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="xl" 
        variant="montessori"
        message="Verificando permisos de administrador..."
      />
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Permitir acceso a admin y directivo
  if (userData?.rol !== 'admin' && userData?.rol !== 'directivo') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

