import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HomeIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
  const { userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Crear Usuario', href: '/admin/crear-usuario', icon: UserGroupIcon },
    { name: 'Inscripciones', href: '/admin/inscripciones', icon: DocumentTextIcon },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
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
              <div className="hidden md:ml-8 md:flex md:space-x-1">
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
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {userData && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                    {userData.nombre || userData.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
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

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

