# 🧪 Cómo Probar las Cloud Functions

## ✅ Estado Actual

Las funciones están desplegadas y funcionando:
- ✅ `enviarEmailNotificacion` - Envía emails cuando se crea un documento en `emails_pendientes`
- ✅ `verificarMateriasProximas` - Verifica diariamente a las 9 AM y envía notificaciones

## 🧪 Probar Manualmente

### Opción 1: Probar desde el Dashboard (Recomendado)

1. **Ve al Dashboard de Admin**: https://alumnos.certificacionmontessori.com/admin
2. Si hay materias próximas, verás la alerta
3. Haz clic en el botón **"Enviar Email"**
4. Esto creará un documento en `emails_pendientes` con estado "pendiente"
5. La función `enviarEmailNotificacion` se ejecutará automáticamente
6. Revisa tu correo en unos segundos

### Opción 2: Crear Documento Manualmente en Firestore

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore
2. Colección: `emails_pendientes`
3. Crea un nuevo documento con estos campos:
   ```json
   {
     "to": "admin@asociacionmontessori.com.mx",
     "subject": "Test - Materias Próximas",
     "html": "<h1>Test</h1><p>Este es un email de prueba</p>",
     "text": "Test - Este es un email de prueba",
     "tipo": "materias_proximas",
     "materiasCount": 0,
     "fechaCreacion": [Timestamp actual],
     "estado": "pendiente",
     "intentos": 0
   }
   ```
4. La función se ejecutará automáticamente y enviará el email

## 📊 Verificar que Funciona

### 1. Ver Logs de las Functions

```bash
# Ver todos los logs
firebase functions:log

# Ver logs de una función específica
firebase functions:log --only enviarEmailNotificacion

# Ver logs en tiempo real
firebase functions:log --follow
```

### 2. Verificar en Firestore

1. Ve a Firestore Console
2. Colección: `emails_pendientes`
3. Verifica que el documento cambió su estado a:
   - `"enviado"` - Si fue exitoso
   - `"fallido"` - Si hubo un error
   - `"reintentando"` - Si está reintentando

### 3. Verificar Historial

1. Colección: `notificaciones_historial`
2. Deberías ver un documento con:
   - `tipo`: "materias_proximas"
   - `estado`: "registrado" o "enviado"
   - `fechaEnvio`: Timestamp

## 🔍 Verificar Credenciales

Si no recibes el email, verifica las credenciales:

```bash
firebase functions:config:get
```

Deberías ver:
```json
{
  "email": {
    "pass": "xxxx xxxx xxxx xxxx",
    "user": "admin@asociacionmontessori.com.mx"
  }
}
```

## ❌ Troubleshooting

### No se envía el email

1. **Revisa los logs**:
   ```bash
   firebase functions:log --only enviarEmailNotificacion
   ```

2. **Verifica el estado en Firestore**:
   - Ve a `emails_pendientes`
   - Revisa el campo `estado` y `error`

3. **Errores comunes**:
   - `Invalid login`: Verifica las credenciales
   - `Connection timeout`: Verifica la conexión a internet
   - `Unauthorized`: La contraseña de aplicación puede estar incorrecta

### La función no se ejecuta

1. **Verifica que esté desplegada**:
   ```bash
   firebase functions:list
   ```

2. **Verifica los permisos**:
   - Asegúrate de que la función tenga permisos para leer/escribir en Firestore
   - Asegúrate de que tenga permisos para enviar emails

### El email llega a spam

- Los emails pueden llegar a la carpeta de spam inicialmente
- Revisa la carpeta de spam
- Agrega el remitente a contactos para evitar esto

## 📧 Verificar Función Programada

La función `verificarMateriasProximas` se ejecuta diariamente a las 9:00 AM (hora de México).

Para verificar que está programada:
1. Ve a: https://console.cloud.google.com/cloudscheduler
2. Selecciona el proyecto `certificacionmontessori`
3. Busca el job: `verificarMateriasProximas`

## 🎯 Próximos Pasos

1. **Probar el sistema completo**:
   - Crea una materia con fecha de inicio en 7 días o menos
   - Ve al Dashboard
   - Haz clic en "Enviar Email"
   - Verifica que recibas el email

2. **Monitorear**:
   - Revisa los logs periódicamente
   - Verifica que los emails se estén enviando correctamente

3. **Ajustar horario** (opcional):
   - Si quieres cambiar la hora de la verificación diaria
   - Edita `functions/index.js`
   - Cambia el schedule: `'0 9 * * *'` (formato cron)

---

**¡Todo está listo!** El sistema debería estar funcionando correctamente. Si tienes algún problema, revisa los logs o verifica las credenciales.

