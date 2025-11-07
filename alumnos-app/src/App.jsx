import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loading de todas las páginas para reducir el bundle inicial
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expediente = lazy(() => import('./pages/Expediente'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Calificaciones = lazy(() => import('./pages/Calificaciones'));
const Graduacion = lazy(() => import('./pages/Graduacion'));
const Inscripcion = lazy(() => import('./pages/Inscripcion'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AlumnoDetail = lazy(() => import('./pages/Admin/AlumnoDetail'));
const Inscripciones = lazy(() => import('./pages/Admin/Inscripciones'));
const CrearUsuario = lazy(() => import('./pages/Admin/CrearUsuario'));
const GestionMaterias = lazy(() => import('./pages/Admin/GestionMaterias'));
const GestionCalificaciones = lazy(() => import('./pages/Admin/GestionCalificaciones'));
const GestionGraduacion = lazy(() => import('./pages/Admin/GestionGraduacion'));
const PublicProfile = lazy(() => import('./pages/Public/PublicProfile'));
const CertificadoDigital = lazy(() => import('./pages/Public/CertificadoDigital'));
const VerificarCertificado = lazy(() => import('./pages/Public/VerificarCertificado'));
const RegenerarCodigos = lazy(() => import('./pages/Admin/RegenerarCodigos'));
const GeneradorQR = lazy(() => import('./pages/Admin/GeneradorQR'));
const DiagnosticoCodigos = lazy(() => import('./pages/Admin/DiagnosticoCodigos'));
const GestionGrupos = lazy(() => import('./pages/Admin/GestionGrupos'));
const GestionNiveles = lazy(() => import('./pages/Admin/GestionNiveles'));
const GestionPagos = lazy(() => import('./pages/Admin/GestionPagos'));
const Pagos = lazy(() => import('./pages/Pagos'));

// Componente para redirigir según el rol
const DashboardRedirect = () => {
  const { userData, loading, currentUser } = useAuth();
  
  // Esperar a que se carguen los datos del usuario
  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="xl" 
        variant="montessori"
        message="Cargando información..."
      />
    );
  }
  
  // Si no hay usuario autenticado, no debería llegar aquí por ProtectedRoute
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no hay userData, puede ser que el documento no existe
  if (!userData) {
    console.warn('⚠️ DashboardRedirect - No hay userData, mostrando dashboard de alumno por defecto');
    return (
      <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
        <Dashboard />
      </Suspense>
    );
  }
  
  // Si el usuario es admin, directivo o grupos, redirigir al panel de administración
  if (userData.rol === 'admin' || userData.rol === 'directivo' || userData.rol === 'grupos') {
    return <Navigate to="/admin" replace />;
  }
  
  // Si no es admin, mostrar dashboard de alumno
  return (
    <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
      <Dashboard />
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/login" 
            element={
              <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                <Login />
              </Suspense>
            } 
          />
          <Route 
            path="/inscripcion" 
            element={
              <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                <Inscripcion />
              </Suspense>
            } 
          />
          <Route 
            path="/public/alumno/:id" 
            element={
              <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                <PublicProfile />
              </Suspense>
            } 
          />
          <Route 
            path="/certificado/:id" 
            element={
              <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                <CertificadoDigital />
              </Suspense>
            } 
          />
          <Route 
            path="/verificar/:folio/:codigo" 
            element={
              <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                <VerificarCertificado />
              </Suspense>
            } 
          />
          
          {/* Rutas protegidas - Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <AdminDashboard />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <AlumnoDetail />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/inscripciones"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Inscripciones />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crear-usuario"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <CrearUsuario />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/regenerar-codigos"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <RegenerarCodigos />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/generador-qr"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GeneradorQR />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/diagnostico-codigos"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <DiagnosticoCodigos />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/materias"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionMaterias />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/calificaciones"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionCalificaciones />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alumno/:id/graduacion"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionGraduacion />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/gestion-grupos"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionGrupos />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/gestion-niveles"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionNiveles />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/pagos"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <GestionPagos />
                  </Suspense>
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
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Expediente />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Calendario />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calificaciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Calificaciones />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graduacion"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Graduacion />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner fullScreen size="xl" variant="montessori" message="Cargando..." />}>
                    <Pagos />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
