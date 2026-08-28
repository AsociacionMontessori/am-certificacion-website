import AdminLayout from '../components/AdminLayout';
import CrearUsuario from './Admin/CrearUsuario';

const PREVIEW_ADMIN = {
  id: 'preview-admin',
  nombre: 'Ana Martínez',
  email: 'admin@certificacionmontessori.com',
  rol: 'admin',
};

const AdminFormPreview = () => (
  <AdminLayout previewUserData={PREVIEW_ADMIN} previewCanEdit>
    <CrearUsuario previewMode />
  </AdminLayout>
);

export default AdminFormPreview;
