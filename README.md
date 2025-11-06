# 🏫 Sitio Web de Certificaciones Montessori

Sitio web oficial de la **Asociación Montessori de México A.C.** para la promoción y gestión de certificaciones, diplomados y masterclasses en el método Montessori con validez internacional.

## 📋 Descripción

Esta plataforma web está diseñada para facilitar el acceso a información sobre certificaciones Montessori, diplomados y programas educativos. El sitio ofrece una experiencia de usuario moderna, responsive y accesible, permitiendo a los usuarios explorar cursos, consultar precios, encontrar escuelas certificadas y acceder a masterclasses.

## ✨ Características Principales

### 🎓 Certificaciones y Diplomados
- **Certificaciones Internacionales**: Información sobre programas de certificación con validez internacional
- **Diplomados Guía Montessori**: Programas completos de formación en el método Montessori
- **Precios y Planes**: Información transparente sobre costos y opciones de pago
- **Becas y Ayudas**: Información sobre programas de becas disponibles

### 📚 Masterclasses
- **Catálogo de Masterclasses**: Acceso a clases magistrales de referentes en el método Montessori
- **Grabaciones Disponibles**: Acceso 24/7 a contenido grabado

### 🔍 Buscador de Escuelas
- **Búsqueda por Ubicación**: Encuentra escuelas Montessori certificadas por región
- **Información Detallada**: Datos de contacto, direcciones y certificaciones de cada escuela
- **Filtrado por Zona**: Búsqueda en Toluca, Azcapotzalco, Miguel Hidalgo y Venustiano Carranza

### 📱 Experiencia de Usuario
- **Diseño Mobile-First**: Optimizado para dispositivos móviles
- **Modo Oscuro**: Soporte para tema claro y oscuro
- **Navegación Intuitiva**: Interfaz clara y fácil de usar
- **Accesibilidad**: Diseño accesible y responsive
- **Integración WhatsApp**: Botón flotante para contacto directo

### 🎨 Diseño y UX
- **Colores Institucionales**: Paleta de colores Montessori (azul, amarillo, verde)
- **Componentes Reutilizables**: Arquitectura modular y escalable
- **Animaciones Suaves**: Transiciones y efectos visuales optimizados
- **Timeline Interactivo**: Visualización de procesos y cronogramas

## 🛠️ Tecnologías Utilizadas

### Core
- **Gatsby 5**: Framework React para sitios estáticos
- **React 18**: Biblioteca de interfaz de usuario
- **Node.js**: Entorno de ejecución

### Estilos
- **Tailwind CSS 3**: Framework de utilidades CSS
- **DaisyUI**: Componentes sobre Tailwind
- **PostCSS**: Procesador de CSS
- **CSS Personalizado**: Estilos globales y componentes

### Plugins y Herramientas
- **Gatsby Image**: Optimización de imágenes
- **Google Analytics**: Seguimiento y analítica
- **Google Maps React**: Integración de mapas
- **React Helmet**: Gestión de SEO
- **D3 Fetch**: Manipulación de datos CSV
- **Axios**: Cliente HTTP
- **React Search Box**: Búsqueda avanzada

### Desarrollo
- **Prettier**: Formateo de código
- **Autoprefixer**: Compatibilidad de CSS

## 📁 Estructura del Proyecto

```
certificacionMontessori/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── buttons/         # Botones y controles
│   │   ├── cards/          # Tarjetas de información
│   │   ├── figures/        # Figuras y decoraciones
│   │   ├── timeline/       # Componente de línea de tiempo
│   │   ├── layout.js       # Layout principal
│   │   ├── nav.js          # Navegación
│   │   ├── footer.js       # Pie de página
│   │   └── ...
│   ├── pages/              # Páginas del sitio
│   │   ├── index.js        # Página principal
│   │   ├── certificate.js  # Certificaciones
│   │   ├── diplomados.js   # Diplomados
│   │   ├── masterclasses.js # Masterclasses
│   │   ├── buscador.js     # Buscador de escuelas
│   │   └── ...
│   ├── images/             # Imágenes y assets
│   │   ├── banners/        # Imágenes de banners
│   │   ├── countries/      # Banderas de países
│   │   ├── elements/      # Elementos decorativos
│   │   └── ...
│   └── styles/             # Estilos globales
│       ├── global.css      # Estilos globales
│       ├── fonts.css       # Fuentes personalizadas
│       └── ...
├── static/                 # Archivos estáticos (CSV)
├── public/                 # Build de producción
├── gatsby-config.js        # Configuración de Gatsby
├── tailwind.config.js      # Configuración de Tailwind
├── package.json            # Dependencias y scripts
├── firebase.json          # Configuración de Firebase Hosting
└── .firebaserc            # Configuración del proyecto Firebase
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js (v16 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/AsociacionMontessori/am-certificacion-website.git
cd am-certificacion-website
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm run develop
```

El sitio estará disponible en `http://localhost:8000`

## 📜 Scripts Disponibles

- `npm run develop` - Inicia el servidor de desarrollo
- `npm run build` - Genera el build de producción
- `npm run serve` - Sirve el build de producción localmente
- `npm run clean` - Limpia el cache de Gatsby
- `npm run format` - Formatea el código con Prettier

## 🎯 Características Técnicas

### SEO y Performance
- **SEO Optimizado**: Meta tags y configuración de Open Graph
- **Imágenes Optimizadas**: Lazy loading y formatos modernos
- **Performance**: Build estático optimizado con Gatsby

### Integraciones
- **Google Analytics**: Tracking ID: `G-P0CNEGW276`
- **WhatsApp Business**: Integración para contacto directo
- **Google Maps**: Visualización de ubicaciones
- **CSV Data**: Carga dinámica de datos de escuelas

### Responsive Design
- **Mobile-First**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Touch-Friendly**: Botones y elementos táctiles optimizados

## 🎨 Paleta de Colores

El sitio utiliza los colores institucionales de Montessori:

- **Azul (Blue)**: `#0097B2` - Color principal
- **Amarillo (Yellow)**: `#FBD116` - Acento
- **Verde (Green)**: `#7ED957` - Éxito y acciones positivas
- **Rojo (Red)**: `#D90368` - Llamadas a la acción
- **Naranja (Orange)**: `#EC6A3D` - Acentos secundarios
- **Gris (Gray)**: `#40424B` - Fondos y texto

## 📱 Páginas Principales

1. **Inicio** (`/`) - Landing page con información general
2. **Certificaciones** (`/certificate`) - Información sobre certificaciones
3. **Diplomados** (`/diplomados`) - Programas de diplomados
4. **Masterclasses** (`/masterclasses`) - Catálogo de masterclasses
5. **Buscador** (`/buscador`) - Buscador de escuelas certificadas
6. **Contacto** (`/contact`) - Información de contacto
7. **Publicaciones** (`/publicaciones`) - Publicaciones y recursos
8. **Aviso de Privacidad** (`/privacy`) - Política de privacidad

## 🔧 Configuración de Desarrollo

### Variables de Entorno
No se requieren variables de entorno para desarrollo local.

### Estructura de Componentes
Los componentes están organizados de forma modular:
- Componentes reutilizables en `src/components/`
- Páginas en `src/pages/`
- Estilos globales en `src/styles/`
- Assets estáticos en `static/`

## 📦 Despliegue

El proyecto está configurado para desplegarse en **Firebase Hosting**.

### Configuración del Proyecto Firebase

- **Nombre del Proyecto**: CertificacionMontessori
- **ID del Proyecto**: certificacionmontessori
- **Número del Proyecto**: 77935287015
- **Organización**: asociacionmontessori.mx

### Comandos de Despliegue

#### Primer Despliegue
```bash
# 1. Asegúrate de estar autenticado
npm run firebase:login

# 2. Seleccionar el proyecto (si no está seleccionado)
npm run firebase:use

# 3. Build y deploy
npm run deploy
```

#### Despliegues Subsecuentes
```bash
# Deploy a producción
npm run deploy

# O paso a paso
npm run build
firebase deploy --only hosting
```

#### Deploy de Preview (canales)
```bash
npm run deploy:preview
```

### Scripts Disponibles para Firebase

- `npm run deploy` - Build y deploy a producción
- `npm run deploy:preview` - Deploy a canal de preview
- `npm run firebase:login` - Autenticarse en Firebase
- `npm run firebase:use` - Seleccionar proyecto Firebase

### Configuración de Firebase Hosting

El archivo `firebase.json` está configurado con:
- **Directorio público**: `public` (generado por Gatsby build)
- **Rewrites**: Todas las rutas se redirigen a `index.html` (SPA)
- **Headers de caché**: Optimizados para assets estáticos
- **Cache-Control**: Configurado para mejor performance

### URLs del Proyecto

Después del deploy, el sitio estará disponible en:
- **URL Principal**: `https://certificacionmontessori.web.app`
- **URL Alternativa**: `https://certificacionmontessori.firebaseapp.com`

### Integración Continua

Para configurar CI/CD con GitHub Actions, puedes usar el siguiente flujo:
1. Build del proyecto
2. Deploy automático a Firebase Hosting
3. Notificaciones de estado del deploy

## 🤝 Contribución

Este es un proyecto de la Asociación Montessori de México A.C. Para contribuciones, por favor contacta al equipo de desarrollo.

## 📄 Licencia

Proyecto privado de la Asociación Montessori de México A.C.

## 📞 Contacto

- **WhatsApp**: [Contactar por WhatsApp](https://api.whatsapp.com/send?phone=5215548885013)
- **Sitio Web**: [montessorimexico.org](https://montessorimexico.org)
- **Facebook**: [GuiasMontessori](https://www.facebook.com/GuiasMontessori)

## 🎓 Sobre la Asociación Montessori de México

La Asociación Montessori de México A.C. es una organización civil dedicada a promover la educación Montessori en México, ofreciendo certificaciones internacionales y programas de formación para educadores.

---

**Versión**: 0.1.0  
**Última actualización**: 2024  
**Desarrollado con ❤️ para la comunidad Montessori**
