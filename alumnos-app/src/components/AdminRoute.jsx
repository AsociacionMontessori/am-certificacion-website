import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  const rolesPermitidos = allowedRoles || ['admin', 'directivo', 'grupos', 'catedratico'];

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

  if (!rolesPermitidos.includes(userData?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

