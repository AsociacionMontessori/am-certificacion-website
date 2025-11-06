import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expediente from './pages/Expediente';
import Calendario from './pages/Calendario';
import Calificaciones from './pages/Calificaciones';
import Graduacion from './pages/Graduacion';
import Inscripcion from './pages/Inscripcion';
import AdminDashboard from './pages/Admin/Dashboard';
import AlumnoDetail from './pages/Admin/AlumnoDetail';
import Inscripciones from './pages/Admin/Inscripciones';
import CrearUsuario from './pages/Admin/CrearUsuario';
import GestionMaterias from './pages/Admin/GestionMaterias';
import GestionCalificaciones from './pages/Admin/GestionCalificaciones';
import GestionGraduacion from './pages/Admin/GestionGraduacion';
import PublicProfile from './pages/Public/PublicProfile';

// Componente para redirigir según el rol
const DashboardRedirect = () => {
  const { userData, loading, currentUser } = useAuth();
  
  console.log('🔄 DashboardRedirect - Estado:', { 
    loading, 
    hasUserData: !!userData, 
    rol: userData?.rol,
    userData
  });
  
  // Esperar a que se carguen los datos del usuario
  if (loading) {
    console.log('⏳ DashboardRedirect - Esperando carga...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }
  
  // Si no hay usuario autenticado, no debería llegar aquí por ProtectedRoute
  if (!currentUser) {
    console.log('❌ DashboardRedirect - No hay usuario autenticado');
    return <Navigate to="/login" replace />;
  }
  
  // Si no hay userData, puede ser que el documento no existe
  if (!userData) {
    console.warn('⚠️ DashboardRedirect - No hay userData, mostrando dashboard de alumno por defecto');
    return <Dashboard />;
  }
  
  // Si el usuario es admin, redirigir al panel de administración
  if (userData.rol === 'admin') {
    console.log('✅ DashboardRedirect - Redirigiendo a /admin');
    return <Navigate to="/admin" replace />;
  }
  
  // Si no es admin, mostrar dashboard de alumno
  console.log('👤 DashboardRedirect - Mostrando dashboard de alumno');
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/inscripcion" element={<Inscripcion />} />
          <Route path="/public/alumno/:id" element={<PublicProfile />} />
          
          {/* Rutas protegidas - Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AlumnoDetail />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/inscripciones"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Inscripciones />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crear-usuario"
            element={
              <AdminRoute>
                <AdminLayout>
                  <CrearUsuario />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/materias"
            element={
              <AdminRoute>
                <AdminLayout>
                  <GestionMaterias />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/calificaciones"
            element={
              <AdminRoute>
                <AdminLayout>
                  <GestionCalificaciones />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/graduacion"
            element={
              <AdminRoute>
                <AdminLayout>
                  <GestionGraduacion />
                </AdminLayout>
              </AdminRoute>
            }
          />
          
          {/* Rutas protegidas - Alumnos */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRedirect />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expediente"
            element={
              <ProtectedRoute>
                <Layout>
                  <Expediente />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <Layout>
                  <Calendario />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calificaciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <Calificaciones />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graduacion"
            element={
              <ProtectedRoute>
                <Layout>
                  <Graduacion />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
