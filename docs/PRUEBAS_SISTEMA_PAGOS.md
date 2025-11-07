# 🧪 Guía de Pruebas - Sistema de Pagos

## ✅ Configuración Completada

- ✅ Documento `general` creado en `configuracionPagos`
- ✅ Campos configurados correctamente
- ✅ Costos de todos los niveles establecidos
- ✅ Reglas de Firestore y Storage desplegadas

## 🧪 Pruebas Recomendadas

### 1. Verificar Configuración

**Como Administrador:**
1. Inicia sesión como admin
2. Ve a `/admin/pagos`
3. Haz clic en el botón **"Configuración"**
4. Verifica que se muestren:
   - ✅ Porcentaje de recargo: 10%
   - ✅ Recargo activo: Sí
   - ✅ Día de vencimiento: 10
   - ✅ Costos de los 5 niveles

### 2. Crear un Pago de Prueba (Admin)

**Opción A: Desde Firestore Console**
1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/firestore/data
2. Crea un documento en la colección `pagos`
3. Campos mínimos:
   ```javascript
   {
     alumnoId: "UID_DEL_ALUMNO",
     tipo: "Colegiatura",
     monto: 2900,
     fechaVencimiento: Timestamp (fecha futura),
     estado: "Pendiente",
     recargoPorcentaje: 10,
     recargoActivo: true
   }
   ```

**Opción B: Desde la Aplicación** (si hay funcionalidad para crear pagos)
- Próximamente se agregará esta funcionalidad

### 3. Probar Vista de Alumno

**Como Alumno:**
1. Inicia sesión como alumno
2. Ve a `/pagos`
3. Verifica que se muestre:
   - ✅ Resumen de montos adeudados
   - ✅ Lista de pagos pendientes
   - ✅ Historial de pagos
   - ✅ Botón para subir comprobantes

### 4. Probar Subida de Comprobante

**Como Alumno:**
1. Ve a `/pagos`
2. Busca un pago pendiente
3. Haz clic en **"Subir Comprobante"**
4. Selecciona un archivo (JPG, PNG o PDF - máx. 5MB)
5. Haz clic en **"Subir"**
6. Verifica que:
   - ✅ El archivo se suba correctamente
   - ✅ Aparezca el estado "Pendiente" de validación
   - ✅ El admin pueda ver el comprobante

### 5. Probar Validación de Pago (Admin)

**Como Administrador:**
1. Ve a `/admin/pagos`
2. Busca un pago con comprobante subido
3. Haz clic en **"Validar"**
4. Ingresa monto pagado (opcional) y observaciones
5. Haz clic en **"Validar"**
6. Verifica que:
   - ✅ El pago cambie a estado "Validado"
   - ✅ Aparezca en el historial del alumno como validado

### 6. Probar Rechazo de Pago (Admin)

**Como Administrador:**
1. Ve a `/admin/pagos`
2. Busca un pago pendiente
3. Haz clic en **"Rechazar"**
4. Ingresa el motivo del rechazo
5. Haz clic en **"Rechazar"**
6. Verifica que:
   - ✅ El pago cambie a estado "Rechazado"
   - ✅ El alumno pueda ver el motivo del rechazo

### 7. Probar Filtros y Búsqueda (Admin)

**Como Administrador:**
1. Ve a `/admin/pagos`
2. Prueba los filtros:
   - ✅ Filtrar por estado (Pendiente, Validado, Rechazado)
   - ✅ Filtrar por alumno
   - ✅ Buscar por nombre o tipo de pago
3. Verifica que los resultados se filtren correctamente

### 8. Probar Acceso desde Detalles de Alumno

**Como Administrador:**
1. Ve a `/admin`
2. Selecciona un alumno
3. Haz clic en el botón **"Pagos"** en la sección "Gestión Académica"
4. Verifica que:
   - ✅ Se abra la página de pagos filtrada por ese alumno
   - ✅ Aparezca el nombre del alumno en el título
   - ✅ El enlace "Volver a detalles del alumno" funcione

### 9. Probar Cálculo de Recargos

**Verificación:**
1. Crea un pago con fecha de vencimiento anterior a hoy
2. Verifica que se muestre el recargo del 10%
3. Verifica que el monto total incluya el recargo
4. Verifica que se muestre como "Con Recargo" o "Vencido"

### 10. Probar Descuentos y Becas

**Como Administrador:**
1. Ve a `/admin/pagos` y filtra un alumno
2. Haz clic en el botón **"Descuentos"**
3. Usa la plantilla **Pago de contado 5%**
4. Verifica que los pagos pendientes reflejen el monto rebajado y muestren el descuento aplicado
5. Edita el descuento y cambia el porcentaje
6. Elimina el descuento y confirma que los montos regresan al valor original

**Como Alumno:**
1. Ve a `/pagos`
2. Verifica que cada pago muestre el monto original y el descuento aplicado

### 11. Probar Responsive (Mobile)

**En diferentes dispositivos:**
1. Abre la aplicación en móvil
2. Verifica que:
   - ✅ Las tarjetas se muestren correctamente
   - ✅ Los botones sean accesibles (tamaño mínimo 44px)
   - ✅ No haya scroll horizontal
   - ✅ Los modales se adapten a la pantalla

## 🔍 Checklist de Verificación

### Configuración
- [ ] Documento `general` existe en `configuracionPagos`
- [ ] Todos los campos están configurados
- [ ] Los costos de los 5 niveles están correctos
- [ ] La configuración se carga desde la aplicación

### Funcionalidades Básicas
- [ ] Vista de alumnos funciona (`/pagos`)
- [ ] Vista de admin funciona (`/admin/pagos`)
- [ ] La configuración se muestra correctamente
- [ ] Los filtros funcionan
- [ ] La búsqueda funciona
- [ ] Los descuentos se aplican y se revocan correctamente

### Subida de Comprobantes
- [ ] Alumnos pueden subir comprobantes
- [ ] Los archivos se guardan en Storage
- [ ] Los comprobantes se pueden ver
- [ ] La validación de tipos de archivo funciona
- [ ] La validación de tamaño funciona (máx. 5MB)

### Validación de Pagos
- [ ] Admin puede validar pagos
- [ ] Admin puede rechazar pagos
- [ ] Los estados se actualizan correctamente
- [ ] Los alumnos ven los cambios

### Cálculos
- [ ] Los recargos se calculan correctamente
- [ ] Los montos adeudados se muestran correctamente
- [ ] Los descuentos modifican los montos mostrados
- [ ] Las fechas de vencimiento se muestran correctamente
- [ ] Los pagos vencidos se identifican correctamente

### Navegación
- [ ] Acceso desde detalles de alumno funciona
- [ ] Los enlaces de navegación funcionan
- [ ] Los botones de volver funcionan

## 🐛 Problemas Comunes y Soluciones

### Problema: "No se muestra la configuración"
**Solución:**
- Verifica que el documento `general` exista
- Verifica que tenga todos los campos necesarios
- Revisa la consola del navegador para ver errores

### Problema: "No puedo subir comprobantes"
**Solución:**
- Verifica las reglas de Storage
- Verifica que el archivo sea menor a 5MB
- Verifica que el tipo de archivo sea JPG, PNG o PDF

### Problema: "No puedo validar pagos"
**Solución:**
- Verifica que tengas permisos de administrador
- Verifica las reglas de Firestore
- Revisa la consola del navegador

### Problema: "Los recargos no se calculan"
**Solución:**
- Verifica que `recargoActivo` sea `true`
- Verifica que la fecha de vencimiento sea anterior a hoy
- Verifica que `diaVencimiento` esté configurado correctamente

## 📝 Notas

- Los costos se pueden editar desde Firestore Console
- Los recargos se aplican automáticamente después del día 10
- Los alumnos solo pueden ver sus propios pagos
- Los administradores pueden ver y gestionar todos los pagos
- Los comprobantes se guardan en `comprobantes/{alumnoId}/{archivo}`

## ✅ Estado Actual

- ✅ Sistema de pagos implementado
- ✅ Configuración creada
- ✅ Reglas de seguridad configuradas
- ✅ Interfaz de usuario completa
- ✅ Cálculos automáticos funcionando
- ✅ Sistema listo para pruebas

