# 🔑 Cómo Obtener las Credenciales de Firebase

## Pasos para obtener las credenciales:

1. Ve a la consola de Firebase:
   https://console.firebase.google.com/project/certificacionmontessori/settings/general

2. Haz clic en el ícono de engranaje ⚙️ (Configuración del proyecto) → "Configuración del proyecto"

3. Desplázate hasta la sección "Tus aplicaciones"

4. Si ya tienes una aplicación web:
   - Haz clic en ella
   - Copia los valores de configuración

5. Si NO tienes una aplicación web:
   - Haz clic en el ícono `</>` (Agregar app web)
   - Dale un nombre (ej: "Portal de Alumnos")
   - Haz clic en "Registrar app"
   - Copia los valores de configuración

## Configuración que necesitas:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // ← VITE_FIREBASE_API_KEY
  authDomain: "certificacionmontessori.firebaseapp.com",  // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "certificacionmontessori",
  storageBucket: "certificacionmontessori.appspot.com",   // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "77935287015",  // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:77935287015:web:..."     // ← VITE_FIREBASE_APP_ID
};
```

## Actualizar el archivo .env

Edita el archivo `.env` en `alumnos-app/` y reemplaza los valores:

```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=certificacionmontessori.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=certificacionmontessori.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=77935287015
VITE_FIREBASE_APP_ID=tu_app_id_aqui
```

