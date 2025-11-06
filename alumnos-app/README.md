# 🎓 Portal de Alumnos - Asociación Montessori de México

Aplicación web para que los alumnos puedan acceder a su información académica, expedientes, calendarios, calificaciones e información de graduación.

## 📋 Descripción

Esta aplicación permite a los alumnos de la Asociación Montessori de México:
- Acceder a su expediente académico completo
- Consultar su calendario de materias y horarios
- Ver sus calificaciones y promedios
- Revisar información sobre su proceso de graduación

## 🛠️ Tecnologías

- **React 19** - Framework de UI
- **Vite** - Build tool y dev server
- **Firebase Auth** - Autenticación de usuarios
- **Firestore** - Base de datos
- **React Router** - Navegación
- **Tailwind CSS + DaisyUI** - Estilos
- **Heroicons** - Iconos

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase
```

## 🔧 Configuración de Firebase

1. Obtén las credenciales de Firebase desde:
   https://console.firebase.google.com/project/certificacionmontessori/settings/general

2. Crea un archivo `.env` con:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=certificacionmontessori.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=certificacionmontessori.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=77935287015
VITE_FIREBASE_APP_ID=tu_app_id
```

## 📦 Scripts

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Genera build de producción
- `npm run preview` - Previsualiza el build
- `npm run deploy` - Build y deploy a Firebase Hosting
- `npm run firebase:login` - Autenticarse en Firebase
- `npm run firebase:use` - Seleccionar proyecto Firebase

## 🌐 Estructura de Datos en Firestore

### Colección: `alumnos`
```javascript
{
  nombre: string,
  matricula: string,
  email: string,
  telefono: string,
  fechaNacimiento: timestamp,
  programa: string,
  cohorte: string,
  fechaIngreso: timestamp,
  estado: 'Activo' | 'Inactivo' | 'Graduado'
}
```

### Colección: `materias`
```javascript
{
  alumnoId: string,
  nombre: string,
  dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo',
  horaInicio: string,
  horaFin: string,
  profesor: string,
  aula: string
}
```

### Colección: `calificaciones`
```javascript
{
  alumnoId: string,
  materia: string,
  periodo: string,
  calificacion: number,
  profesor: string
}
```

### Colección: `graduacion`
```javascript
{
  materiasCompletadas: boolean,
  promedioMinimo: boolean,
  tesisCompletada: boolean,
  practicasCompletadas: boolean,
  pagoRealizado: boolean,
  fechaCeremonia: timestamp,
  lugarCeremonia: string,
  horaCeremonia: string,
  instrucciones: string
}
```

## 🔐 Autenticación

Los alumnos deben tener una cuenta creada en Firebase Authentication con:
- Email y contraseña
- El UID debe coincidir con el documento en la colección `alumnos`

## 📱 Páginas

- `/login` - Página de inicio de sesión
- `/` - Dashboard principal
- `/expediente` - Expediente del alumno
- `/calendario` - Calendario de materias
- `/calificaciones` - Calificaciones y promedios
- `/graduacion` - Información de graduación

## 🚀 Deploy

### URL de Producción

La aplicación está disponible en:
- **URL Principal**: `https://alumnos.certificacionmontessori.com` ✅
- **URL Alternativa**: `https://alumnos-certificacionmontessori.web.app`

### Configuración de Firebase Hosting

El sitio está configurado en Firebase Hosting:
- **Site ID**: `alumnos-certificacionmontessori`
- **Dominio personalizado**: `alumnos.certificacionmontessori.com` ✅ Configurado

### Deploy a Producción

```bash
npm run deploy
```

El comando anterior realiza:
1. Build de la aplicación
2. Deploy a Firebase Hosting
3. Actualización automática en el dominio personalizado

## 🎨 Paleta de Colores

- **Azul (Blue)**: `#0097B2` - Color principal
- **Amarillo (Yellow)**: `#FBD116` - Acentos
- **Verde (Green)**: `#7ED957` - Éxito
- **Rojo (Red)**: `#D90368` - Acciones importantes
- **Naranja (Orange)**: `#EC6A3D` - Acentos secundarios
- **Gris (Gray)**: `#40424B` - Fondos

## 📝 Notas

- La aplicación está diseñada con enfoque Mobile-First
- Todos los componentes son responsive
- Soporte para modo oscuro
