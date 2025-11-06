# ⚡ Configuración Rápida de Email - Cloud Functions

## ✅ Estado Actual

- ✅ Sistema de notificaciones desplegado
- ✅ Cloud Functions configurado y listo
- ✅ Dependencias instaladas
- ⏳ **PENDIENTE**: Configurar credenciales de email

## 🚀 Configuración en 3 Pasos

### Paso 1: Obtener Credenciales de Gmail

Como tienes Google Workspace, vamos a usar Gmail:

1. **Activa Verificación en Dos Pasos** (si no está activada):
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"

2. **Genera Contraseña de Aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona:
     - **App**: Correo
     - **Device**: Otro (nombre personalizado)
     - **Name**: `Firebase Functions`
   - Haz clic en "Generar"
   - **Copia la contraseña de 16 caracteres** (guárdala, la necesitarás)

### Paso 2: Configurar en Firebase

Ejecuta estos comandos (reemplaza con tu email y la contraseña generada):

```bash
cd alumnos-app

# Configurar tu email
firebase functions:config:set email.user="tu-email@certificacionmontessori.com"

# Configurar la contraseña de aplicación (la de 16 caracteres)
firebase functions:config:set email.pass="xxxx xxxx xxxx xxxx"
```

**Ejemplo:**
```bash
firebase functions:config:set email.user="admin@certificacionmontessori.com"
firebase functions:config:set email.pass="abcd efgh ijkl mnop"
```

### Paso 3: Verificar y Desplegar

```bash
# Verificar que se configuró correctamente
firebase functions:config:get

# Deberías ver algo como:
# {
#   "email": {
#     "pass": "xxxx xxxx xxxx xxxx",
#     "user": "tu-email@certificacionmontessori.com"
#   }
# }

# Desplegar Functions
firebase deploy --only functions

# Ver logs para verificar
firebase functions:log
```

## 🎯 Verificar que Funciona

1. **Ve al Dashboard de Admin**: https://alumnos.certificacionmontessori.com/admin ✅
2. Si hay materias próximas, verás la alerta
3. Haz clic en "Enviar Email"
4. Revisa tu correo

## 📋 Script de Ayuda

También puedes usar el script interactivo:

```bash
cd alumnos-app/functions
./configurar-email.sh
```

## 🔍 Verificar Email del Admin

El sistema enviará emails al email configurado en Firestore:

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore
2. Colección: `admins`
3. Verifica que el documento del admin tenga un campo `email` válido

## ❓ Troubleshooting

### Error: "Invalid login"
- Verifica que usaste una **Contraseña de aplicación**, no tu contraseña normal
- Asegúrate de que la verificación en dos pasos esté activada

### No se envían emails
1. Revisa los logs: `firebase functions:log`
2. Verifica en Firestore la colección `emails_pendientes`
3. Revisa el estado del documento

### Cambiar email del admin
Si necesitas cambiar el email al que se envían las notificaciones:
1. Ve a Firestore
2. Colección: `admins`
3. Edita el documento del admin
4. Actualiza el campo `email`

## 📧 Formato del Email

Los emails incluyen:
- Lista de todas las materias próximas (7 días o menos)
- Información del alumno
- Fecha de inicio
- Días restantes
- Nivel del alumno
- Color código por urgencia (rojo: ≤3 días, amarillo: 4-5 días, azul: 6-7 días)

---

**¡Listo!** Una vez configuradas las credenciales y desplegadas las Functions, el sistema enviará emails automáticamente cuando detecte materias próximas.

