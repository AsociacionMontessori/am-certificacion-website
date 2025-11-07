# 🎯 Gestión de Descuentos y Becas en Pagos

## 📘 Descripción General

El sistema de pagos ahora permite aplicar descuentos adicionales (becas) a nivel alumno. Estos descuentos pueden ser porcentuales o montos fijos y se aplican automáticamente a los pagos correspondientes, actualizando los montos, el estado de los recargos y la información mostrada tanto a administradores como a alumnos.

## 🧱 Campos Disponibles

Cada descuento almacena la siguiente información:

- **Nombre**: Identificador visible del descuento (ej. "Descuento pago de contado").
- **Tipo**: `porcentaje` o `fijo`.
- **Valor**: Porcentaje (0-100) o monto en MXN.
- **Alcance**:
  - `colegiaturas`: Aplica a todas las colegiaturas pendientes.
  - `global`: Aplica a todos los pagos del alumno.
  - `pago`: Aplica a un pago específico (requiere seleccionar el pago).
  - `inscripcion`: Solo a la inscripción.
  - `certificado`: Solo al pago de certificado.
- **Motivo / Descripción**: Texto libre para documentar la razón del descuento.
- **Vigencia**: Fechas opcionales de inicio y fin.
- **Aplica recargos**: Si se desactiva, el pago deja de generar recargos futuros.

## 🧭 Flujo en el Panel de Administración

1. **Acceso rápido**: Botón `Descuentos` en la parte superior cuando se filtra un alumno y botón dentro de cada tarjeta de pago.
2. **Modal de gestión**:
   - Lista de descuentos activos, con opciones para editar o eliminar.
   - Formulario para crear un nuevo descuento.
   - Atajos rápidos:
     - Pago de contado (5% sobre colegiaturas).
     - Ajuste puntual de $500 (requiere seleccionar pago).
3. **Guardado**:
   - Al guardar un descuento nuevo o editar uno existente, los montos de los pagos afectados se recalculan inmediatamente.
   - Al eliminar/desactivar un descuento, los montos vuelven a su valor original y se elimina el descuento aplicado.

## 🔄 Impacto Automático

- Cada pago mantiene los campos:
  - `montoOriginal`: Valor antes del descuento.
  - `monto`: Valor actual a pagar.
  - `descuentoAplicado`: Total descontado.
  - `becasAplicadas`: Resumen de descuentos aplicados al pago.
- Los cálculos de adeudos y saldos se actualizan para considerar los descuentos.
- El historial de pagos y los listados muestran el monto original y el descuento aplicado.
- Si un descuento se crea luego de generar los pagos, el sistema ajusta todos los pagos pendientes automáticamente.

## ✅ Casos de Uso Recomendados

1. **Pago en una sola exhibición**:
   - Usar plantilla "Pago de contado 5%".
   - Alcance preconfigurado en `colegiaturas`.
   - Recargo desactivado por defecto.

2. **Ajuste puntual**:
   - Usar plantilla "Ajuste puntual $500".
   - Seleccionar el pago específico que se ajustará.

3. **Becas personalizadas**:
   - Definir nombre, porcentaje y alcance manualmente.
   - Registrar motivo para mantener trazabilidad.

## 🧪 Pruebas Sugeridas

- Crear descuento del 5% para colegiaturas y validar que cada pago refleje el monto rebajado.
- Aplicar un ajuste fijo a un pago pendiente y revisar monto, comprobantes y validación.
- Editar un descuento existente (cambiar porcentaje) y verificar actualización de montos.
- Eliminar descuento y confirmar que los montos regresan al valor original.
- Revisar vista del alumno para confirmar que se muestra el monto original y el descuento aplicado.

## ⚠️ Consideraciones

- Los recargos solo permanecen activos si **todas** las becas asociadas permiten recargos (`aplicaRecargos = true`).
- Los descuentos se aplican únicamente a pagos pendientes o vencidos; los pagos validados no se recalculan.
- Al crear un descuento con alcance `pago`, asegúrate de que el alumno tenga pagos generados.

---

Para más detalles técnicos, revisa:
- `alumnos-app/src/services/pagosService.js`
- `alumnos-app/src/pages/Admin/GestionPagos.jsx`
- `alumnos-app/src/utils/calculosPagos.js`
- `alumnos-app/src/pages/Pagos.jsx`
