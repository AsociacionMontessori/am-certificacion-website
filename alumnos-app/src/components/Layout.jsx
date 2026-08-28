import { Link, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import WhatsAppButton from './WhatsAppButton';

const NAVIGATION = [
  { name: 'Inicio', mobileName: 'Inicio', href: '/', icon: HomeIcon },
  { name: 'Mi Expediente', mobileName: 'Expediente', href: '/expediente', icon: DocumentTextIcon },
  { name: 'Calendario', mobileName: 'Calendario', href: '/calendario', icon: CalendarIcon },
  { name: 'Calificaciones', mobileName: 'Calificaciones', href: '/calificaciones', icon: ChartBarIcon },
  { name: 'Graduación', mobileName: 'Graduación', href: '/graduacion', icon: AcademicCapIcon },
];

const getInitials = (name = '') => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'AM';
};

const ThemeButton = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === 'dark' ? SunIcon : MoonIcon;
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`apple-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800 ${
        compact ? 'h-11 w-11' : 'gap-2 px-4 text-sm font-semibold'
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {!compact && <span>Cambiar tema</span>}
    </button>
  );
};

const Layout = ({ children, previewUserData = null }) => {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const resolvedUserData = previewUserData || userData;
  const isPreview = Boolean(previewUserData);
  const initials = getInitials(resolvedUserData?.nombre || resolvedUserData?.email);
  const navigation = resolvedUserData?.estado === 'Inactivo'
    ? NAVIGATION.filter((item) => item.href !== '/graduacion')
    : NAVIGATION;

  const handleLogout = async () => {
    if (!isPreview) await logout();
  };

  return (
    <div className="student-shell min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <aside className="student-sidebar glass-material hidden lg:flex" aria-label="Navegación del alumno">
        <div className="flex items-center gap-3 px-2">
          <img
            src="/images/lasc.png"
            alt="Asociación Montessori de México"
            className="h-14 w-14 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight tracking-[-0.02em] text-blue">Portal Alumnos</p>
            <p className="mt-0.5 text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">
              Certificación Montessori
            </p>
          </div>
        </div>

        <nav className="mt-12 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`student-nav-item apple-press ${isActive ? 'student-nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue/10 text-sm font-bold text-blue">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {resolvedUserData?.nombre || resolvedUserData?.email || 'Alumno'}
              </p>
              {resolvedUserData?.matricula && (
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  Matrícula {resolvedUserData.matricula}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="apple-press mt-3 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-red dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-red-light"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <header className="glass-material fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/70 px-4 lg:hidden dark:border-white/10">
        <Link to="/" className="apple-press flex min-h-11 items-center gap-2.5 rounded-2xl pr-2">
          <img src="/images/lasc.png" alt="" className="h-10 w-10 object-contain" />
          <span className="text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">Portal Alumnos</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeButton compact />
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-blue/10 bg-blue/10 text-sm font-bold text-slate-700 dark:border-blue/20 dark:text-slate-100">
            {initials}
          </span>
        </div>
      </header>

      <div className="student-desktop-tools hidden lg:flex">
        <ThemeButton />
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full border border-blue/10 bg-blue/10 text-sm font-bold text-slate-700 dark:border-blue/20 dark:text-slate-100"
          aria-label={`Perfil de ${resolvedUserData?.nombre || 'alumno'}`}
        >
          {initials}
        </span>
      </div>

      <main className="student-main pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-24 lg:pb-16 lg:pt-12">
        {resolvedUserData?.estado === 'Inactivo' && (
          <section className="mb-6 rounded-3xl border border-red/20 bg-red/5 p-5" role="alert">
            <h2 className="text-lg font-bold text-red">Usuario inactivo</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              Tu cuenta está inactiva. Contacta con administración para reactivarla.
            </p>
          </section>
        )}
        {children}
      </main>

      {!isPreview && <WhatsAppButton />}

      <nav className="student-bottom-nav glass-material lg:hidden" aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`student-bottom-item apple-press ${isActive ? 'student-bottom-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.mobileName}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
