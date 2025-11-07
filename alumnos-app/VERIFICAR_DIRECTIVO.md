# 🔍 Verificar y Corregir Usuario Directivo

## ⚠️ Problema: Usuario directivo ve vista de alumnos

Si al iniciar sesión con un usuario directivo ves la vista de alumnos en lugar del panel de administración, sigue estos pasos:

## 🔎 Paso 1: Verificar el UID del Usuario

1. Ve a Firebase Console → Authentication
2. Busca el usuario `directivos@certificacionmontessori.com`
3. **Copia el UID** del usuario (es un string largo como `abc123def456...`)

## 🔎 Paso 2: Verificar el Documento en Firestore

1. Ve a Firebase Console → Firestore Database
2. Busca la colección `directivos`
3. Verifica que exista un documento con **ID = UID del usuario** (el que copiaste en el paso 1)

### ❌ Problema Común

Si creaste el documento manualmente, es posible que:
- El ID del documento sea diferente al UID del usuario
- El documento no exista
- El documento esté en otra colección

### ✅ Solución: Crear/Corregir el Documento

1. **Obtén el UID del usuario:**
   - Firebase Console → Authentication
   - Busca `directivos@certificacionmontessori.com`
   - Copia el UID

2. **Crea o edita el documento en Firestore:**
   - Ve a Firestore Database
   - Colección: `directivos`
   - **ID del documento**: Debe ser EXACTAMENTE el UID del usuario (no otro nombre)
   - Campos del documento:
     ```javascript
     {
       nombre: "Directivo",
       email: "directivos@certificacionmontessori.com",
       rol: "directivo",
       fechaCreacion: [Timestamp actual],
       activo: true
     }
     ```

## 🔧 Paso 3: Verificar en la Consola del Navegador

1. Abre la consola del navegador (F12)
2. Inicia sesión con el usuario directivo
3. Revisa los mensajes en la consola:
   - Si ves: `✅ Usuario directivo detectado` → El documento existe y está correcto
   - Si ves: `⚠️ Usuario no encontrado en directivos. UID: ...` → El documento no existe o el UID no coincide

## 📋 Estructura Correcta del Documento

```javascript
// Colección: directivos
// ID del documento: [UID del usuario de Firebase Authentication]

{
  nombre: "Nombre del Directivo",
  email: "directivos@certificacionmontessori.com",
  rol: "directivo",  // IMPORTANTE: debe ser exactamente "directivo"
  fechaCreacion: Timestamp,
  activo: true
}
```

## ✅ Verificación Rápida

1. **UID coincide:**
   - Authentication UID = `abc123...`
   - Firestore documento ID = `abc123...` ✅

2. **Colección correcta:**
   - Documento está en colección `directivos` ✅

3. **Campo rol:**
   - Campo `rol` = `"directivo"` (exactamente, sin mayúsculas) ✅

## 🚨 Si el Problema Persiste

1. Abre la consola del navegador (F12)
2. Inicia sesión
3. Revisa los mensajes de error o advertencia
4. Verifica que el UID en los mensajes coincida con el UID del documento en Firestore

## 💡 Crear Usuario Directivo desde la Aplicación (Recomendado)

La forma más fácil es crear el usuario desde la aplicación:

1. Inicia sesión como **Administrador**
2. Ve a **Crear Usuario**
3. Selecciona tipo: **Directivo**
4. Completa nombre, email y contraseña
5. Haz clic en **Crear Usuario**

Esto creará automáticamente:
- El usuario en Firebase Authentication
- El documento en Firestore con el UID correcto
- Todos los campos necesarios

