import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useIsIOS } from '../hooks/useIsIOS';
import useCanEdit from '../hooks/useCanEdit';
import { 
  HomeIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  QrCodeIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
  const { userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const canEdit = useCanEdit();
  const isIOS = useIsIOS();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    ...(canEdit ? [{ name: 'Crear Usuario', href: '/admin/crear-usuario', icon: UserGroupIcon }] : []),
    { name: 'Inscripciones', href: '/admin/inscripciones', icon: DocumentTextIcon },
    ...(userData?.rol !== 'catedratico' ? [{ name: 'Pagos', href: '/admin/pagos', icon: CurrencyDollarIcon }] : []),
    ...(canEdit ? [{ name: 'Gestión Grupos', href: '/admin/gestion-grupos', icon: UserGroupIcon }] : []),
    { name: 'Generador QR', href: '/admin/generador-qr', icon: QrCodeIcon },
  ];

  const herramientasAvanzadas = canEdit ? [
    { name: 'Usuarios Administrativos', href: '/admin/usuarios-administrativos', icon: IdentificationIcon },
    { name: 'Regenerar Códigos', href: '/admin/regenerar-codigos', icon: ArrowPathIcon },
    { name: 'Diagnóstico', href: '/admin/diagnostico-codigos', icon: DocumentTextIcon },
  ] : [];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isIOS ? 'pt-20 md:pt-0' : 'pb-16 md:pb-0'}`}>
      {/* Navbar Superior - Desktop */}
      <nav className="hidden md:block shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                <img 
                  src="/images/lasc.png" 
                  alt="Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                />
                <div className="hidden xs:block">
                  <h1 className="text-base sm:text-lg font-bold text-blue leading-tight">Admin - Portal Alumnos</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Certificación Montessori</p>
                </div>
              </div>
              <div className="hidden md:ml-8 md:flex md:space-x-1 md:items-center">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'border-blue text-blue dark:text-blue-300 bg-blue/5 dark:bg-blue/20'
                          : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      } inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                    >
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Separador visual */}
                <div className="hidden lg:block h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                
                {/* Herramientas Avanzadas - Dropdown */}
                <div className="hidden lg:block relative group">
                  <button className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
                    <WrenchScrewdriverIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden lg:inline">Herramientas Avanzadas</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Mantenimiento
                      </div>
                      {herramientasAvanzadas.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`${
                              isActive
                                ? 'bg-blue/5 dark:bg-blue/20 text-blue dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            } block px-4 py-2 text-sm transition-colors duration-150`}
                          >
                            <div className="flex items-center">
                              <item.icon className="w-4 h-4 mr-2" />
                              <span>{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {userData && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                    {userData.nombre || userData.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userData.rol === 'admin'
                      ? 'Administrador'
                      : userData.rol === 'directivo'
                        ? 'Directivo'
                        : userData.rol === 'catedratico'
                          ? 'Catedrático'
                          : userData.rol === 'grupos'
                            ? 'Grupos'
                            : 'Usuario'}
                  </p>
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-yellow" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red hover:bg-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red transition-all duration-200 shadow-sm hover:shadow"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navbar Superior - Mobile (solo logo y acciones) */}
      <nav className="md:hidden sticky top-0 z-50 backdrop-blur-lg bg-blue/60 dark:bg-blue/40 border-b border-blue/30 shadow-lg shadow-[0_4px_32px_rgba(0,151,178,0.3)] dark:shadow-[0_4px_32px_rgba(0,151,178,0.2)]" style={{ backgroundColor: 'rgba(0, 151, 178, 0.6)' }}>
        {/* Efecto de brillo sutil en el borde inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/lasc.png" 
                alt="Logo" 
                className="h-8 w-8 object-contain"
              />
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Admin Portal</h1>
                <p className="text-xs text-white/80 leading-tight">Certificación Montessori</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-all duration-300 hover:scale-110 active:scale-90"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-yellow" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-red/30 text-white transition-all duration-300 hover:scale-110 active:scale-90"
                aria-label="Salir"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${isIOS ? 'md:pb-8' : 'pb-16 md:pb-8'} animate-fade-in`}>
        {children}
      </main>

      {/* Bottom Navigation - Mobile (Glassmorphism Style) */}
      {/* En iOS se posiciona en la parte superior para evitar conflicto con la barra de Safari */}
      <nav className={`md:hidden ${isIOS ? 'sticky top-16 z-40' : 'fixed bottom-0 left-0 right-0 z-50'}`}>
        <div className={`backdrop-blur-lg bg-blue/60 dark:bg-blue/40 shadow-lg ${
          isIOS 
            ? 'border-b border-blue/30 shadow-[0_8px_32px_rgba(0,151,178,0.3)] dark:shadow-[0_8px_32px_rgba(0,151,178,0.2)]' 
            : 'border-t border-blue/30 shadow-[0_-8px_32px_rgba(0,151,178,0.3)] dark:shadow-[0_-8px_32px_rgba(0,151,178,0.2)]'
        }`} style={{ backgroundColor: theme === 'dark' ? 'rgba(0, 151, 178, 0.4)' : 'rgba(0, 151, 178, 0.6)' }}>
          {/* Efecto de brillo sutil en el borde */}
          <div className={`absolute ${isIOS ? 'bottom-0' : 'top-0'} left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent`}></div>
          <div className="px-2 py-1.5">
            <div className="flex justify-around items-center">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 active:scale-90 ${
                      isActive
                        ? 'bg-white/20 backdrop-blur-sm text-white scale-110 shadow-lg shadow-white/20'
                        : 'text-white/80 hover:text-yellow hover:scale-[1.2] hover:bg-white/10'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow rounded-full shadow-lg shadow-yellow/50"></div>
                    )}
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[9px] font-medium mt-0.5 leading-tight text-center px-0.5">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
              
              {/* Herramientas Avanzadas - Mobile (solo icono) */}
              <div className="relative group">
                <button
                  className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 active:scale-90 ${
                    herramientasAvanzadas.some(item => location.pathname === item.href)
                      ? 'bg-white/20 backdrop-blur-sm text-white scale-110 shadow-lg shadow-white/20'
                      : 'text-white/80 hover:text-yellow hover:scale-[1.2] hover:bg-white/10'
                  }`}
                >
                  {herramientasAvanzadas.some(item => location.pathname === item.href) && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow rounded-full shadow-lg shadow-yellow/50"></div>
                  )}
                  <WrenchScrewdriverIcon className="w-5 h-5 transition-transform duration-300" />
                  <span className="text-[9px] font-medium mt-0.5 leading-tight text-center px-0.5">
                    Más
                  </span>
                </button>
                
                {/* Dropdown Menu Mobile */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Avanzadas
                    </div>
                    {herramientasAvanzadas.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`${
                            isActive
                              ? 'bg-blue/5 dark:bg-blue/20 text-blue dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          } block px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <div className="flex items-center">
                            <item.icon className="w-4 h-4 mr-2" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
