# 💰 Inicializar Configuración de Pagos

## Pasos para Inicializar la Configuración de Pagos

### Opción 1: Desde la Consola de Firebase (Recomendado)

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data
2. Haz clic en **"Comenzar colección"** o selecciona la colección `configuracionPagos`
3. **ID del documento**: `general`
4. **Campos** (agregar uno por uno):

#### Campos básicos:
- `recargoPorcentaje` (number): `10`
- `recargoActivo` (boolean): `true`
- `diaVencimiento` (number): `10`

#### Campo: `costos` (map)

```javascript
{
  "Guía de Nido y Comunidad": {
    "mensual": 2900,
    "meses": 16,
    "inscripcion": 4600,
    "certificado": 2500
  },
  "Guía de Casa de Niños": {
    "mensual": 3300,
    "meses": 17,
    "inscripcion": 4600,
    "certificado": 2500
  },
  "Guía de Taller I-II": {
    "mensual": 3600,
    "meses": 20,
    "inscripcion": 4600,
    "certificado": 2500
  },
  "Diplomado en Neuroeducación": {
    "total": 4500,
    "pagos": 3,
    "montoPago": 1500,
    "certificado": "Incluido"
  },
  "Curso Filosofía Montessori": {
    "total": 4500,
    "pagos": 3,
    "montoPago": 1500,
    "certificado": "Incluido"
  }
}
```

5. Haz clic en **"Guardar"**

### Opción 2: Usando el Script (Requiere permisos de Admin SDK)

Si tienes acceso al Admin SDK, puedes ejecutar:

```bash
cd alumnos-app
npm run init:pagos
```

**Nota**: Este script requiere permisos de administrador en Firestore, por lo que es mejor hacerlo manualmente desde la consola la primera vez.

## ✅ Verificación

1. Ve a la consola de Firestore
2. Verifica que existe el documento `configuracionPagos/general`
3. Verifica que tiene todos los campos correctos
4. En la aplicación, ve a `/admin/pagos` y haz clic en "Configuración"
5. Deberías ver los valores configurados

## 🔄 Actualizar Configuración

Una vez creada, puedes actualizar la configuración desde la interfaz de administración:
1. Ve a `/admin/pagos`
2. Haz clic en el botón **"Configuración"**
3. Modifica los valores necesarios
4. Haz clic en **"Guardar"**

