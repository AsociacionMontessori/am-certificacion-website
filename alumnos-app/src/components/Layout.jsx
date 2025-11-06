import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { userData, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Mi Expediente', href: '/expediente', icon: DocumentTextIcon },
    { name: 'Calendario', href: '/calendario', icon: CalendarIcon },
    { name: 'Calificaciones', href: '/calificaciones', icon: ChartBarIcon },
    { name: 'Graduación', href: '/graduacion', icon: AcademicCapIcon },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <img 
                  src="/images/lasc.png" 
                  alt="Logo" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-blue">Portal Alumnos</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Certificación Montessori</p>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'border-blue text-blue'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                    >
                      <item.icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userData && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">{userData.nombre || userData.email}</p>
                  {userData.matricula && (
                    <p className="text-xs text-gray-500">Matrícula: {userData.matricula}</p>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red hover:bg-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

