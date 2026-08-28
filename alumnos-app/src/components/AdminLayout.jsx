import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  IdentificationIcon,
  MegaphoneIcon,
  MoonIcon,
  QrCodeIcon,
  SunIcon,
  UserGroupIcon,
  UserPlusIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import useCanEdit from '../hooks/useCanEdit';

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

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administración',
    directivo: 'Directivo',
    catedratico: 'Catedrático',
    grupos: 'Grupos',
  };
  return labels[role] || 'Usuario administrativo';
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

const NavigationLink = ({ item, active, onNavigate }) => (
  <Link
    to={item.href}
    onClick={onNavigate}
    className={`admin-nav-item apple-press ${active ? 'admin-nav-item-active' : ''}`}
    aria-current={active ? 'page' : undefined}
  >
    <item.icon className="h-5 w-5" aria-hidden="true" />
    <span>{item.name}</span>
  </Link>
);

const AdminLayout = ({ children, previewUserData = null, previewCanEdit = null }) => {
  const { userData, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const authCanEdit = useCanEdit();
  const [moreOpen, setMoreOpen] = useState(false);
  const resolvedUser = previewUserData || userData;
  const canEdit = previewCanEdit ?? authCanEdit;
  const isPreview = Boolean(previewUserData);
  const initials = getInitials(resolvedUser?.nombre || resolvedUser?.email);

  const navigation = useMemo(() => {
    const role = resolvedUser?.rol;
    const main = [
      { name: 'Panel', href: '/admin', icon: HomeIcon },
      ...(canEdit ? [{ name: 'Crear usuario', href: '/admin/crear-usuario', icon: UserPlusIcon }] : []),
      { name: 'Inscripciones', href: '/admin/inscripciones', icon: DocumentTextIcon },
      ...(role === 'admin' || role === 'directivo'
        ? [{ name: 'Órdenes web', href: '/admin/ordenes', icon: CurrencyDollarIcon }]
        : []),
      ...(canEdit ? [{ name: 'Mensajes', href: '/admin/mensajes', icon: MegaphoneIcon }] : []),
      ...(canEdit ? [{ name: 'Grupos', href: '/admin/gestion-grupos', icon: UserGroupIcon }] : []),
      ...(role !== 'grupos' && role !== 'catedratico'
        ? [{ name: 'Generador QR', href: '/admin/generador-qr', icon: QrCodeIcon }]
        : []),
    ];

    const tools = canEdit
      ? [
          { name: 'Niveles', href: '/admin/gestion-niveles', icon: BuildingLibraryIcon },
          { name: 'Usuarios administrativos', href: '/admin/usuarios-administrativos', icon: IdentificationIcon },
          { name: 'Regenerar códigos', href: '/admin/regenerar-codigos', icon: ArrowPathIcon },
          { name: 'Diagnóstico', href: '/admin/diagnostico-codigos', icon: WrenchScrewdriverIcon },
        ]
      : [];

    return { main, tools };
  }, [canEdit, resolvedUser?.rol]);

  const primaryMobile = useMemo(() => {
    const preferredHrefs = ['/admin', '/admin/crear-usuario', '/admin/inscripciones', '/admin/mensajes'];
    return preferredHrefs
      .map((href) => navigation.main.find((item) => item.href === href))
      .filter(Boolean);
  }, [navigation.main]);

  const moreItems = useMemo(() => {
    const primaryHrefs = new Set(primaryMobile.map((item) => item.href));
    return [...navigation.main, ...navigation.tools].filter((item) => !primaryHrefs.has(item.href) && item.href !== '/admin');
  }, [navigation, primaryMobile]);

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin/alumno/');
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (!isPreview) await logout();
  };

  return (
    <div className="admin-shell min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <aside className="admin-sidebar glass-material hidden lg:flex" aria-label="Navegación administrativa">
        <Link to="/admin" className="apple-press flex items-center gap-3 rounded-2xl px-2">
          <img src="/images/lasc.png" alt="Asociación Montessori de México" className="h-14 w-14 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight tracking-[-0.02em] text-blue">Portal Administrativo</p>
            <p className="mt-0.5 text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">Certificación Montessori</p>
          </div>
        </Link>

        <nav className="mt-10 space-y-1" aria-label="Operación">
          {navigation.main.map((item) => (
            <NavigationLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {navigation.tools.length > 0 && (
          <div className="mt-7">
            <p className="px-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Herramientas</p>
            <nav className="mt-2 space-y-1" aria-label="Herramientas administrativas">
              {navigation.tools.map((item) => (
                <NavigationLink key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </nav>
          </div>
        )}

        <div className="mt-auto rounded-3xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue/10 text-sm font-bold text-blue">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{resolvedUser?.nombre || resolvedUser?.email || 'Administración'}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(resolvedUser?.rol)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="apple-press mt-3 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-red dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-red-light"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <header className="glass-material fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/70 px-4 lg:hidden dark:border-white/10">
        <Link to="/admin" className="apple-press flex min-h-11 items-center gap-2.5 rounded-2xl pr-2">
          <img src="/images/lasc.png" alt="" className="h-10 w-10 object-contain" />
          <span className="text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">Portal Administrativo</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeButton compact />
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-blue/10 bg-blue/10 text-sm font-bold text-slate-700 dark:border-blue/20 dark:text-slate-100">{initials}</span>
        </div>
      </header>

      <div className="admin-desktop-tools hidden lg:flex">
        <ThemeButton />
        <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-2 pr-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/80">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue/10 text-xs font-bold text-blue">{initials}</span>
          <div className="min-w-0">
            <p className="max-w-36 truncate text-xs font-bold text-slate-800 dark:text-white">{resolvedUser?.nombre || 'Administración'}</p>
            <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">{getRoleLabel(resolvedUser?.rol)}</p>
          </div>
        </div>
      </div>

      <main className="admin-main pb-[calc(7rem+env(safe-area-inset-bottom))] pt-24 lg:pb-16 lg:pt-12">
        <div className="admin-content animate-fade-in">{children}</div>
      </main>

      <nav className="admin-bottom-nav glass-material lg:hidden" aria-label="Navegación administrativa principal">
        <div
          className="mx-auto grid max-w-lg gap-1 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2"
          style={{ gridTemplateColumns: `repeat(${primaryMobile.length + 1}, minmax(0, 1fr))` }}
        >
          {primaryMobile.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`admin-bottom-item apple-press ${isActive(item.href) ? 'admin-bottom-item-active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.name === 'Crear usuario' ? 'Usuarios' : item.name}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`admin-bottom-item apple-press ${moreItems.some((item) => isActive(item.href)) ? 'admin-bottom-item-active' : ''}`}
            aria-label="Abrir más opciones administrativas"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onClose={setMoreOpen} className="relative z-[90] lg:hidden" transition>
        <DialogBackdrop className="fixed inset-x-0 top-0 bottom-[calc(4.55rem+env(safe-area-inset-bottom))] bg-slate-950/30 backdrop-blur-[2px] transition duration-300 ease-out data-closed:opacity-0 motion-reduce:duration-150" />
        <div className="fixed inset-x-0 top-0 bottom-[calc(4.55rem+env(safe-area-inset-bottom))] flex items-end justify-center">
          <DialogPanel className="sheet-material w-full max-w-xl rounded-t-[2rem] px-4 pb-4 pt-3 shadow-[0_-20px_70px_rgba(15,23,42,0.18)] transition duration-300 ease-out data-closed:translate-y-full motion-reduce:transform-none motion-reduce:data-closed:opacity-0">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <DialogTitle className="text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white">Más opciones</DialogTitle>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="apple-press flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                aria-label="Cerrar más opciones"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-more-grid mt-4 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`apple-press flex min-h-16 items-center gap-3 px-4 py-3 text-sm font-semibold ${
                    isActive(item.href)
                      ? 'bg-blue/10 text-blue'
                      : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <span className="sr-only" aria-live="polite">Tema {theme === 'dark' ? 'oscuro' : 'claro'} activo</span>
    </div>
  );
};

export default AdminLayout;
