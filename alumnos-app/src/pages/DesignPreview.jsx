import Layout from '../components/Layout';
import Dashboard from './Dashboard';

const PREVIEW_USER = {
  id: 'preview-ana',
  nombre: 'Ana Martínez',
  email: 'ana.martinez@example.com',
  matricula: 'CM-2026-0142',
  rol: 'alumno',
  estado: 'Activo',
  mailClassroom: 'ana.martinez@alumnos.certificacionmontessori.com',
  passwordClassroom: 'Montessori2026!',
  folioCertificado: 'CM-2026-0142',
  codigoVerificacion: 'AMM-2026',
  fechaGraduacion: null,
};

const DesignPreview = () => (
  <Layout previewUserData={PREVIEW_USER}>
    <Dashboard previewUserData={PREVIEW_USER} previewMode />
  </Layout>
);

export default DesignPreview;
