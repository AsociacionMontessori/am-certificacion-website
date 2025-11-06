import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import PublicProfile from './pages/Public/PublicProfile';

// Componente para redirigir según el rol
const DashboardRedirect = () => {
  const { userData } = useAuth();
  
  if (userData?.rol === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
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
  );
}

export default App;
