# 📧 Configuración de Notificaciones por Email

Este documento explica cómo configurar el sistema de notificaciones por email para materias próximas a iniciar.

## 🎯 Funcionalidad

El sistema detecta automáticamente cuando las materias de los alumnos están a 7 días o menos de iniciar y:

1. **Muestra alertas en el Dashboard de Admin** en tiempo real
2. **Envía emails automáticamente** al administrador con la lista de materias próximas

## 📋 Requisitos Previos

1. Firebase Functions configurado en tu proyecto
2. Cuenta de email para enviar notificaciones (Gmail, SendGrid, etc.)
3. Node.js y Firebase CLI instalados

## 🚀 Configuración Paso a Paso

### 1. Configurar Firebase Functions

Si aún no tienes Functions configurado:

```bash
cd alumnos-app
npm install -g firebase-tools
firebase login
firebase init functions
```

Selecciona:
- TypeScript o JavaScript (recomendado JavaScript para simplicidad)
- ESLint: Sí
- Install dependencies: Sí

### 2. Instalar Dependencias

```bash
cd functions
npm install nodemailer
npm install firebase-functions firebase-admin
cd ..
```

### 3. Configurar Credenciales de Email

#### Opción A: Usar Gmail (Recomendado para Google Workspace)

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en dos pasos
3. Genera una "Contraseña de aplicación":
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Ingresa "Firebase Functions"
   - Copia la contraseña generada

4. Configura las variables de entorno:

```bash
# Desde la raíz del proyecto
firebase functions:config:set email.user="tu-email@gmail.com"
firebase functions:config:set email.pass="tu-contraseña-de-aplicacion"
```

#### Opción B: Usar SendGrid

1. Crea una cuenta en SendGrid: https://sendgrid.com/
2. Genera una API Key
3. Configura las variables:

```bash
firebase functions:config:set email.user="apikey"
firebase functions:config:set email.pass="tu-api-key-de-sendgrid"
```

### 4. Actualizar el Código de Functions

El archivo `functions/index.js` ya está creado con el código necesario. Si necesitas personalizar el transporter, edita la sección:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail', // o 'sendgrid', etc.
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.pass || process.env.EMAIL_PASS
  }
});
```

Para SendGrid, usa:

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

### 5. Desplegar Functions

```bash
firebase deploy --only functions
```

### 6. Verificar que Funciona

1. Ve al Dashboard de Admin
2. Si hay materias próximas, verás la alerta
3. Haz clic en "Enviar Email"
4. Verifica que recibiste el email

## 📊 Estructura de Datos

### Colección: `emails_pendientes`

Firestore guarda los emails pendientes de enviar:

```javascript
{
  to: "admin@certificacionmontessori.com",
  subject: "⚠️ Materias Próximas a Iniciar - 3 materia(s) requieren atención",
  html: "<html>...</html>",
  text: "Texto plano...",
  tipo: "materias_proximas",
  materiasCount: 3,
  fechaCreacion: Timestamp,
  estado: "pendiente", // "pendiente" | "enviado" | "fallido" | "reintentando"
  intentos: 0
}
```

### Colección: `notificaciones_historial`

Historial de todas las notificaciones enviadas:

```javascript
{
  tipo: "materias_proximas",
  email: "admin@certificacionmontessori.com",
  materiasCount: 3,
  materias: [...],
  fechaEnvio: Timestamp,
  estado: "enviado"
}
```

## 🔄 Funcionamiento Automático

### Verificación Diaria

Hay una Cloud Function programada que se ejecuta **diariamente a las 9:00 AM** (hora de México):

- Verifica todas las materias con fecha de inicio en los próximos 7 días
- Si encuentra materias próximas, envía un email automáticamente al administrador
- El email solo se envía si hay materias que requieren atención

### Verificación en Tiempo Real

El componente `AlertasMateriasProximas` verifica cada 5 minutos si hay nuevas materias próximas y actualiza la alerta en el Dashboard.

## 🛠️ Troubleshooting

### El email no se envía

1. **Verifica las credenciales:**
   ```bash
   firebase functions:config:get
   ```

2. **Revisa los logs:**
   ```bash
   firebase functions:log
   ```

3. **Verifica el estado en Firestore:**
   - Ve a la consola de Firebase
   - Revisa la colección `emails_pendientes`
   - Si el estado es "fallido", revisa el campo `error`

### Error: "Invalid login"

- Para Gmail: Asegúrate de usar una "Contraseña de aplicación", no tu contraseña normal
- Verifica que la verificación en dos pasos esté activada

### La función programada no se ejecuta

1. Verifica que la función esté desplegada:
   ```bash
   firebase functions:list
   ```

2. Verifica los logs:
   ```bash
   firebase functions:log --only verificarMateriasProximas
   ```

## 🔐 Seguridad

- **Nunca commits las credenciales** en el código
- Usa `firebase functions:config:set` para configurar secretos
- Para producción, considera usar Secret Manager de Google Cloud

## 📝 Personalización

### Cambiar el horario de verificación

Edita `functions/index.js`:

```javascript
exports.verificarMateriasProximas = functions.pubsub
  .schedule('0 9 * * *') // Cambia esto (formato cron)
  .timeZone('America/Mexico_City')
```

Formato cron: `minuto hora día mes día-semana`
- `0 9 * * *` = 9:00 AM diario
- `0 8,20 * * *` = 8:00 AM y 8:00 PM diario
- `0 9 * * 1` = 9:00 AM todos los lunes

### Cambiar el rango de días

Edita `alumnos-app/src/services/notificacionesService.js`:

```javascript
fechaLimite.setDate(fechaLimite.getDate() + 7); // Cambia el 7 por el número de días deseado
```

## ✅ Checklist de Configuración

- [ ] Firebase Functions inicializado
- [ ] Dependencias instaladas (`nodemailer`, etc.)
- [ ] Credenciales de email configuradas
- [ ] Functions desplegadas
- [ ] Verificación manual exitosa
- [ ] Email recibido correctamente
- [ ] Función programada ejecutándose

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs de Firebase Functions
2. La consola de Firestore para ver el estado de los emails
3. La configuración de credenciales

---

**Nota:** Si no quieres configurar Cloud Functions, el sistema también funciona usando `mailto:` que abre tu cliente de email predeterminado, aunque esto requiere acción manual del usuario.

