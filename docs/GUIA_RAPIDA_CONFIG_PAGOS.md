# 🚀 Guía Rápida: Configurar Pagos en 3 Pasos

## ⚡ Método Más Rápido: Duplicar Documento Existente

Ya tienes un documento con la configuración correcta. Sigue estos pasos:

### Paso 1: Duplicar el Documento

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data/configuracionPagos
2. Haz clic en el documento existente (el que tiene ID aleatorio)
3. Verifica que tenga todos los campos correctos (debería tenerlos)

### Paso 2: Crear Nuevo Documento con ID "general"

1. Haz clic en **"+ Agregar documento"** en la colección `configuracionPagos`
2. **ID del documento**: Escribe exactamente `general`
3. Haz clic en **"Siguiente"**

### Paso 3: Copiar los Campos

1. Vuelve al documento original y copia manualmente cada campo, o:
2. **Método más rápido**: Haz clic en el ícono de **tres puntos** (⋯) del documento original
3. Selecciona **"Duplicar documento"** (si está disponible)
4. O simplemente copia los valores campo por campo:

#### Campos a Copiar:

**Campos simples:**
- `recargoPorcentaje`: `10` (number)
- `recargoActivo`: `true` (boolean)
- `diaVencimiento`: `10` (number)

**Campo `costos` (map):**
- Copia todo el mapa `costos` con sus 5 niveles:
  - `Guía de Nido y Comunidad`
  - `Guía de Casa de Niños`
  - `Guía de Taller I-II`
  - `Diplomado en Neuroeducación`
  - `Curso Filosofía Montessori`

4. Pega todos los campos en el nuevo documento `general`
5. Haz clic en **"Guardar"**

### Paso 4: Verificar

1. Verifica que el documento `general` tenga todos los campos
2. (Opcional) Elimina el documento con ID aleatorio si ya no lo necesitas
3. Ve a la aplicación: `/admin/pagos` → "Configuración"
4. Deberías ver todos los valores correctamente

## ✅ Listo!

Ahora la aplicación usará automáticamente el documento `general` para cargar la configuración de pagos.

## 🔄 Si Prefieres Crear desde Cero

Sigue la guía completa en: `docs/CREAR_CONFIG_PAGOS_GENERAL.md`

## 💡 Nota

- El documento `general` es el estándar, pero la aplicación también funcionará con cualquier otro documento
- Una vez creado, puedes actualizar la configuración desde `/admin/pagos` → "Configuración"
- Los campos `fechaCreacion` y `fechaActualizacion` se crearán automáticamente cuando uses la aplicación

