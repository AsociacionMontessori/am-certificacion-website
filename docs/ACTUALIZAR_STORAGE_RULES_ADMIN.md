# 🔒 Actualizar Reglas de Storage para Permitir Admin Subir Comprobantes

## ⚠️ Problema

El admin no puede subir comprobantes de pago porque las reglas de Storage no lo permiten.

## ✅ Solución

Actualizar las reglas de Storage para permitir que los admins puedan escribir (subir) comprobantes.

## 📝 Pasos para Actualizar

### Opción 1: Desde la Consola de Firebase (Recomendado)

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/storage/rules

2. **Reemplaza** todo el contenido con las siguientes reglas:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // Función helper para verificar si el usuario es admin
    function isAdmin() {
      return request.auth != null && 
             firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario es directivo
    function isDirectivo() {
      return request.auth != null && 
             firestore.exists(/databases/(default)/documents/directivos/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario es grupos
    function isGrupos() {
      return request.auth != null && 
             firestore.exists(/databases/(default)/documents/grupos/$(request.auth.uid));
    }
    
    // Función helper para verificar si el usuario puede leer un alumno específico
    function canReadAlumno(alumnoId) {
      return isAdmin() || 
             isDirectivo() || 
             (isGrupos() && alumnoId in firestore.get(/databases/(default)/documents/grupos/$(request.auth.uid)).data.alumnosAsignados);
    }
    
    // Comprobantes de pago
    match /comprobantes/{alumnoId}/{archivo} {
      // El alumno puede leer y escribir en su propia carpeta
      allow read: if request.auth != null && request.auth.uid == alumnoId;
      allow write: if request.auth != null && 
                     request.auth.uid == alumnoId &&
                     request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                     request.resource.contentType.matches('image/.*|application/pdf');
      
      // Admin, directivo y grupos pueden leer todos los comprobantes
      allow read: if isAdmin() || isDirectivo() || canReadAlumno(alumnoId);
      
      // ✅ NUEVO: Admin puede escribir (subir) comprobantes para cualquier alumno
      allow write: if isAdmin() &&
                     request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                     request.resource.contentType.matches('image/.*|application/pdf');
      
      // Solo admin puede eliminar comprobantes
      allow delete: if isAdmin();
    }
    
    // Denegar acceso a todo lo demás
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Haz clic en **"Publicar"**

4. Espera unos segundos a que se publiquen las reglas

5. **¡Listo!** Ahora el admin puede subir comprobantes

## 🔍 Cambios Realizados

Se agregó una nueva regla `allow write` que permite que los administradores suban comprobantes:

```javascript
// Admin puede escribir (subir) comprobantes para cualquier alumno
allow write: if isAdmin() &&
               request.resource.size < 5 * 1024 * 1024 && // Max 5MB
               request.resource.contentType.matches('image/.*|application/pdf');
```

## ✅ Verificación

1. Intenta subir un comprobante desde `/admin/pagos`
2. Selecciona un pago y haz clic en "Subir Comprobante"
3. Selecciona un archivo (JPG, PNG o PDF, máx. 5MB)
4. Haz clic en "Subir"
5. Debería funcionar sin errores

## 📝 Notas

- Las reglas permiten que:
  - **Alumnos**: Suban comprobantes solo en su propia carpeta
  - **Admin**: Suba, lea y elimine comprobantes de cualquier alumno
  - **Directivo**: Lea comprobantes de todos los alumnos
  - **Grupos**: Lean comprobantes de alumnos asignados

- El tamaño máximo de archivo es 5MB
- Solo se permiten imágenes (JPG, PNG) y PDFs
- Las reglas se aplican inmediatamente después de publicar

