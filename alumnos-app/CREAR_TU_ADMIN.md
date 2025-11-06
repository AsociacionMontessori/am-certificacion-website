# 👤 Crear tu Documento de Administrador

## Pasos Rápidos (2 minutos)

### 1. Ir a Firestore Console
Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore

### 2. Crear Colección (si no existe)
- Haz clic en **"Comenzar colección"** o **"Agregar colección"**
- Nombre de la colección: `admins`
- Haz clic en **"Siguiente"**

### 3. Crear Documento
- **ID del documento**: `9MJUvqisyia0tXW8PDcN9D863cS2` (tu UID exacto)
- Haz clic en **"Siguiente"**

### 4. Agregar Campos

Haz clic en **"Agregar campo"** y agrega estos campos uno por uno:

| Nombre del Campo | Tipo | Valor |
|-----------------|------|-------|
| `nombre` | string | `Administrador` |
| `email` | string | `admin@certificacionmontessori.com` |
| `rol` | string | `admin` |
| `fechaCreacion` | timestamp | Click en "Usar actual" o selecciona fecha |
| `activo` | boolean | `true` |

### 5. Guardar
- Haz clic en **"Guardar"**

## ✅ Verificación

1. Cierra sesión si estás logueado
2. Inicia sesión con: `admin@certificacionmontessori.com`
3. Deberías ser redirigido automáticamente a `/admin`
4. Verás el panel de administración con el botón "Crear Usuario"

## 🎯 Siguiente Paso

Una vez que puedas acceder al panel de admin:
1. Haz clic en **"Crear Usuario"** en el dashboard
2. Llena el formulario con los datos del nuevo alumno
3. El sistema creará automáticamente:
   - Usuario en Firebase Authentication
   - Documento en Firestore colección `alumnos`
   - Ambos vinculados con el mismo UID

