# 🎓 Configuración del Portal de Alumnos

## 📋 Resumen

Se ha creado una aplicación completa para el portal de alumnos en `alumnos-app/` que incluye:

- ✅ Autenticación con Firebase Auth
- ✅ Dashboard principal
- ✅ Vista de expediente del alumno
- ✅ Calendario de materias
- ✅ Calificaciones y promedios
- ✅ Información de graduación
- ✅ Diseño Mobile-First con Tailwind CSS
- ✅ Integración completa con Firestore

## 🚀 Pasos para Configurar el Subdominio

### 1. Crear el sitio en Firebase Hosting

```bash
cd alumnos-app
firebase hosting:sites:create alumnos
```

### 2. Configurar Firebase Hosting

El archivo `firebase.json` ya está configurado en `alumnos-app/firebase.json` con:
- Site ID: `alumnos`
- Directorio público: `dist` (generado por Vite)

### 3. Agregar dominio personalizado en Firebase Console

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. Haz clic en "Agregar dominio personalizado"
3. Ingresa: `alumnos.certificacionmontessori.com`
4. Firebase te dará instrucciones para configurar DNS

### 4. Configurar DNS en Siteground

Agrega un registro **CNAME**:

```
Tipo: CNAME
Nombre: alumnos
Valor: alumnos.certificacionmontessori.web.app
TTL: 3600 (o por defecto)
```

**O si Firebase requiere un registro A**, usa la IP que te proporcione Firebase.

### 5. Configurar Variables de Entorno

1. Obtén las credenciales de Firebase desde:
   https://console.firebase.google.com/project/certificacionmontessori/settings/general

2. Crea el archivo `.env` en `alumnos-app/`:
```bash
cd alumnos-app
cp .env.example .env
# Edita .env con tus credenciales
```

3. Edita `.env` con:
```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=certificacionmontessori.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=certificacionmontessori.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=77935287015
VITE_FIREBASE_APP_ID=tu_app_id_aqui
```

### 6. Build y Deploy

```bash
cd alumnos-app
npm run build
firebase deploy --only hosting:alumnos
```

## 📊 Estructura de Datos en Firestore

### Colección: `alumnos`

Documento ID: `{userId}` (UID del usuario en Firebase Auth)

```javascript
{
  nombre: "Juan Pérez",
  matricula: "2024-001",
  email: "juan@example.com",
  telefono: "+525512345678",
  fechaNacimiento: Timestamp,
  programa: "Diplomado Guía Montessori",
  cohorte: "2024-1",
  fechaIngreso: Timestamp,
  estado: "Activo" // "Activo" | "Inactivo" | "Graduado"
}
```

### Colección: `materias`

```javascript
{
  alumnoId: "userId",
  nombre: "Filosofía Montessori",
  dia: "Lunes", // "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo"
  horaInicio: "09:00",
  horaFin: "11:00",
  profesor: "Dr. María González",
  aula: "A-101"
}
```

**Índices necesarios en Firestore:**
- Colección: `materias`
  - Campo: `alumnoId` (Ascending)
  - Campo: `dia` (Ascending)
  - Campo: `horaInicio` (Ascending)

### Colección: `calificaciones`

```javascript
{
  alumnoId: "userId",
  materia: "Filosofía Montessori",
  periodo: "2024-1",
  calificacion: 95,
  profesor: "Dr. María González"
}
```

**Índices necesarios en Firestore:**
- Colección: `calificaciones`
  - Campo: `alumnoId` (Ascending)
  - Campo: `periodo` (Descending)
  - Campo: `materia` (Ascending)

### Colección: `graduacion`

Documento ID: `{userId}` (debe coincidir con el alumno)

```javascript
{
  materiasCompletadas: true,
  promedioMinimo: true,
  tesisCompletada: false,
  practicasCompletadas: true,
  pagoRealizado: false,
  fechaCeremonia: Timestamp,
  lugarCeremonia: "Auditorio Principal",
  horaCeremonia: "10:00 AM",
  instrucciones: "Llegar 30 minutos antes..."
}
```

## 🔐 Configurar Autenticación

### 1. Habilitar Email/Password en Firebase Auth

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/authentication
2. Habilita "Email/Password" como método de autenticación

### 2. Crear usuarios de prueba

Puedes crear usuarios manualmente desde la consola o usar Firebase Admin SDK.

### 3. Crear documentos en Firestore

Para cada usuario creado en Auth, crea un documento correspondiente en la colección `alumnos` con el mismo UID.

## 🔒 Reglas de Seguridad de Firestore

Agrega estas reglas en Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Alumnos solo pueden leer/editar su propio documento
    match /alumnos/{alumnoId} {
      allow read, write: if request.auth != null && request.auth.uid == alumnoId;
    }
    
    // Materias solo pueden ser leídas por el alumno correspondiente
    match /materias/{materiaId} {
      allow read: if request.auth != null && request.resource.data.alumnoId == request.auth.uid;
      allow write: if false; // Solo lectura para alumnos
    }
    
    // Calificaciones solo pueden ser leídas por el alumno correspondiente
    match /calificaciones/{calificacionId} {
      allow read: if request.auth != null && request.resource.data.alumnoId == request.auth.uid;
      allow write: if false; // Solo lectura para alumnos
    }
    
    // Información de graduación solo puede ser leída por el alumno correspondiente
    match /graduacion/{alumnoId} {
      allow read: if request.auth != null && request.auth.uid == alumnoId;
      allow write: if false; // Solo lectura para alumnos
    }
  }
}
```

## ✅ Checklist de Configuración

- [ ] Crear sitio `alumnos` en Firebase Hosting
- [ ] Configurar dominio personalizado `alumnos.certificacionmontessori.com`
- [ ] Agregar registro CNAME en Siteground
- [ ] Configurar variables de entorno en `.env`
- [ ] Crear índices en Firestore
- [ ] Habilitar Email/Password en Firebase Auth
- [ ] Configurar reglas de seguridad de Firestore
- [ ] Crear usuarios de prueba
- [ ] Crear documentos de prueba en Firestore
- [ ] Hacer build y deploy

## 🐛 Solución de Problemas

### Error: "Firebase: Error (auth/user-not-found)"
- Verifica que el usuario exista en Firebase Authentication
- Verifica que el documento en `alumnos` tenga el mismo UID

### Error: "Missing or insufficient permissions"
- Verifica las reglas de seguridad de Firestore
- Asegúrate de que el usuario esté autenticado

### Error: "The query requires an index"
- Crea los índices necesarios en Firestore
- Firebase te dará un enlace directo para crearlos

### El sitio no carga después del deploy
- Verifica que el build se haya completado correctamente
- Verifica que el directorio `dist` exista
- Verifica la configuración de `firebase.json`

## 📞 Soporte

Para más información, consulta:
- Documentación de Firebase: https://firebase.google.com/docs
- Documentación de React Router: https://reactrouter.com/
- Documentación de Tailwind CSS: https://tailwindcss.com/docs

