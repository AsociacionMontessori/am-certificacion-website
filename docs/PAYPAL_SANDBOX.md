# Flujo PayPal Sandbox aislado

## Qué está listo y qué no

OAuth con las credenciales protegidas de OpenClaw confirmado el 2026-11-13. Código de endpoints y botón preparado, **no desplegado ni conectado al checkout comercial**. No se han creado órdenes ni capturado compras reales de Sandbox en esta fase.

Se mantiene Orders v2 oficial vía `fetch`, sin dependencias nuevas ni procesador propio. Se usa redirección al checkout hospedado de PayPal, no un SDK/iframe propio. El adaptador sólo contacta `api-m.sandbox.paypal.com`, con timeout y sin seguir redirecciones.

El flujo prueba un ebook del catálogo servidor ($213 MXN) y el backend también admite productos digitales/programas no recurrentes del catálogo existente. Las promociones automáticas de inscripción siguen el mapeo servidor. Los importes de este catálogo son **fixtures Sandbox**: no sustituir con ellos precios Stripe Live. Se rechazan cupones, importes/moneda del navegador, carritos personalizados, cantidades no enteras/fuera de 1–10, libros físicos/envío y mensualidades. No son funcionalidades resueltas para Live.

## Superficie

Sólo con `PAYPAL_SANDBOX_ENDPOINTS=true`, `alumnos-app/functions-stripe/index.js` exporta:

- `createPayPalSandboxOrder`: identidad aleatoria de navegador, cotización servidor, persistencia previa e idempotencia del proveedor. Devuelve enlace de aprobación con allowlist estricta Sandbox.
- `capturePayPalSandboxOrder`: token de orden, GET previo, comprobación de receptor/importe/MXN/vínculo antes de capturar, intento persistido, GET posterior y validación de captura completada.
- `getPayPalSandboxStatus`: token de orden, sin PII ni respuestas del proveedor. Devuelve estado local.
- `paypalSandboxWebhook`: verificación oficial con PayPal y el webhook ID configurado; GET de la orden vinculada y recibo transaccional por evento. Nunca confía sólo en el JSON recibido.

Datos de prueba: `paypalSandboxOrders`, `paypalSandboxEvents` y `paypalSandboxCaptures`, más `rate_limits`. No escribe `ordenes`, `inscripciones`, `alumnos`, colas de correos ni entregas digitales. `entregaSimulada` es sólo un indicador en la orden de prueba, no un permiso real.

Los tokens aleatorios de 32 bytes se generan con Web Crypto; el servidor almacena sólo SHA-256 y vencimiento de 24 horas. El navegador los guarda en `sessionStorage` antes de la primera llamada para soportar reintentos; no van en URLs de retorno ni logs. Sólo la misma pestaña/origen puede continuar tras PayPal. Cerrar la pestaña requiere conciliación por administración; no añadir un bypass anónimo.

## Guardas y configuración pendiente

El backend falla cerrado salvo que:

- `PAYPAL_SANDBOX_ENDPOINTS=true`.
- El proyecto efectivo (`GCLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT`) coincide con `PAYPAL_SANDBOX_PROJECT_ID` y **no** es `certificacionmontessori`.
- Hay `PAYPAL_SANDBOX_MERCHANT_ID`, `PAYPAL_SANDBOX_WEBHOOK_ID` y `PAYPAL_SANDBOX_RETURN_URL` de pruebas.
- Client ID/Secret están disponibles mediante los secretos `PAYPAL_SANDBOX_CLIENT_ID` y `PAYPAL_SANDBOX_CLIENT_SECRET` en el entorno de ejecución seleccionado.

El retorno debe ser un frontend de pruebas HTTPS (o localhost HTTP), sin credenciales/query/fragmento; no se permite el dominio comercial. Configurar `/checkout/paypal-sandbox/`. CORS sólo permite ese origen exacto y es obligatorio en crear/capturar/consultar. Rate limit antes de operar: 20 llamadas/10 min por acción; consulta 60/10 min. El webhook autentica mediante firma en lugar de Origin y devuelve error reintentable si todavía no se vinculó una orden.

Frontend de pruebas, mediante variables **de compilación**:

```
GATSBY_PAYPAL_SANDBOX_ENABLED=true
GATSBY_PAYPAL_SANDBOX_API_BASE_URL=https://us-central1-PROYECTO-DE-PRUEBAS.cloudfunctions.net
```

Sin flag, la ruta muestra «Esta prueba está deshabilitada» y no ofrece botones. No se modifica el formulario comercial ni Stripe. No publicar una compilación de pruebas en hosting productivo.

**No se trasladaron secretos** desde OpenClaw a Google Secret Manager ni se cambió configuración Firebase. Carlos proporcionó el Merchant ID del seller Sandbox el 2026-11-13; su formato es válido, pero su asociación con la aplicación todavía no se ha verificado mediante una orden real. No volver a pedir el identificador ni las credenciales ya suministradas. La consulta Firebase se repitió ese día: no hay proyecto inequívocamente etiquetado como Sandbox. No reutilizar otro proyecto por su nombre parecido ni crear recursos con facturación sin acordar destino/costo. Para la siguiente compra falta resolver el entorno aislado; después registrar el webhook de ese entorno y cargar secretos por un mecanismo protegido, sin imprimir/copiar valores al chat, repositorio o `.env`.

Si se prueba un despliegue, limitar explícitamente `functions:stripe:createPayPalSandboxOrder`, `functions:stripe:capturePayPalSandboxOrder`, `functions:stripe:getPayPalSandboxStatus` y `functions:stripe:paypalSandboxWebhook`, con `--project` del proyecto aislado. No desplegar todo el codebase: también contiene triggers de negocio y otros servicios ajenos a estas pruebas.

Eventos de webhook Sandbox: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.REFUNDED` y `PAYMENT.CAPTURE.REVERSED`. Aprobar una orden no es pagar. El webhook guarda recibo sólo al aplicar la transacción. Reembolsos (incluidos parciales) quedan en `revision`, reversión/denegación bloquean entrega simulada. Un evento completed tardío no revive esos estados; una devolución detectada por GET también bloquea aunque falte webhook.

## Incertidumbre y conciliación

- Doble clic/reintento de creación usa la misma identidad y `PayPal-Request-Id` persistido. Se rechaza cambiar productos con la misma identidad.
- No reintentar creación sin vínculo después de 5 horas: podría estar fuera de la ventana de idempotencia del proveedor. Revisar la orden remotamente antes de iniciar otra prueba.
- Antes de captura se persiste `captureAttempted`. Si se pierde la respuesta, las llamadas siguientes hacen GET y nunca una segunda captura automática. Si sigue APPROVED sin captura, queda pendiente y requiere conciliación manual, no una clave nueva.
- PENDING/APPROVED nunca generan pago confirmado. El botón de consulta no inicia captura; «Confirmar / reconciliar prueba» sí puede hacer el primer intento cuando la orden remota está aprobada.
- Cancelar el navegador sólo muestra cancelación, no declara fallida una captura que pudiera haberse completado. Consultar el estado real.
- El mapeo captura→orden permite resolver devoluciones sin order_id una vez conocida la captura. Si llega antes, el webhook pide reintento; no acredita ni ignora silenciosamente.

## Verificación

- `npm test --prefix alumnos-app/functions-stripe`: 39 pruebas correctas, API/proveedor/Firestore simulados.
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
