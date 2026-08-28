import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderOpenIcon,
  LockClosedIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import AlertasMateriasAtraso from '../components/AlertasMateriasAtraso';
import AvisoDocumentosPendientes from '../components/AvisoDocumentosPendientes';
import AvisosDelAdmin from '../components/AvisosDelAdmin';
import StudyToolsSheet, { StudyToolsList } from '../components/student/StudyTools';

const FORMATION_LINKS = [
  { title: 'Mi Expediente', href: '/expediente', icon: DocumentTextIcon },
  { title: 'Calendario', href: '/calendario', icon: CalendarIcon },
  { title: 'Calificaciones', href: '/calificaciones', icon: ChartBarIcon },
  { title: 'Graduación', href: '/graduacion', icon: AcademicCapIcon },
];

const PreviewAttention = () => (
  <div className="attention-surface divide-y divide-slate-200/80 dark:divide-white/10">
    {[
      {
        title: 'Completa los documentos pendientes de tu expediente',
        href: '/expediente',
        icon: DocumentTextIcon,
        tone: 'attention-icon-yellow',
      },
      {
        title: 'Revisa las actividades pendientes de tus materias',
        href: '/calendario',
        icon: RectangleStackIcon,
        tone: 'attention-icon-orange',
      },
    ].map((item) => (
      <div key={item.title} className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
          <item.icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100 sm:text-base">
          <span className="sm:hidden">
            {item.href === '/expediente'
              ? 'Documentos pendientes de tu expediente'
              : 'Actividades pendientes de tus materias'}
          </span>
          <span className="hidden sm:inline">{item.title}</span>
        </p>
        <Link to={item.href} className="apple-press inline-flex min-h-11 items-center gap-1 rounded-2xl px-3 text-sm font-bold text-blue hover:bg-blue/5">
          Revisar
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    ))}
  </div>
);

const FormationList = ({ inactive = false }) => (
  <div className="open-list divide-y divide-slate-200/80 dark:divide-white/10">
    {FORMATION_LINKS.filter((item) => !inactive || item.href !== '/graduacion').map((item) => (
      <Link key={item.title} to={item.href} className="open-list-row apple-press group">
        <item.icon className="h-6 w-6 text-blue" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-base font-semibold text-slate-800 dark:text-slate-100">
          {item.title}
        </span>
        <ChevronRightIcon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue" aria-hidden="true" />
      </Link>
    ))}
  </div>
);

const CredentialsPanel = ({ userData, showPassword, onTogglePassword, onCopy }) => {
  const hasCredentials = userData?.mailClassroom && userData?.passwordClassroom;

  return (
    <section className="dashboard-panel p-5 sm:p-6" aria-labelledby="classroom-access-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="classroom-access-title" className="text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white">
          Accesos de Classroom
        </h2>
        <LockClosedIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {hasCredentials ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-[0.01em] text-slate-500 dark:text-slate-400">Correo institucional</p>
            <div className="secure-field">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200">
                {userData.mailClassroom}
              </span>
              <button
                type="button"
                onClick={() => onCopy(userData.mailClassroom, 'Correo institucional')}
                className="apple-press secure-field-button"
                aria-label="Copiar correo institucional"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-[0.01em] text-slate-500 dark:text-slate-400">Contraseña de acceso</p>
            <div className="secure-field">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200">
                {showPassword ? userData.passwordClassroom : '••••••••••••'}
              </span>
              <button
                type="button"
                onClick={onTogglePassword}
                className="apple-press secure-field-button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => onCopy(userData.passwordClassroom, 'Contraseña')}
                className="apple-press secure-field-button"
                aria-label="Copiar contraseña"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Usa estos accesos para Classroom, correo, Drive y Calendar.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Tus credenciales estarán disponibles aquí cuando administración las asigne.
        </p>
      )}
    </section>
  );
};

const CertificatesPanel = ({ userData, onCopy }) => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const publicProfileUrl = `${origin}/public/alumno/${userData?.id || ''}`;
  const certificateUrl = `${origin}/certificado/${userData?.id || ''}`;
  const verificationUrl = userData?.folioCertificado && userData?.codigoVerificacion
    ? `${origin}/verificar/${userData.folioCertificado}/${userData.codigoVerificacion}`
    : '';

  const links = useMemo(() => {
    const available = [
      { label: 'Vista pública del perfil', value: publicProfileUrl },
      ...(userData?.estado !== 'Graduado'
        ? [{ label: 'Constancia del nivel actual', value: `${certificateUrl}?tipo=constancia` }]
        : []),
      ...(userData?.fechaGraduacion ? [{ label: 'Certificado de graduación', value: certificateUrl }] : []),
      ...(verificationUrl ? [{ label: 'Enlace de verificación', value: verificationUrl }] : []),
    ];
    return available;
  }, [certificateUrl, publicProfileUrl, userData?.estado, userData?.fechaGraduacion, verificationUrl]);

  return (
    <details className="dashboard-panel group overflow-hidden" open={false}>
      <summary className="apple-press flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden sm:px-6">
        <FolderOpenIcon className="h-5 w-5 text-blue" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-base font-bold text-slate-900 dark:text-white">Certificados y enlaces públicos</span>
        <ChevronRightIcon className="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <div className="divide-y divide-slate-200/80 border-t border-slate-200/80 px-5 dark:divide-white/10 dark:border-white/10 sm:px-6">
        {links.map((link) => (
          <div key={link.label} className="flex items-center gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{link.label}</p>
              <p className="mt-1 truncate font-mono text-xs text-slate-700 dark:text-slate-200">{link.value}</p>
            </div>
            <button
              type="button"
              onClick={() => onCopy(link.value, link.label)}
              className="apple-press secure-field-button shrink-0"
              aria-label={`Copiar ${link.label.toLowerCase()}`}
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
            <a
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="apple-press secure-field-button shrink-0"
              aria-label={`Abrir ${link.label.toLowerCase()}`}
            >
              <ArrowRightIcon className="h-5 w-5 -rotate-45" />
            </a>
          </div>
        ))}
      </div>
    </details>
  );
};

const Dashboard = ({ previewUserData = null, previewMode = false }) => {
  const { userData: authUserData } = useAuth();
  const userData = previewUserData || authUserData;
  const [showPassword, setShowPassword] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [attention, setAttention] = useState({ admin: false, subjects: false, documents: false });
  const { success, prompt: showPrompt } = useNotifications();

  const updateAttention = useCallback((key, visible) => {
    setAttention((current) => (current[key] === visible ? current : { ...current, [key]: visible }));
  }, []);
  const onAdminVisibility = useCallback((visible) => updateAttention('admin', visible), [updateAttention]);
  const onSubjectsVisibility = useCallback((visible) => updateAttention('subjects', visible), [updateAttention]);
  const onDocumentsVisibility = useCallback((visible) => updateAttention('documents', visible), [updateAttention]);
  const hasAttention = previewMode || Object.values(attention).some(Boolean);

  const handleCopyToClipboard = useCallback(async (text, type = '') => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${type ? `${type} ` : ''}copiado al portapapeles`);
    } catch (error) {
      console.error('Error al copiar:', error);
      const userInput = await showPrompt(`Copia este ${type || 'texto'}:`, {
        defaultValue: text,
        title: 'Copiar al portapapeles',
      });
      if (userInput) success(`${type ? `${type} ` : ''}copiado al portapapeles`);
    }
  }, [showPrompt, success]);

  const firstName = userData?.nombre?.trim().split(/\s+/)[0] || 'Alumno';

  return (
    <div className="dashboard-experience animate-fade-in">
      <header className="dashboard-heading max-w-3xl pr-0 lg:pr-52">
        <h1 className="text-[clamp(2.35rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.045em] text-slate-900 dark:text-white">
          Hola, {firstName}
        </h1>
        <p className="mt-3 text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xl">
          Tu espacio académico
        </p>
      </header>

      <div className="dashboard-columns mt-10 sm:mt-12">
        <div className="space-y-8">
          <section className={hasAttention ? '' : 'hidden'} aria-labelledby="attention-title">
            <h2 id="attention-title" className="section-title">Lo que requiere tu atención</h2>
            <div className="mt-4">
              {previewMode ? (
                <PreviewAttention />
              ) : (
                <div className="space-y-3">
                  <AvisosDelAdmin compact onVisibilityChange={onAdminVisibility} />
                  {userData?.rol !== 'grupos' && (
                    <AlertasMateriasAtraso compact onVisibilityChange={onSubjectsVisibility} />
                  )}
                  <AvisoDocumentosPendientes compact onVisibilityChange={onDocumentsVisibility} />
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="formation-title">
            <h2 id="formation-title" className="section-title">Tu formación</h2>
            <FormationList inactive={userData?.estado === 'Inactivo'} />
          </section>

          <section className="lg:hidden" aria-labelledby="mobile-tools-title">
            <h2 id="mobile-tools-title" className="section-title">Herramientas de estudio</h2>
            <button
              type="button"
              onClick={() => setToolsOpen(true)}
              className="open-list-row apple-press group mt-4 w-full rounded-3xl border border-slate-200/80 bg-white px-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
            >
              <RectangleStackIcon className="h-6 w-6 text-blue" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-left text-base font-semibold text-slate-800 dark:text-slate-100">Abrir herramientas</span>
              <ChevronRightIcon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue" aria-hidden="true" />
            </button>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Accesos complementarios">
          <section className="dashboard-panel hidden p-5 lg:block sm:p-6" aria-labelledby="study-tools-title">
            <h2 id="study-tools-title" className="text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white">Herramientas de estudio</h2>
            <StudyToolsList className="mt-3" />
          </section>

          <CredentialsPanel
            userData={userData}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
            onCopy={handleCopyToClipboard}
          />

          {userData?.estado !== 'Inactivo' && (
            <CertificatesPanel userData={userData} onCopy={handleCopyToClipboard} />
          )}
        </aside>
      </div>

      <footer className="mt-14 border-t border-slate-200/80 pt-6 text-center dark:border-white/10">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Asociación Montessori de México · Esta aplicación es una donación de un exalumno Montessori.
        </p>
      </footer>

      <StudyToolsSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </div>
  );
};

export default Dashboard;
