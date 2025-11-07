# 📊 Índices de Firestore para Pagos

## ⚠️ Nota Importante

El código está diseñado para funcionar **sin índices compuestos** ordenando los resultados en el cliente. Sin embargo, para mejor rendimiento con grandes volúmenes de datos, se recomienda crear los siguientes índices.

## 🔍 Índices Recomendados (Opcionales)

### 1. Índice para: `pagos` - Por alumno y fecha de vencimiento

**Cuándo se necesita:** Cuando consultas pagos de un alumno ordenados por fecha de vencimiento

**Cómo crearlo:**
1. Firestore mostrará un error con un enlace cuando ejecutes la consulta
2. Haz clic en el enlace que aparece en el error
3. O ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/indexes
4. Crea un índice compuesto con:
   - **Colección**: `pagos`
   - **Campos**:
     - `alumnoId` (Ascending)
     - `fechaVencimiento` (Descending)

### 2. Índice para: `pagos` - Por estado y fecha de vencimiento

**Cuándo se necesita:** Cuando filtras pagos por estado y ordenas por fecha

**Cómo crearlo:**
1. Ve a la consola de índices de Firestore
2. Crea un índice compuesto con:
   - **Colección**: `pagos`
   - **Campos**:
     - `estado` (Ascending)
     - `fechaVencimiento` (Descending)

### 3. Índice para: `pagos` - Por alumno, estado y fecha de vencimiento

**Cuándo se necesita:** Cuando filtras por alumno y estado, y ordenas por fecha

**Cómo crearlo:**
1. Ve a la consola de índices de Firestore
2. Crea un índice compuesto con:
   - **Colección**: `pagos`
   - **Campos**:
     - `alumnoId` (Ascending)
     - `estado` (Ascending)
     - `fechaVencimiento` (Descending)

## ✅ Solución Automática

El código ya maneja la falta de índices:
- Si falta un índice, la consulta se ejecuta sin `orderBy`
- Los resultados se ordenan en el cliente (JavaScript)
- Esto funciona bien para volúmenes pequeños y medianos de datos

## 📝 Crear Índices desde el Código

Si prefieres crear los índices automáticamente, puedes usar el archivo `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "pagos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "alumnoId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaVencimiento",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pagos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "estado",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaVencimiento",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pagos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "alumnoId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "estado",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaVencimiento",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Luego ejecuta:
```bash
firebase deploy --only firestore:indexes
```

## 🚀 Rendimiento

**Sin índices:**
- ✅ Funciona correctamente
- ⚠️ Ordenamiento en cliente (más lento con muchos datos)
- ✅ Recomendado para < 1000 pagos

**Con índices:**
- ✅ Consultas más rápidas
- ✅ Mejor rendimiento con grandes volúmenes
- ✅ Recomendado para > 1000 pagos

## 💡 Nota

Los índices no son obligatorios para que el sistema funcione. El código maneja automáticamente la falta de índices ordenando en el cliente.

