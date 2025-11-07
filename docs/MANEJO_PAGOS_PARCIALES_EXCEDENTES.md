# 📊 Manejo de Pagos Parciales y Excedentes

## 🎯 Funcionamiento del Sistema

### 💰 Pagos Parciales (Pago Incompleto)

Cuando un alumno paga **menos** del monto total de un concepto:

#### Ejemplo:
- **Colegiatura 1/16**: $3,300
- **Recargo (10%)**: $330
- **Total a pagar**: $3,630
- **Monto pagado**: $2,000
- **Pendiente**: $1,630

#### Comportamiento:
1. ✅ El pago se marca como **"Validado"** si el admin lo aprueba
2. 📊 El sistema muestra claramente:
   - Monto pagado: $2,000
   - Pendiente: $1,630 (en color naranja)
3. 🔄 El pago permanece en estado "Validado" pero con saldo pendiente
4. 📝 El admin puede:
   - Registrar pagos adicionales en el mismo concepto
   - Crear un nuevo pago para el saldo pendiente
   - Modificar el monto del pago original

#### Visualización:
```
Monto: $3,300 (Total con recargo: $3,630)
Pagado: $2,000 (Pendiente: $1,630) ← En color naranja
```

---

### 💵 Pagos Excedentes (Pago de Más)

Cuando un alumno paga **más** del monto total de un concepto:

#### Ejemplo:
- **Colegiatura 1/16**: $3,300
- **Recargo (10%)**: $330
- **Total a pagar**: $3,630
- **Monto pagado**: $4,000
- **Excedente**: $370

#### Comportamiento:
1. ✅ El pago se marca como **"Validado"** completamente
2. 📊 El sistema muestra claramente:
   - Monto pagado: $4,000
   - Excedente: $370 (en color verde)
3. 💡 El excedente puede:
   - Quedar registrado como crédito a favor del alumno
   - Aplicarse manualmente a otros pagos pendientes
   - Devolverse al alumno (proceso manual)

#### Visualización:
```
Monto: $3,300 (Total con recargo: $3,630)
Pagado: $4,000 (Excedente: $370) ← En color verde
```

---

## 🔧 Funcionalidades del Admin

### ✏️ Editar Pagos

El admin puede modificar:
- **Monto del pago**: Cambiar el monto base del concepto
- **Fecha de vencimiento**: Ajustar la fecha límite de pago

**Cómo usar:**
1. Haz clic en el botón **"Editar"** (icono de lápiz) junto al pago
2. Modifica el monto y/o fecha de vencimiento
3. El sistema recalculará automáticamente los recargos si aplican
4. Guarda los cambios

**Nota:** Al modificar la fecha de vencimiento, el sistema recalcula los recargos automáticamente si:
- Es una colegiatura
- El recargo está activo
- La nueva fecha ya pasó del día de vencimiento configurado

---

### ✅ Validar Pagos

Al validar un pago, el admin puede:

1. **Registrar el monto pagado**:
   - Si no se especifica, se asume que se pagó el monto total
   - Si se especifica un monto menor, se registra como pago parcial
   - Si se especifica un monto mayor, se registra como excedente

2. **Agregar observaciones**:
   - Notas sobre el pago
   - Información adicional relevante

---

## 📋 Casos de Uso Comunes

### Caso 1: Pago Parcial con Abonos Posteriores

**Escenario:** Un alumno paga $2,000 de una colegiatura de $3,630

**Proceso:**
1. Alumno sube comprobante de $2,000
2. Admin valida el pago y registra monto pagado: $2,000
3. Sistema muestra: "Pagado: $2,000 (Pendiente: $1,630)"
4. Más tarde, el alumno paga los $1,630 restantes
5. Admin puede:
   - **Opción A**: Modificar el pago original y actualizar monto pagado a $3,630
   - **Opción B**: Crear un nuevo pago por $1,630 y marcarlo como "Abono"

---

### Caso 2: Pago Excedente para Aplicar a Otros Pagos

**Escenario:** Un alumno paga $4,000 de una colegiatura de $3,630

**Proceso:**
1. Alumno sube comprobante de $4,000
2. Admin valida el pago y registra monto pagado: $4,000
3. Sistema muestra: "Pagado: $4,000 (Excedente: $370)"
4. Admin puede:
   - **Opción A**: Dejar el excedente registrado como crédito
   - **Opción B**: Crear un nuevo pago negativo o ajuste por -$370
   - **Opción C**: Aplicar manualmente el excedente a otro pago pendiente

---

### Caso 3: Modificar Monto por Descuento Especial

**Escenario:** Se otorga un descuento especial a un alumno

**Proceso:**
1. Admin hace clic en "Editar" en el pago
2. Modifica el monto de $3,300 a $2,500 (descuento aplicado)
3. Guarda los cambios
4. El sistema recalcula automáticamente:
   - Nuevo monto base: $2,500
   - Recargo (si aplica): $250 (10% de $2,500)
   - Nuevo total: $2,750

---

### Caso 4: Extender Fecha de Vencimiento

**Escenario:** Se otorga una prórroga a un alumno

**Proceso:**
1. Admin hace clic en "Editar" en el pago
2. Modifica la fecha de vencimiento (ej: del 10 de enero al 10 de febrero)
3. Guarda los cambios
4. El sistema recalcula los recargos basándose en la nueva fecha

---

## 🎨 Indicadores Visuales

### Colores y Estados:

- 🟢 **Verde**: Pago completo o excedente
- 🟠 **Naranja**: Pago parcial (pendiente)
- 🔵 **Azul**: Pago pendiente
- 🟡 **Amarillo**: Con recargo aplicado
- 🔴 **Rojo**: Pago vencido o rechazado

---

## ⚠️ Consideraciones Importantes

1. **Recargos**: Solo se aplican a **colegiaturas**, no a inscripciones ni certificados
2. **Cálculo Automático**: Los recargos se calculan automáticamente al modificar fechas o montos
3. **Historial**: Todos los cambios quedan registrados en el historial del pago
4. **Validación**: Solo los pagos con estado "Pendiente" pueden ser editados libremente
5. **Excedentes**: Los excedentes no se aplican automáticamente; requieren acción manual del admin

---

## 🔄 Flujo Recomendado

### Para Pagos Parciales:
1. Validar el pago con el monto parcial
2. Registrar abonos posteriores modificando el monto pagado
3. O crear nuevos pagos para los abonos restantes

### Para Pagos Excedentes:
1. Validar el pago con el monto excedente
2. Registrar el excedente como crédito
3. Aplicar manualmente a otros pagos pendientes si es necesario

---

## 📞 Soporte

Si tienes dudas sobre cómo manejar un caso específico, consulta con el administrador del sistema.

