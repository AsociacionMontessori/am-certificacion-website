import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el usuario está en un dispositivo iOS (iPhone, iPad)
 * Detecta iOS de manera confiable para ajustar la UI y evitar conflictos con Safari
 * @returns {boolean} true si es iOS, false en caso contrario
 */
export const useIsIOS = () => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS de manera confiable
    const checkIOS = () => {
      // Verificar user agent
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      
      // Verificar plataforma
      const platform = window.navigator.platform?.toLowerCase() || '';
      const isIOSPlatform = /iphone|ipad|ipod/.test(platform);
      
      // Verificar si está en modo standalone (PWA en iOS)
      const isStandalone = window.navigator.standalone === true;
      
      // Verificar vendor (Apple)
      const vendor = window.navigator.vendor?.toLowerCase() || '';
      const isAppleVendor = vendor.includes('apple');
      
      // Combinar todas las verificaciones para mayor confiabilidad
      return isIOSDevice || isIOSPlatform || (isStandalone && isAppleVendor);
    };

    setIsIOS(checkIOS());
  }, []);

  return isIOS;
};

export default useIsIOS;

