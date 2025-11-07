export const getEstadoBadgeClasses = (estado) => {
  const normalizedEstado = estado?.toString().trim().toLowerCase();

  switch (normalizedEstado) {
    case 'activo':
      return 'bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900';
    case 'graduado':
      return 'bg-yellow text-gray-900 dark:bg-yellow/80 dark:text-gray-900';
    case 'inactivo':
      return 'bg-black text-white dark:bg-gray-100 dark:text-gray-900';
    default:
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white';
  }
};
