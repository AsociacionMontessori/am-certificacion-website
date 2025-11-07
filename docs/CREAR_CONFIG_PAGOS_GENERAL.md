# 📝 Crear Documento 'general' en configuracionPagos

## 🎯 Objetivo

Crear el documento con ID `general` en la colección `configuracionPagos` para que la aplicación pueda cargar la configuración de pagos correctamente.

## 📋 Método 1: Desde la Consola de Firebase (Recomendado - 5 minutos)

### Paso 1: Ir a Firestore Console

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data
2. En el panel izquierdo, busca la colección `configuracionPagos`
3. Si no existe, haz clic en **"+ Iniciar colección"** y crea la colección `configuracionPagos`

### Paso 2: Crear el Documento

1. Haz clic en **"+ Agregar documento"** dentro de la colección `configuracionPagos`
2. **IMPORTANTE**: En el campo "ID del documento", escribe exactamente: **`general`**
3. Haz clic en **"Siguiente"**

### Paso 3: Agregar Campos

Agrega los siguientes campos uno por uno:

#### Campo 1: `recargoPorcentaje`
- **Tipo**: `number`
- **Valor**: `10`

#### Campo 2: `recargoActivo`
- **Tipo**: `boolean`
- **Valor**: `true`

#### Campo 3: `diaVencimiento`
- **Tipo**: `number`
- **Valor**: `10`

#### Campo 4: `costos` (Map)

Este es el campo más importante. Haz clic en **"+ Agregar campo"** y:

1. **Nombre del campo**: `costos`
2. **Tipo**: Selecciona `map`
3. Haz clic en **"Guardar"** y luego haz clic en el campo `costos` para agregar los siguientes mapas:

##### 4.1: Guía de Nido y Comunidad
- Haz clic en **"+ Agregar campo"** dentro del mapa `costos`
- **Nombre**: `Guía de Nido y Comunidad`
- **Tipo**: `map`
- Dentro de este mapa, agrega:
  - `mensual` (number): `2900`
  - `meses` (number): `16`
  - `inscripcion` (number): `4600`
  - `certificado` (number): `2500`

##### 4.2: Guía de Casa de Niños
- **Nombre**: `Guía de Casa de Niños`
- **Tipo**: `map`
- Dentro de este mapa, agrega:
  - `mensual` (number): `3300`
  - `meses` (number): `17`
  - `inscripcion` (number): `4600`
  - `certificado` (number): `2500`

##### 4.3: Guía de Taller I-II
- **Nombre**: `Guía de Taller I-II`
- **Tipo**: `map`
- Dentro de este mapa, agrega:
  - `mensual` (number): `3600`
  - `meses` (number): `20`
  - `inscripcion` (number): `4600`
  - `certificado` (number): `2500`

##### 4.4: Diplomado en Neuroeducación
- **Nombre**: `Diplomado en Neuroeducación`
- **Tipo**: `map`
- Dentro de este mapa, agrega:
  - `total` (number): `4500`
  - `pagos` (number): `3`
  - `montoPago` (number): `1500`
  - `certificado` (string): `Incluido`

##### 4.5: Curso Filosofía Montessori
- **Nombre**: `Curso Filosofía Montessori`
- **Tipo**: `map`
- Dentro de este mapa, agrega:
  - `total` (number): `4500`
  - `pagos` (number): `3`
  - `montoPago` (number): `1500`
  - `certificado` (string): `Incluido`

### Paso 4: Guardar

1. Haz clic en **"Guardar"**
2. Verifica que el documento se haya creado correctamente

## 📋 Método 2: Copiar desde Documento Existente (Más Rápido)

Si ya tienes un documento en `configuracionPagos` (como el que viste con ID aleatorio):

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data
2. Abre el documento existente en `configuracionPagos`
3. Haz clic en el ícono de **tres puntos** (⋯) en la esquina superior derecha
4. Selecciona **"Duplicar documento"** o copia manualmente todos los campos
5. Crea un nuevo documento con ID `general`
6. Pega todos los campos copiados
7. Guarda el nuevo documento
8. (Opcional) Elimina el documento con ID aleatorio

## 📋 Método 3: Usando el Script (Requiere Permisos de Admin)

Si tienes acceso con Firebase Admin SDK:

```bash
cd alumnos-app
npm run create:config-general
```

**Nota**: Este script requiere permisos de administrador en Firestore. Si obtienes un error de permisos, usa el Método 1 o 2.

## ✅ Verificación

Para verificar que el documento se creó correctamente:

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data/configuracionPagos/general
2. Verifica que existan todos los campos:
   - ✅ `recargoPorcentaje`: 10
   - ✅ `recargoActivo`: true
   - ✅ `diaVencimiento`: 10
   - ✅ `costos`: Map con 5 niveles
3. Desde la aplicación, ve a `/admin/pagos` y haz clic en "Configuración"
4. Deberías ver todos los valores configurados

## 🎯 Estructura Final del Documento

```
configuracionPagos/
  └── general/
      ├── recargoPorcentaje: 10
      ├── recargoActivo: true
      ├── diaVencimiento: 10
      ├── fechaCreacion: [timestamp]
      ├── fechaActualizacion: [timestamp]
      └── costos: [map]
          ├── Guía de Nido y Comunidad: [map]
          ├── Guía de Casa de Niños: [map]
          ├── Guía de Taller I-II: [map]
          ├── Diplomado en Neuroeducación: [map]
          └── Curso Filosofía Montessori: [map]
```

## 💡 Notas

- El ID del documento **debe ser exactamente** `general` (minúsculas)
- La aplicación buscará primero el documento `general`, si no existe, usará cualquier otro documento de la colección
- Una vez creado, puedes actualizar la configuración desde la interfaz de administración en `/admin/pagos`
- Los campos `fechaCreacion` y `fechaActualizacion` se crearán automáticamente cuando uses la aplicación

## 🆘 Problemas Comunes

### Error: "El documento ya existe"
- Si ya existe un documento `general`, el script lo actualizará
- O puedes eliminar el documento existente y crear uno nuevo

### Error: "No tengo permisos"
- Las reglas de Firestore solo permiten que los admins escriban
- Usa el Método 1 o 2 (desde la consola)
- O configura Firebase Admin SDK con credenciales de servicio

### Error: "No se muestra la configuración en la app"
- Verifica que el ID del documento sea exactamente `general`
- Verifica que todos los campos estén correctamente tipados (number, boolean, string, map)
- Revisa la consola del navegador para ver errores

