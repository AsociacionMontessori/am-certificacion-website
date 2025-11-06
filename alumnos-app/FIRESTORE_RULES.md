# 🔒 Reglas de Seguridad de Firestore

## Reglas Completas para el Portal de Alumnos

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar si el usuario es admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Función helper para verificar si es el propio alumno
    function isOwnAlumno(alumnoId) {
      return request.auth != null && request.auth.uid == alumnoId;
    }
    
    // Colección: admins
    // Solo los admins pueden leer (para verificación)
    match /admins/{adminId} {
      allow read: if isAdmin() || request.auth.uid == adminId;
      allow write: if false; // Solo desde Admin SDK o consola
    }
    
    // Colección: alumnos
    match /alumnos/{alumnoId} {
      // El alumno puede leer/editar su propio documento
      allow read, write: if isOwnAlumno(alumnoId) || isAdmin();
      
      // Permitir lectura pública de campos específicos (para vista pública)
      // Esto se maneja mejor con una colección separada o campos específicos
    }
    
    // Colección: materias
    match /materias/{materiaId} {
      // Alumnos solo pueden leer sus propias materias
      allow read: if request.auth != null && 
                     resource.data.alumnoId == request.auth.uid;
      // Admin puede leer todas y escribir
      allow read, write: if isAdmin();
      // Los alumnos no pueden escribir
      allow write: if false;
    }
    
    // Colección: calificaciones
    match /calificaciones/{calificacionId} {
      // Alumnos solo pueden leer sus propias calificaciones
      allow read: if request.auth != null && 
                     resource.data.alumnoId == request.auth.uid;
      // Admin puede leer todas y escribir
      allow read, write: if isAdmin();
      // Los alumnos no pueden escribir
      allow write: if false;
    }
    
    // Colección: graduacion
    match /graduacion/{alumnoId} {
      // El alumno solo puede leer su propia información
      allow read: if isOwnAlumno(alumnoId) || isAdmin();
      // Solo admin puede escribir
      allow write: if isAdmin();
    }
    
    // Colección: inscripciones
    match /inscripciones/{inscripcionId} {
      // Cualquiera autenticado puede crear una inscripción
      allow create: if request.auth != null;
      // Solo el admin puede leer y actualizar
      allow read, update: if isAdmin();
      // Los usuarios solo pueden leer sus propias inscripciones
      allow read: if request.auth != null && 
                     resource.data.email == request.auth.token.email;
      // No se pueden eliminar inscripciones
      allow delete: if false;
    }
    
    // Denegar acceso a todo lo demás por defecto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📋 Índices Necesarios en Firestore

### Colección: `materias`
1. **Índice compuesto:**
   - Campo 1: `alumnoId` (Ascending)
   - Campo 2: `dia` (Ascending)
   - Campo 3: `horaInicio` (Ascending)

### Colección: `calificaciones`
1. **Índice compuesto:**
   - Campo 1: `alumnoId` (Ascending)
   - Campo 2: `periodo` (Descending)
   - Campo 3: `materia` (Ascending)

### Colección: `inscripciones`
1. **Índice compuesto:**
   - Campo 1: `estado` (Ascending)
   - Campo 2: `fechaInscripcion` (Descending)

## 🔧 Cómo Aplicar las Reglas

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/rules
2. Copia y pega las reglas de arriba
3. Haz clic en "Publicar"

## 📝 Notas Importantes

- Las reglas usan una función `isAdmin()` que verifica si existe un documento en la colección `admins` con el UID del usuario
- Para crear un admin, debes crear manualmente un documento en la colección `admins` con el UID del usuario de Firebase Auth
- Los índices se crean automáticamente cuando Firebase detecta que son necesarios, o puedes crearlos manualmente desde la consola

## 🆘 Solución de Problemas

Si ves errores de "Missing or insufficient permissions":
1. Verifica que el usuario esté autenticado
2. Verifica que el usuario tenga el rol correcto (admin o alumno)
3. Verifica que el documento en `admins` o `alumnos` exista con el UID correcto
4. Revisa la consola de Firebase para ver qué regla está fallando

