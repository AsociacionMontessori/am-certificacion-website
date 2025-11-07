# 🔒 Configurar Reglas de Storage

## Pasos para Configurar las Reglas de Storage

### Opción 1: Desde la Consola de Firebase (Recomendado)

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/storage/rules
2. **Copia y pega** el siguiente código:

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

### Opción 2: Desde la Línea de Comandos

Si tienes problemas con el deploy, puedes copiar el archivo `storage.rules` que está en la raíz del proyecto y pegarlo manualmente en la consola.

## ✅ Verificación

1. Ve a la consola de Storage: https://console.firebase.google.com/project/certificacionmontessori/storage/rules
2. Verifica que las reglas estén publicadas
3. Intenta subir un comprobante desde la aplicación
4. Verifica que el archivo se guarde en `comprobantes/{alumnoId}/{archivo}`

## 📝 Notas

- Las reglas permiten que cada alumno suba comprobantes en su propia carpeta
- El tamaño máximo de archivo es 5MB
- Solo se permiten imágenes (JPG, PNG) y PDFs
- Los administradores pueden leer y eliminar todos los comprobantes
- Los alumnos solo pueden leer y escribir sus propios comprobantes

