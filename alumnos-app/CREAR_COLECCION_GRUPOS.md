# 📚 Cómo Crear la Colección de Grupos en Firestore

## 🎯 Propósito

La colección `grupos` permite crear usuarios que pueden ver la información de múltiples alumnos asignados por el administrador. Esto es útil para coordinadores, profesores o tutores que necesitan acceso a varios alumnos.

## 📋 Estructura de la Colección

### Nombre de la Colección
```
grupos
```

### Estructura del Documento

Cada documento en la colección `grupos` debe tener:
- **ID del documento**: Debe coincidir con el UID del usuario en Firebase Authentication

### Campos del Documento

```javascript
{
  nombre: "Nombre del Usuario",           // String - Nombre completo
  email: "usuario@ejemplo.com",          // String - Email del usuario
  rol: "grupos",                         // String - Siempre "grupos"
  alumnosAsignados: [                    // Array de Strings - IDs de alumnos
    "alumnoId1",
    "alumnoId2",
    "alumnoId3"
  ],
  fechaCreacion: Timestamp,              // Timestamp - Fecha de creación
  activo: true                           // Boolean - Si el usuario está activo
}
```

## 🔧 Pasos para Crear un Usuario de Grupos

### Opción 1: Desde la Aplicación (Recomendado)

1. Inicia sesión como **Administrador**
2. Ve a **Crear Usuario**
3. Selecciona el tipo de usuario: **Grupos**
4. Completa:
   - Nombre completo
   - Email
   - Contraseña
5. Haz clic en **Crear Usuario**
6. Ve a **Gestión Grupos** en el menú
7. Selecciona el usuario de grupos creado
8. Marca los alumnos que quieres asignar
9. Haz clic en **Guardar**

### Opción 2: Manualmente desde Firebase Console

1. **Crear usuario en Firebase Authentication:**
   - Ve a Firebase Console → Authentication
   - Haz clic en "Agregar usuario"
   - Ingresa email y contraseña
   - Copia el **UID** del usuario creado

2. **Crear documento en Firestore:**
   - Ve a Firebase Console → Firestore Database
   - Crea una nueva colección llamada `grupos` (si no existe)
   - Crea un nuevo documento con el **UID** como ID del documento
   - Agrega los siguientes campos:

```javascript
nombre: "Nombre del Usuario"
email: "usuario@ejemplo.com"
rol: "grupos"
alumnosAsignados: []  // Array vacío inicialmente
fechaCreacion: [Timestamp actual]
activo: true
```

3. **Asignar alumnos:**
   - Obtén los IDs de los alumnos que quieres asignar (desde la colección `alumnos`)
   - Actualiza el campo `alumnosAsignados` con un array de IDs:

```javascript
alumnosAsignados: [
  "idAlumno1",
  "idAlumno2",
  "idAlumno3"
]
```

## 📝 Ejemplo Completo

```javascript
// Documento en Firestore: grupos/{userId}
{
  nombre: "Profesor Juan Pérez",
  email: "juan.perez@montessori.edu.mx",
  rol: "grupos",
  alumnosAsignados: [
    "abc123def456",
    "xyz789uvw012",
    "mno345pqr678"
  ],
  fechaCreacion: Timestamp(2025, 1, 15, 10, 30, 0),
  activo: true
}
```

## 🔐 Permisos y Seguridad

- Los usuarios de grupos **solo pueden leer** la información de los alumnos asignados
- **No pueden editar** ningún dato
- Solo los **administradores** pueden:
  - Crear usuarios de grupos
  - Asignar alumnos a usuarios de grupos
  - Modificar las asignaciones

## ✅ Verificación

Para verificar que todo funciona:

1. Inicia sesión con el usuario de grupos creado
2. Deberías ver solo los alumnos asignados en el Dashboard
3. Puedes ver sus detalles, materias, calificaciones y graduación
4. No deberías ver opciones de edición

## 🆘 Solución de Problemas

### El usuario no puede iniciar sesión
- Verifica que el usuario existe en Firebase Authentication
- Verifica que el UID del documento en `grupos` coincide con el UID del usuario en Authentication

### El usuario no ve alumnos
- Verifica que el campo `alumnosAsignados` contiene IDs válidos
- Verifica que esos IDs corresponden a alumnos existentes en la colección `alumnos`
- Verifica que las reglas de Firestore están actualizadas

### El usuario ve todos los alumnos
- Verifica que el campo `rol` es exactamente `"grupos"` (no "Grupos" ni "GRUPOS")
- Verifica que las reglas de Firestore están correctamente configuradas

