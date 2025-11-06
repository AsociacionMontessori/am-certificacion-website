# 🚀 Pasos Rápidos para Configurar el Portal de Alumnos

## Paso 1: Obtener Credenciales de Firebase (5 minutos)

### Opción A: Si ya tienes una app web en Firebase
1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/settings/general
2. En "Tus aplicaciones", haz clic en tu app web
3. Copia los valores de `apiKey` y `appId`

### Opción B: Crear nueva app web
1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/settings/general
2. Haz clic en el ícono `</>` (Agregar app)
3. Nombre: "Portal de Alumnos"
4. Haz clic en "Registrar app"
5. Copia los valores de configuración

## Paso 2: Actualizar .env

Edita el archivo `.env` en `alumnos-app/` y reemplaza:

```env
VITE_FIREBASE_API_KEY=tu_api_key_real_aqui
VITE_FIREBASE_APP_ID=tu_app_id_real_aqui
```

Los otros valores ya están correctos:
- `VITE_FIREBASE_AUTH_DOMAIN=certificacionmontessori.firebaseapp.com` ✅
- `VITE_FIREBASE_STORAGE_BUCKET=certificacionmontessori.appspot.com` ✅
- `VITE_FIREBASE_MESSAGING_SENDER_ID=77935287015` ✅

## Paso 3: Configurar Dominio en Firebase Console

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. Encuentra el sitio **"alumnos-certificacionmontessori"**
3. Haz clic en los **3 puntos (⋮)** → **"Agregar dominio personalizado"**
4. Ingresa: `alumnos.certificacionmontessori.com`
5. Sigue las instrucciones que Firebase te dé

**IMPORTANTE:** Si Firebase te pide un registro CNAME, debe ser:
```
Nombre: alumnos
Valor: alumnos-certificacionmontessori.web.app
```

## Paso 4: Deploy

Una vez que tengas las credenciales en `.env`:

```bash
cd alumnos-app
npm run deploy
```

## ✅ Checklist Final

- [ ] Credenciales de Firebase en `.env`
- [ ] Dominio agregado en Firebase Console
- [ ] DNS configurado en Siteground
- [ ] Deploy completado

