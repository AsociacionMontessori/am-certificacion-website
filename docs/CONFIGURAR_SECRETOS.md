# 🔐 Configurar Secretos de Firebase para Cloud Functions

## ⚠️ IMPORTANTE: Cambio de Configuración

Las nuevas versiones de Firebase Functions usan **Secretos** en lugar de `functions.config()`. Esto es más seguro y recomendado.

## 🚀 Configuración Rápida

### Paso 1: Configurar Secretos

```bash
cd alumnos-app

# Configurar el email (se te pedirá ingresar el valor)
firebase functions:secrets:set EMAIL_USER

# Cuando te pida el valor, ingresa tu email:
# admin@asociacionmontessori.com.mx

# Configurar la contraseña de aplicación
firebase functions:secrets:set EMAIL_PASS

# Cuando te pida el valor, ingresa tu contraseña de aplicación de Gmail:
# xfhk xbsx ntdy thca
```

### Paso 2: Verificar Secretos

```bash
firebase functions:secrets:access EMAIL_USER
firebase functions:secrets:access EMAIL_PASS
```

### Paso 3: Desplegar Functions

```bash
firebase deploy --only functions
```

## 📋 Proceso Completo

1. **Asegúrate de tener las credenciales de Gmail**:
   - Email: `admin@asociacionmontessori.com.mx`
   - Contraseña de aplicación: `xfhk xbsx ntdy thca`

2. **Configurar secretos**:
   ```bash
   cd alumnos-app
   firebase functions:secrets:set EMAIL_USER
   # Ingresa: admin@asociacionmontessori.com.mx
   
   firebase functions:secrets:set EMAIL_PASS
   # Ingresa: xfhk xbsx ntdy thca
   ```

3. **Desplegar**:
   ```bash
   firebase deploy --only functions
   ```

## 🔍 Verificar que Funciona

1. Ve al Dashboard: https://alumnos.certificacionmontessori.com/admin
2. Si hay materias próximas, verás la alerta
3. Haz clic en "Enviar Email"
4. Revisa los logs: `firebase functions:log`
5. Verifica en Firestore la colección `emails_pendientes`

## ❓ Troubleshooting

### Error: "Secret not found"
- Asegúrate de haber configurado los secretos correctamente
- Verifica con: `firebase functions:secrets:list`

### Error: "Permission denied"
- Asegúrate de tener permisos en el proyecto Firebase
- Verifica que estés logueado: `firebase login`

### Cambiar un secreto
```bash
firebase functions:secrets:set EMAIL_USER
# Ingresa el nuevo valor
```

### Eliminar un secreto
```bash
firebase functions:secrets:destroy EMAIL_USER
```

## 🔐 Ventajas de Usar Secretos

- ✅ Más seguro que `functions.config()`
- ✅ Los secretos no se exponen en el código
- ✅ Fácil de rotar (cambiar contraseñas)
- ✅ Compatible con las últimas versiones de Firebase Functions

---

**Nota:** Los secretos están configurados por proyecto. Cada proyecto tiene sus propios secretos independientes.

