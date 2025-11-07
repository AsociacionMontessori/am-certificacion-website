# 👤 Crear Usuario Administrador en Firestore

## Pasos para crear tu usuario de administrador

### 1. Verificar que el usuario existe en Firebase Authentication

Tu usuario ya está creado en Firebase Authentication:
- **Email**: `admin@certificacionmontessori.com`
- **UID**: `9MJUvqisyia0tXW8PDcN9D863cS2`

### 2. Crear documento en Firestore

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore
2. Haz clic en **"Comenzar colección"** (si es la primera vez) o selecciona la colección `admins`
3. **ID del documento**: Ingresa tu UID exactamente: `9MJUvqisyia0tXW8PDcN9D863cS2`
4. **Campos**:
   - `nombre` (string): `Administrador` (o tu nombre)
   - `email` (string): `admin@certificacionmontessori.com`
   - `rol` (string): `admin`
   - `fechaCreacion` (timestamp): Fecha actual
   - `activo` (boolean): `true`

5. Haz clic en **"Guardar"**

### 3. Estructura del Documento

```javascript
{
  nombre: "Administrador",
  email: "admin@certificacionmontessori.com",
  rol: "admin",
  fechaCreacion: Timestamp, // Fecha actual
  activo: true
}
```

### 4. Verificar que funciona

1. Inicia sesión en el portal con: `admin@certificacionmontessori.com`
2. Deberías ser redirigido automáticamente a `/admin`
3. Verás el panel de administración

## ✅ Checklist

- [ ] Usuario creado en Firebase Authentication
- [ ] Documento creado en Firestore colección `admins` con tu UID
- [ ] Campos correctos en el documento
- [ ] Puedes iniciar sesión y acceder al panel de admin

