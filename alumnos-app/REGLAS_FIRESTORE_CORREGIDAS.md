# 🔒 Reglas de Firestore CORREGIDAS - Solución Inmediata

## ⚠️ Problema Actual
Error: "Missing or insufficient permissions" al intentar leer el documento de admin.

## ✅ Solución

### Reglas Corregidas para Firestore

Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/rules

**COPIA Y PEGA ESTAS REGLAS COMPLETAS:**

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
    // PERMITE que un usuario lea su propio documento de admin
    match /admins/{adminId} {
      // Cualquier usuario autenticado puede leer SU PROPIO documento
      allow read: if request.auth != null && request.auth.uid == adminId;
      // Solo desde Admin SDK o consola
      allow write: if false;
    }
    
    // Colección: alumnos
    match /alumnos/{alumnoId} {
      // El alumno puede leer/editar su propio documento
      allow read, write: if isOwnAlumno(alumnoId) || isAdmin();
    }
    
    // Colección: materias
    match /materias/{materiaId} {
      // Alumnos solo pueden leer sus propias materias
      allow read: if request.auth != null && 
                     resource.data.alumnoId == request.auth.uid;
      // Admin puede leer todas y escribir
      allow read, write: if isAdmin();
    }
    
    // Colección: calificaciones
    match /calificaciones/{calificacionId} {
      // Alumnos solo pueden leer sus propias calificaciones
      allow read: if request.auth != null && 
                     resource.data.alumnoId == request.auth.uid;
      // Admin puede leer todas y escribir
      allow read, write: if isAdmin();
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
    }
    
    // Denegar acceso a todo lo demás por defecto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📋 Pasos para Aplicar

1. **Ve a Firestore Rules:**
   https://console.firebase.google.com/project/certificacionmontessori/firestore/rules

2. **Elimina TODO el contenido actual** del editor de reglas

3. **Copia y pega** las reglas de arriba completas

4. **Haz clic en "Publicar"** (botón azul arriba a la derecha)

5. **Espera unos segundos** para que las reglas se propaguen

6. **Recarga la página** en localhost y prueba de nuevo

## 🔍 Verificación

Después de aplicar las reglas:
- Recarga la página en localhost
- Inicia sesión
- Deberías ver en la consola: `✅ Admin encontrado:`
- Deberías ser redirigido a `/admin`

## ⚠️ Nota Importante

La regla clave es esta:
```javascript
match /admins/{adminId} {
  allow read: if request.auth != null && request.auth.uid == adminId;
}
```

Esto permite que **cualquier usuario autenticado pueda leer su propio documento** en la colección `admins` si el ID del documento coincide con su UID.

