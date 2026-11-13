# Flujo PayPal Sandbox aislado

## Qué está listo y qué no

OAuth con las credenciales protegidas de OpenClaw confirmado el 2026-11-13. Código de endpoints y botón preparado, **no desplegado ni conectado al checkout comercial**. No se han creado órdenes ni capturado compras reales de Sandbox en esta fase.

Se mantiene Orders v2 oficial vía `fetch`, sin dependencias nuevas ni procesador propio. Se usa redirección al checkout hospedado de PayPal, no un SDK/iframe propio. El adaptador sólo contacta `api-m.sandbox.paypal.com`, con timeout y sin seguir redirecciones.

El flujo prueba un ebook del catálogo servidor ($213 MXN) y el backend también admite productos digitales/programas no recurrentes del catálogo existente. Las promociones automáticas de inscripción siguen el mapeo servidor. Los importes de este catálogo son **fixtures Sandbox**: no sustituir con ellos precios Stripe Live. Se rechazan cupones, importes/moneda del navegador, carritos personalizados, cantidades no enteras/fuera de 1–10, libros físicos/envío y mensualidades. No son funcionalidades resueltas para Live.

## Superficie

El paquete independiente `functions-paypal-sandbox` exporta únicamente cuatro funciones; las operaciones fallan cerradas salvo `PAYPAL_SANDBOX_ENDPOINTS=true`:

- `createPayPalSandboxOrder`: identidad aleatoria de navegador, cotización servidor, persistencia previa e idempotencia del proveedor. Devuelve enlace de aprobación con allowlist estricta Sandbox.
- `capturePayPalSandboxOrder`: token de orden, GET previo, comprobación de receptor/importe/MXN/vínculo antes de capturar, intento persistido, GET posterior y validación de captura completada.
- `getPayPalSandboxStatus`: token de orden, sin PII ni respuestas del proveedor. Devuelve estado local.
- `paypalSandboxWebhook`: verificación oficial con PayPal y el webhook ID configurado; GET de la orden vinculada y recibo transaccional por evento. Nunca confía sólo en el JSON recibido.

Datos de prueba: `paypalSandboxOrders`, `paypalSandboxEvents` y `paypalSandboxCaptures`, y `paypalSandboxRateLimits`. No escribe `ordenes`, `inscripciones`, `alumnos`, colas de correos ni entregas digitales. `entregaSimulada` es sólo un indicador en la orden de prueba, no un permiso real.

Los tokens aleatorios de 32 bytes se generan con Web Crypto; el servidor almacena sólo SHA-256 y vencimiento de 24 horas. El navegador los guarda en `sessionStorage` antes de la primera llamada para soportar reintentos; no van en URLs de retorno ni logs. Sólo la misma pestaña/origen puede continuar tras PayPal. Cerrar la pestaña requiere conciliación por administración; no añadir un bypass anónimo.

## Guardas y configuración pendiente

El backend falla cerrado salvo que:

- `PAYPAL_SANDBOX_ENDPOINTS=true`.
- El proyecto efectivo (`GCLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT`) coincide con `PAYPAL_SANDBOX_PROJECT_ID`. Si es `certificacionmontessori`, se exige además `PAYPAL_SANDBOX_SHARED_PROJECT=certificacionmontessori` (autorizado por Carlos el 2026-11-13).
- Hay `PAYPAL_SANDBOX_MERCHANT_ID`, `PAYPAL_SANDBOX_WEBHOOK_ID` y `PAYPAL_SANDBOX_RETURN_URL` de pruebas.
- Client ID/Secret están disponibles mediante los secretos `PAYPAL_SANDBOX_CLIENT_ID` y `PAYPAL_SANDBOX_CLIENT_SECRET` en el entorno de ejecución seleccionado.

El retorno debe ser un frontend de pruebas HTTPS (o localhost HTTP), sin credenciales/query/fragmento; no se permite el dominio comercial. Configurar `/checkout/paypal-sandbox/`. CORS sólo permite ese origen exacto y es obligatorio en crear/capturar/consultar. Rate limit antes de operar: 20 llamadas/10 min por acción; consulta 60/10 min. El webhook autentica mediante firma en lugar de Origin y devuelve error reintentable si todavía no se vinculó una orden.

Frontend de pruebas, mediante variables **de compilación**:

```
GATSBY_PAYPAL_SANDBOX_ENABLED=true
GATSBY_PAYPAL_SANDBOX_API_BASE_URL=https://us-central1-certificacionmontessori.cloudfunctions.net
```

Sin flag, la ruta muestra «Esta prueba está deshabilitada» y no ofrece botones. No se modifica el formulario comercial ni Stripe. No publicar una compilación de pruebas en hosting productivo.

## Destino aprobado y despliegue independiente (2026-11-13)

Carlos autorizó usar **certificacionmontessori** con pruebas separadas, sin modificar Stripe ni el checkout público. La guarda compartida requiere coincidencia explícita del proyecto; no basta con un booleano. El retorno sigue prohibiendo el dominio comercial, sus subdominios y los dos sitios Firebase Hosting comerciales (`*.web.app` / `*.firebaseapp.com` exactos). Debe prepararse un origen de pruebas HTTPS independiente; no se ha creado ni publicado un sitio nuevo.

Paquete Firebase independiente, código fuente compartido por allowlist sin copiar `.env`, handlers Stripe ni triggers de negocio:

```sh
node alumnos-app/scripts/prepare-paypal-sandbox.cjs
cd alumnos-app/functions-paypal-sandbox
npm ci --ignore-scripts
cd ..
firebase deploy --config firebase.paypal-sandbox.json --project certificacionmontessori \
  --only functions:paypal-sandbox:createPayPalSandboxOrder,functions:paypal-sandbox:capturePayPalSandboxOrder,functions:paypal-sandbox:getPayPalSandboxStatus,functions:paypal-sandbox:paypalSandboxWebhook \
  --non-interactive
```

`firebase.paypal-sandbox.json` es nuevo: no modifica `firebase.json` ni los sitios existentes. El índice Stripe ya no exporta PayPal. Máximo dos instancias por función Sandbox; no reserva instancias mínimas. Usa límites separados `paypalSandboxRateLimits`; Stripe conserva `rate_limits`. Los paquetes generados están ignorados por Git. La preparación no publica nada.

Configuración **no secreta** que deberá cargarse sólo en el paquete generado, nunca en el código Stripe:

```
PAYPAL_SANDBOX_ENDPOINTS=true
PAYPAL_SANDBOX_PROJECT_ID=certificacionmontessori
PAYPAL_SANDBOX_SHARED_PROJECT=certificacionmontessori
PAYPAL_SANDBOX_MERCHANT_ID=<seller Sandbox ya suministrado>
PAYPAL_SANDBOX_WEBHOOK_ID=<webhook real de esta app Sandbox>
PAYPAL_SANDBOX_RETURN_URL=https://<origen-de-pruebas>/checkout/paypal-sandbox/
```

**Bloqueo confirmado, actualizado el 2026-11-13:** se crearon los contenedores `PAYPAL_SANDBOX_CLIENT_ID` y `PAYPAL_SANDBOX_CLIENT_SECRET` en Google Secret Manager con etiqueta `purpose=paypal-sandbox`. Ambos tienen **cero versiones habilitadas**: todavía no contienen las credenciales necesarias para desplegar. Se verificaron únicamente metadatos. Los dos secretos existentes de OpenClaw están vinculados exclusivamente a `api-m.sandbox.paypal.com`. Ese consumidor sólo sustituye en tráfico HTTPS a PayPal; no entrega texto plano al CLI ni puede codificar valores para una versión de Google Secret Manager. No extraerlos ni copiar sentinels al despliegue.

Para desbloquear, Carlos debe añadir una **Nueva versión** a cada contenedor con los valores de su app PayPal **Sandbox**:

- [Cargar Client ID](https://console.cloud.google.com/security/secret-manager/secret/PAYPAL_SANDBOX_CLIENT_ID/versions?project=certificacionmontessori).
- [Cargar Client Secret](https://console.cloud.google.com/security/secret-manager/secret/PAYPAL_SANDBOX_CLIENT_SECRET/versions?project=certificacionmontessori).

La consola abierta en el perfil `automation` pide iniciar sesión en Google; esa autenticación queda a cargo de Carlos. No enviar credenciales al chat ni guardarlas en `.env`. Esto no requiere cambiar Stripe ni la facturación. Después verificar sólo metadatos y el acceso del runtime, preparar el origen de pruebas, registrar/reconciliar un único webhook de la aplicación PayPal Sandbox y aplicar el despliegue acotado. El Merchant ID ya fue proporcionado: no volver a pedirlo. Su asociación se verificará con una orden real. Estos valores Sandbox no habilitan cobros reales; Live requiere credenciales propias y conectar/verificar la entrega comercial.

No se intentó un despliegue incompleto, no se crearon colecciones remotas y no se hizo una compra Sandbox. Las credenciales protegidas actuales se conservaron intactas.

Eventos de webhook Sandbox: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.REFUNDED` y `PAYMENT.CAPTURE.REVERSED`. Aprobar una orden no es pagar. El webhook guarda recibo sólo al aplicar la transacción. Reembolsos (incluidos parciales) quedan en `revision`, reversión/denegación bloquean entrega simulada. Un evento completed tardío no revive esos estados; una devolución detectada por GET también bloquea aunque falte webhook.

## Incertidumbre y conciliación

- Doble clic/reintento de creación usa la misma identidad y `PayPal-Request-Id` persistido. Se rechaza cambiar productos con la misma identidad.
- No reintentar creación sin vínculo después de 5 horas: podría estar fuera de la ventana de idempotencia del proveedor. Revisar la orden remotamente antes de iniciar otra prueba.
- Antes de captura se persiste `captureAttempted`. Si se pierde la respuesta, las llamadas siguientes hacen GET y nunca una segunda captura automática. Si sigue APPROVED sin captura, queda pendiente y requiere conciliación manual, no una clave nueva.
- PENDING/APPROVED nunca generan pago confirmado. El botón de consulta no inicia captura; «Confirmar / reconciliar prueba» sí puede hacer el primer intento cuando la orden remota está aprobada.
- Cancelar el navegador sólo muestra cancelación, no declara fallida una captura que pudiera haberse completado. Consultar el estado real.
- El mapeo captura→orden permite resolver devoluciones sin order_id una vez conocida la captura. Si llega antes, el webhook pide reintento; no acredita ni ignora silenciosamente.

## Verificación

- `npm test --prefix alumnos-app/functions-stripe`: 41 pruebas unitarias, incluyendo guardas de proyecto compartido, separación de rate limits y exportaciones del paquete; cuatro pruebas de integración opt-in adicionales.
- `npm run build` con flags Sandbox para QA local; compilación normal adicional con flags ausentes para verificar que queda apagado.
- Chromium local en `http://127.0.0.1:9000/checkout/paypal-sandbox/`, API y navegación PayPal interceptadas: 1440×1000 y 390×844. Compra → aprobación simulada → retorno pendiente → consulta confirmada; cancelación sin captura adicional. Identidad/título correctos, contenido visible, sin overlay/errores de página/consola ni overflow. Capturas revisadas fuera del repo. Browser plugin ausente; se usó Playwright instalado.

### Concurrencia con el emulador oficial de Firestore (2026-11-13)

Se añadieron cuatro pruebas de integración opt-in en `alumnos-app/functions-stripe/test/paypalFirestore.test.js`. A diferencia de las pruebas unitarias con Map, usan el SDK Firestore y las transacciones del emulador oficial instalado, sin credenciales, despliegue ni facturación. PayPal y la verificación de firma siguen simulados; esto **no prueba una compra ni un webhook reales**.

Resultado: **4/4 correctas**, con seis creaciones concurrentes conservando una clave idempotente/orden, seis capturas simultáneas con un solo intento, respuesta perdida conciliada sin recaptura, y webhooks duplicados/concurrentes con reembolso que no reactiva la entrega simulada. Sólo se escribieron colecciones `paypalSandbox*` del proyecto ficticio `demo-paypal-sandbox`. La creación remota conserva la idempotencia simulada; no demuestra el comportamiento de PayPal bajo concurrencia.

Reproducción local, con el JAR ya instalado (no descargar ni ejecutar software nuevo para repetirlas):

```sh
# Terminal 1: mantiene el proceso en primer plano; detenerlo al terminar.
java -jar /home/carlos/.cache/firebase/emulators/cloud-firestore-emulator-v1.19.8.jar \
  --host 127.0.0.1 --port 8787 --project_id demo-paypal-sandbox \
  --single_project_mode --single_project_mode_error

# Terminal 2: desde alumnos-app/functions-stripe.
PAYPAL_FIRESTORE_INTEGRATION=true FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 \
  node --test test/paypalFirestore.test.js
```

La prueba exige una dirección de emulador en `127.0.0.1` y fija el project ID ficticio; no recurre a Firestore remoto si falta configuración. `npm test --prefix alumnos-app/functions-stripe` sigue ejecutando las 39 unitarias y omite estas cuatro salvo activación explícita. No se cambiaron configuraciones Firebase existentes ni el backend/frontend comercial.

Pendiente: compra buyer/seller Sandbox real, firma de webhook real, conciliación operativa y después diseño compartido de entrega con Stripe, promociones/envíos y revisión Live. La aprobación real del comprador puede requerir que Carlos inicie sesión en la cuenta ficticia de Sandbox. No usar credenciales personales ni saltar 2FA/CAPTCHA.
