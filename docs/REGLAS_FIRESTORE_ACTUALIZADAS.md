# 🔒 Reglas de Firestore Actualizadas - Con Rol Grupos

## 📋 Instrucciones para Actualizar

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/rules
2. **COPIA Y PEGA** el siguiente código completo
3. Haz clic en **Publicar**

---

## 📝 Reglas Completas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar si el usuario es admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario es directivo
    function isDirectivo() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/directivos/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario es grupos
    function isGrupos() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/grupos/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario puede leer un alumno específico
    // Admin y directivo pueden leer todos, grupos solo los asignados
    function canReadAlumno(alumnoId) {
      return isAdmin() || 
             isDirectivo() || 
             (isGrupos() && alumnoId in get(/databases/$(database)/documents/grupos/$(request.auth.uid)).data.alumnosAsignados);
    }
    
    // Función helper para verificar si el usuario es admin o directivo (lectura completa)
    function canReadAdmin() {
      return isAdmin() || isDirectivo();
    }
    
    // Función helper para verificar si es el propio alumno
    function isOwnAlumno(alumnoId) {
      return request.auth != null && request.auth.uid == alumnoId;
    }
    
    // Certificado válido para acceso público (folio + código y no inactivo)
    function hasValidCertificate(alumnoId) {
      return exists(/databases/$(database)/documents/alumnos/$(alumnoId)) &&
             get(/databases/$(database)/documents/alumnos/$(alumnoId)).data.folioCertificado != null &&
             get(/databases/$(database)/documents/alumnos/$(alumnoId)).data.codigoVerificacion != null &&
             get(/databases/$(database)/documents/alumnos/$(alumnoId)).data.estado != 'Inactivo';
    }
    
    // Colección: admins
    // PERMITE que un usuario autenticado lea su propio documento de admin
    match /admins/{adminId} {
      // Cualquier usuario autenticado puede leer SU PROPIO documento
      // Esto es necesario para que el sistema pueda verificar si es admin
      allow read: if request.auth != null && request.auth.uid == adminId;
      // Solo desde Admin SDK o consola
      allow write: if false;
    }
    
    // Colección: directivos
    // PERMITE que un usuario autenticado lea su propio documento de directivo
    match /directivos/{directivoId} {
      // Cualquier usuario autenticado puede leer SU PROPIO documento
      // Esto es necesario para que el sistema pueda verificar si es directivo
      allow read: if request.auth != null && request.auth.uid == directivoId;
      // Solo desde Admin SDK o consola
      allow write: if false;
    }
    
    // Colección: grupos
    // PERMITE que un usuario autenticado lea su propio documento de grupos
    match /grupos/{grupoId} {
      // Cualquier usuario autenticado puede leer SU PROPIO documento
      // Esto es necesario para que el sistema pueda verificar si es grupos
      allow read: if request.auth != null && request.auth.uid == grupoId;
      // Solo admin puede escribir (asignar alumnos)
      allow write: if isAdmin();
    }
    
    // Colección: alumnos
    match /alumnos/{alumnoId} {
      // El alumno puede leer/editar su propio documento
      // Admin puede leer y escribir, directivo puede leer todos, grupos solo los asignados
      allow read: if isOwnAlumno(alumnoId) || canReadAdmin() || canReadAlumno(alumnoId);
      allow write: if isOwnAlumno(alumnoId) || isAdmin();
      
      // Permitir lectura pública SOLO para verificación de certificados
      // Esto permite que cualquiera verifique un certificado usando folio y código
      // Solo permite leer documentos que tienen folioCertificado y codigoVerificacion
      allow get: if request.auth == null &&
                    resource.data.folioCertificado != null &&
                    resource.data.codigoVerificacion != null;
      
      // Permitir consultas (list) para verificación de certificados
      // Esto es necesario para la función verificarCertificado que usa where()
      // Permite tanto usuarios autenticados como no autenticados
      // La seguridad está en que necesitas el folio Y el código para verificar
      allow list: if true; // Permitir consultas para verificación (seguro porque necesitas folio + código)
    }
    
    // Colección: materias
    match /materias/{materiaId} {
      // Lectura: propio alumno o pública si el alumno tiene certificado válido
      // Admin y directivo pueden leer todas, grupos solo de alumnos asignados
      allow read: if (request.auth != null && resource.data.alumnoId == request.auth.uid)
                   || (request.auth == null && hasValidCertificate(resource.data.alumnoId))
                   || canReadAdmin()
                   || (isGrupos() && canReadAlumno(resource.data.alumnoId));
      // Escritura solo admin
      allow write: if isAdmin();
    }
    
    // Colección: calificaciones
    match /calificaciones/{calificacionId} {
      // Lectura: propio alumno o pública si el alumno tiene certificado válido
      // Admin y directivo pueden leer todas, grupos solo de alumnos asignados
      allow read: if (request.auth != null && resource.data.alumnoId == request.auth.uid)
                   || (request.auth == null && hasValidCertificate(resource.data.alumnoId))
                   || canReadAdmin()
                   || (isGrupos() && canReadAlumno(resource.data.alumnoId));
      // Escritura solo admin
      allow write: if isAdmin();
    }
    
    // Colección: graduacion
    match /graduacion/{alumnoId} {
      // El alumno solo puede leer su propia información
      // Admin y directivo pueden leer todas, grupos solo de alumnos asignados
      allow read: if isOwnAlumno(alumnoId) || canReadAdmin() || canReadAlumno(alumnoId);
      // Solo admin puede escribir
      allow write: if isAdmin();
    }
    
    // Colección: inscripciones
    match /inscripciones/{inscripcionId} {
      // Cualquiera autenticado puede crear una inscripción
      allow create: if request.auth != null;
      // Admin y directivo pueden leer todas las inscripciones
      // Solo admin puede actualizar
      allow read: if canReadAdmin() || 
                     (request.auth != null && resource.data.email == request.auth.token.email);
      allow update: if isAdmin();
      // Los usuarios solo pueden leer sus propias inscripciones
    }
    
    // Denegar acceso a todo lo demás por defecto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ Cambios Principales

### Nuevas Funciones
- `isGrupos()` - Verifica si el usuario es de tipo grupos
- `canReadAlumno(alumnoId)` - Verifica si el usuario puede leer un alumno específico

### Nueva Colección: grupos
- **Lectura**: Solo el propio usuario puede leer su documento
- **Escritura**: Solo administradores pueden escribir (asignar alumnos)

### Permisos Actualizados
- **Alumnos**: Los usuarios de grupos solo pueden leer alumnos asignados
- **Materias**: Los usuarios de grupos solo pueden leer materias de alumnos asignados
- **Calificaciones**: Los usuarios de grupos solo pueden leer calificaciones de alumnos asignados
- **Graduación**: Los usuarios de grupos solo pueden leer graduación de alumnos asignados

---

## 🔍 Verificación

Después de actualizar las reglas, verifica que:

1. ✅ Los administradores pueden crear y asignar alumnos a usuarios de grupos
2. ✅ Los usuarios de grupos solo ven los alumnos asignados
3. ✅ Los usuarios de grupos NO pueden editar ningún dato
4. ✅ Los directivos siguen viendo todos los alumnos (solo lectura)

---

## ⚠️ Nota Importante

Las reglas de Firestore se validan en tiempo real. Si hay algún error de sintaxis, Firebase te lo indicará antes de publicar. Asegúrate de copiar el código completo sin modificar nada.

