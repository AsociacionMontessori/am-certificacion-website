# 🔧 Corregir Documento de Admin en Firestore

## ❌ Problema Actual

El documento en Firestore tiene un campo `uid` dentro del documento, pero **el UID debe ser el ID del documento mismo**.

## ✅ Solución

### Estructura Correcta del Documento

**Colección:** `admins`  
**ID del Documento:** `9MJUvqisyia0tXW8PDcN9D863cS2` (tu UID exacto)  
**Campos dentro del documento:**
```
nombre: "Administrador" (string)
email: "admin@certificacionmontessori.com" (string)
rol: "admin" (string)
fechaCreacion: [timestamp]
activo: true (boolean)
```

### ⚠️ IMPORTANTE: NO incluir campo `uid`

El UID **NO debe ser un campo dentro del documento**. El UID es el **ID del documento mismo**.

## 📋 Pasos para Corregir

### Opción 1: Eliminar y Recrear (Recomendado)

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore
2. Encuentra la colección `admins`
3. **ELIMINA** el documento actual (si tiene un campo `uid` dentro)
4. **CREA** un nuevo documento:
   - **ID del documento:** `9MJUvqisyia0tXW8PDcN9D863cS2`
   - **Campos:**
     - `nombre` (string): `Administrador`
     - `email` (string): `admin@certificacionmontessori.com`
     - `rol` (string): `admin`
     - `fechaCreacion` (timestamp): Fecha actual
     - `activo` (boolean): `true`
5. **NO agregues** un campo `uid`

### Opción 2: Editar el Documento Existente

1. Si el documento ya existe con el ID correcto (`9MJUvqisyia0tXW8PDcN9D863cS2`)
2. **ELIMINA** el campo `uid` si existe
3. Asegúrate de que tenga estos campos:
   - `nombre`
   - `email`
   - `rol: "admin"`
   - `fechaCreacion`
   - `activo: true`

## 🔒 Configurar Reglas de Firestore

Después de corregir el documento, configura las reglas de Firestore:

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/rules
2. Copia y pega las reglas de `FIRESTORE_RULES.md`
3. Haz clic en "Publicar"

## ✅ Verificación

Después de corregir:
1. Recarga la página
2. Inicia sesión
3. Abre la consola (F12)
4. Deberías ver: `✅ Admin encontrado: { uid: "9MJUvqisyia0tXW8PDcN9D863cS2", data: {...} }`
5. Deberías ser redirigido a `/admin`

