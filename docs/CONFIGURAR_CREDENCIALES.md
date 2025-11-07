# 📧 Configuración de Credenciales de Email

## Opción 1: Gmail (Recomendado para Google Workspace)

### Paso 1: Activar Verificación en Dos Pasos
1. Ve a: https://myaccount.google.com/security
2. Busca "Verificación en dos pasos" y actívala si no está activada

### Paso 2: Generar Contraseña de Aplicación
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona:
   - **App**: Correo
   - **Device**: Otro (nombre personalizado)
   - **Name**: "Firebase Functions"
3. Haz clic en "Generar"
4. **Copia la contraseña de 16 caracteres** (la necesitarás en el siguiente paso)

### Paso 3: Configurar Credenciales en Firebase

Ejecuta estos comandos (reemplaza con tus datos):

```bash
cd alumnos-app

# Configurar email de Gmail
firebase functions:config:set email.user="tu-email@certificacionmontessori.com"

# Configurar contraseña de aplicación (la que generaste en el paso anterior)
firebase functions:config:set email.pass="xxxx xxxx xxxx xxxx"
```

**Importante:** Si la contraseña tiene espacios, inclúyelos también. Firebase la guardará correctamente.

### Paso 4: Verificar la Configuración

```bash
firebase functions:config:get
```

Deberías ver:
```
{
  "email": {
    "pass": "xxxx xxxx xxxx xxxx",
    "user": "tu-email@certificacionmontessori.com"
  }
}
```

---

## Opción 2: SendGrid

### Paso 1: Crear Cuenta en SendGrid
1. Ve a: https://sendgrid.com/
2. Crea una cuenta gratuita
3. Verifica tu email

### Paso 2: Crear API Key
1. Ve a: https://app.sendgrid.com/settings/api_keys
2. Haz clic en "Create API Key"
3. Dale un nombre (ej: "Firebase Functions")
4. Selecciona "Full Access" o "Restricted Access" (solo Mail Send)
5. **Copia la API Key** (solo se muestra una vez)

### Paso 3: Configurar en Firebase

```bash
cd alumnos-app

# Para SendGrid, el user siempre es "apikey"
firebase functions:config:set email.user="apikey"

# La contraseña es tu API Key de SendGrid
firebase functions:config:set email.pass="SG.xxxxxxxxxxxxxxxxxxxx"
```

### Paso 4: Actualizar código de Functions

Edita `functions/index.js` y cambia el transporter:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: functions.config().email?.pass || process.env.EMAIL_PASS
  }
});
```

---

## Verificar y Desplegar

Después de configurar las credenciales:

```bash
# 1. Verificar configuración
firebase functions:config:get

# 2. Desplegar Functions
firebase deploy --only functions

# 3. Ver logs para verificar que funciona
firebase functions:log
```

---

## Troubleshooting

### Error: "Invalid login"
- Verifica que las credenciales estén correctas
- Para Gmail: Asegúrate de usar una "Contraseña de aplicación", no tu contraseña normal
- Verifica que la verificación en dos pasos esté activada

### Error: "Unauthorized"
- Para SendGrid: Verifica que la API Key tenga permisos de Mail Send
- Para Gmail: Verifica que la contraseña de aplicación sea correcta

### No se envían emails
1. Revisa los logs: `firebase functions:log`
2. Verifica en Firestore la colección `emails_pendientes`
3. Revisa el estado del documento (debe ser "pendiente")

---

## Email del Administrador

El sistema enviará los emails al email configurado en el documento del administrador en Firestore:
- Colección: `admins`
- Campo: `email`
- Asegúrate de que el admin tenga un email válido

