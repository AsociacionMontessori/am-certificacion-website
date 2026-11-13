# Flujo PayPal Sandbox aislado

## Qué está listo y qué no

OAuth con las credenciales protegidas de OpenClaw confirmado el 2026-11-13. **Desplegados los cuatro endpoints y el sitio aislado; compra Sandbox y recibo de webhook verificados en Firestore**. La prueba de $213 MXN quedó en `pagado`, con captura vinculada y evento `PAYMENT.CAPTURE.COMPLETED` procesado. El checkout comercial sigue sin conexión PayPal; no se activaron cobros ni entregas reales.

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

Carlos autorizó usar **certificacionmontessori** con pruebas separadas, sin modificar Stripe ni el checkout público. La guarda compartida requiere coincidencia explícita del proyecto; no basta con un booleano. El retorno sigue prohibiendo el dominio comercial, sus subdominios y los dos sitios Firebase Hosting comerciales (`*.web.app` / `*.firebaseapp.com` exactos). El origen independiente es `https://certimontessori-sandbox.web.app/checkout/paypal-sandbox/`. No es un dominio de cobro real.

Paquete Firebase independiente, código fuente compartido por allowlist sin copiar `.env`, handlers Stripe ni triggers de negocio:

```sh
GATSBY_PAYPAL_SANDBOX_ENABLED=true \
GATSBY_PAYPAL_SANDBOX_API_BASE_URL=https://us-central1-certificacionmontessori.cloudfunctions.net npm run build
node alumnos-app/scripts/prepare-paypal-hosting.cjs
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

### Credenciales y webhook (2026-11-13)

Se verificaron sólo metadatos en Google Secret Manager: Client ID versión **3 habilitada**, versión 2 incorrecta **deshabilitada**, y Client Secret versión **1 habilitada**. No se leyeron ni exportaron valores. Firebase configuró el acceso de su runtime a ambos secretos. Los secretos protegidos de OpenClaw permanecen vinculados únicamente a `api-m.sandbox.paypal.com`.

`node alumnos-app/scripts/paypal-sandbox-webhook.js`, ejecutado mediante Gateway exec y su canal HTTPS protegido, autentica exclusivamente contra PayPal Sandbox, lista los webhooks de la aplicación y crea uno sólo si no existe el URL exacto `https://us-central1-certificacionmontessori.cloudfunctions.net/paypalSandboxWebhook`. Valida los tipos con el catálogo oficial y vuelve a leer el recurso. Se confirmó la segunda ejecución con `created: false`, sin duplicados. No imprime credenciales, token OAuth ni respuestas completas. Nunca usar este script con credenciales Live.

El Merchant ID ya fue suministrado por Carlos y se configura sólo en el paquete generado. Su correspondencia con el vendedor debe comprobarse en la compra real Sandbox. No volver a pedir credenciales ya guardadas.

El generador ahora extrae **sólo `CATALOG_META`** del catálogo compartido; el paquete declara únicamente los dos secretos PayPal, no parámetros ni resolutores Stripe. Se comprobó con el registro real de Firebase Functions. El catálogo Stripe original no cambia.

Firebase exige el contenido Hosting dentro de `alumnos-app`: `prepare-paypal-hosting.cjs` prepara `hosting-paypal-sandbox/` (ignorado por Git), incluyendo sólo el HTML de la prueba, page-data de la prueba y assets Gatsby; no publica documentos de checkout comercial ni sitemap. Añade robots disallow y el Hosting fuerza `noindex, nofollow` y `no-store`. Si el staging ya existe, preservarlo/renombrarlo antes de regenerar. Para publicar ese sitio añadir `,hosting` al `--only` del comando anterior. No usar `firebase.json` productivo ni desplegar las compilaciones Sandbox en los sitios comerciales.

La configuración no secreta del runtime se guarda únicamente en `functions-paypal-sandbox/.env.certificacionmontessori`, que está ignorado por Git. No contiene Client ID ni Client Secret. Respaldo previo del config Firebase: `/tmp/paypal-sandbox-config-backups/firebase.paypal-sandbox.json.bak-20261113-130920`. Para rollback del código usar el commit anterior; no borrar automáticamente secretos, webhooks ni órdenes de prueba pendientes. Para detener la prueba desactivar el flag y desplegar sólo estas cuatro funciones, o retirar exclusivamente el sitio Sandbox tras revisión.


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

La compra buyer/seller Sandbox y el procesamiento del webhook real se verificaron después del despliegue (ver sección final). Pendiente: conciliación operativa adicional, pruebas remotas de eventos adversos/reintentos y después diseño compartido de entrega con Stripe, promociones/envíos y revisión Live. No usar credenciales personales ni saltar 2FA/CAPTCHA.

### Resultado del despliegue y smoke test (2026-11-13)

Firebase confirmó `Deploy complete` exclusivamente para `paypal-sandbox` y Hosting `certimontessori-sandbox`. El runtime usa Client ID versión 3 y Secret versión 1, máximo dos instancias por función. No se desplegaron Stripe, reglas Firestore, triggers de negocio ni sitios comerciales.

Verificaciones remotas: página HTTP 200 y cabecera robots correcta; `/checkout/` comercial en el sitio Sandbox devuelve 404; consulta sin Origin da 403 y consulta con Origin válido pero identidad ausente da 400. La página hidratada muestra el botón y el catálogo de $213 MXN. Pulsarlo creó la orden Sandbox `6YC97213PM395315J` y abrió el checkout oficial `www.sandbox.paypal.com`, que solicita login del comprador. **No hubo aprobación ni captura, no se verificó todavía entrega de webhook real.** Se conserva la pestaña `paypal-sandbox` del perfil `automation`; no cerrar ni cambiar de origen/pestaña para aprobar, porque la identidad de continuación está en sessionStorage. Para una nueva prueba en otro navegador iniciar desde la página de pruebas, nunca copiar sólo el URL PayPal.

41 pruebas unitarias correctas; cuatro integraciones del emulador omitidas en esta ejecución (ya verificadas previamente). Build Sandbox correcto. Los scripts/paquete generados contienen sólo configuración pública o fixtures; los secretos no se copiaron a archivos.

### Verificación de compra y webhook posteriores (2026-11-13)

Tras la pantalla «Pago confirmado» reportada por Carlos, el operador comprobó los documentos remotos mediante la consola Firebase autenticada del perfil `automation`, en modo lectura. No volvió a crear ni capturar un pago, ni leyó credenciales. Evidencia:

| Registro | Identificador | Resultado |
| --- | --- | --- |
| `paypalSandboxOrders` | `e34a9eb2-82c2-47d5-84d0-e3ee5928173f` | `environment: sandbox`, `amountCentavos: 21300`, `currency: MXN`, `estado: pagado`, `entregaSimulada: true` |
| Orden PayPal Sandbox | `18N94638YD184945V` | Asociada a la orden anterior |
| `paypalSandboxCaptures` | `8H114974TX863405N` | `ordenId` coincide con la orden anterior y su `captureId` |
| `paypalSandboxEvents` | `WH-8C009609RC6186535-9DK4696035792764G` | `PAYMENT.CAPTURE.COMPLETED`, `ordenId` coincide, `processedAtMs: 1794598226298` |

El evento se procesó el **13/11/2026 a las 13:30:26, America/Mexico_City**. El handler sólo escribe ese recibo después de verificar la firma con PayPal, consultar la orden remota y aplicar la transacción. El código compartido de `paypal/checkout.js` coincide byte a byte con el paquete preparado para el despliegue. Esto confirma el recorrido exitoso de esta compra y webhook Sandbox; no acredita pruebas remotas de duplicados, devoluciones, reversión o entrega comercial. La entrega observada es exclusivamente simulada.

`gcloud logging read` sigue bloqueado por reautenticación de la CLI. No fue necesario cambiar su sesión ni copiar tokens: la sesión web de Firebase permitió comprobar los tres registros. No se consultó Cloud Logging por otra vía ni se afirma una comprobación independiente de su estado HTTP. No hubo cambios ni despliegues en Stripe o en el checkout comercial durante esta verificación.

Las otras dos órdenes visibles de esta prueba permanecen `pendiente`, sin captura registrada: son intentos previos, no pagos adicionales confirmados en Firestore. No se borraron ni se reintentaron.

### Conciliación operativa de sólo lectura (2026-11-13)

Se reutiliza el adaptador oficial Orders v2 existente, sin dependencias nuevas. `paypal/reconciliation.js` compara una referencia registrada con **GET de la orden y GET del evento en PayPal Sandbox**. No crea/captura pagos, reembolsa, reenvía eventos ni lee/escribe Firestore. OAuth usa POST exclusivamente para obtener el token protegido; las consultas de negocio son GET y no siguen redirecciones.

Ejecutar desde la raíz mediante **Gateway exec**, Node 24+ y el canal HTTPS protegido ya configurado; no usar el shell nativo para trasladar secretos ni cargar `.env`:

```sh
node alumnos-app/scripts/paypal-sandbox-reconcile.js \
  --order-id e34a9eb2-82c2-47d5-84d0-e3ee5928173f \
  --paypal-order-id 18N94638YD184945V \
  --capture-id 8H114974TX863405N \
  --event-id WH-8C009609RC6186535-9DK4696035792764G \
  --amount-centavos 21300 --merchant-id S9CXXNDCV93SS
```

El CLI obtiene las credenciales Sandbox del entorno protegido sin imprimirlas. Sólo devuelve booleanos de comprobación y metadatos mínimos, nunca cuerpos PayPal, pagador, tokens ni URLs de aprobación. Salida 0: coincide la referencia; 2: requiere revisión; 1: argumentos/canal/API no disponibles. No modifica estados ni concede entrega, incluso si coincide. Una captura pendiente/reembolsada o un importe, receptor, moneda, vínculo o evento discrepantes impiden el resultado correcto; un evento completed histórico no oculta una captura actualmente reembolsada.

**Ejecución real completada:** `checkedAtMs: 1794598687994`, `ok: true`, las nueve comprobaciones correctas. Se confirmó orden/identidad local, receptor, importe de orden, captura vinculada y completada, identidad/tipo del evento, captura del evento, orden del evento e importe del evento. [Resultado mínimo conservado](qa/paypal-sandbox-reconciliation-2026-11-13.json).

Esta consulta compara PayPal con la referencia de Firestore verificada anteriormente; **no es una nueva lectura de Firestore**, reparación de datos ni prueba de entrega/reintento del webhook. Consultar un evento autenticado en la API tampoco sustituye verificar la firma HTTP de un webhook entrante. El recibo Firestore y la verificación de firma se comprobaron en la fase anterior.

Verificación local: **48 pruebas correctas; cuatro integraciones Firestore opt-in omitidas**. Siete pruebas nuevas cubren el CLI cerrado, sólo lectura/salida mínima, discrepancias, eventos históricos frente a reembolsos/pendientes, entradas inválidas, fallo sin reintento y GET Sandbox sin redirecciones. No se cambió ni desplegó Stripe, checkout comercial o configuración Firebase.

Siguiente pendiente: ensayar reenvío/duplicados y eventos adversos contra el endpoint remoto Sandbox, conservando su evidencia. Después, diseñar la entrega transaccional compartida con Stripe y resolver promociones/envíos antes de cualquier revisión Live. Las pruebas automatizadas adversas siguen siendo simuladas; no se realizaron reembolsos ni reenvíos remotos en esta fase.
