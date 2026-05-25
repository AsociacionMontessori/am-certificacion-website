# Auditoría Exhaustiva de Seguridad — Certificación Montessori

**Repositorio:** `/home/carlos/Documentos/Repositorios/certificacionMontessori`
**Fecha:** 2026-05-25
**Alcance:** sitio público Gatsby, portal `alumnos-app`, Firebase Hosting, Cloud Functions default, Cloud Functions Stripe, Firestore rules y Storage rules.
**Metodología:** revisión manual línea-a-línea de reglas Firebase, handlers HTTP, frontend (XSS / token storage / redirects), inventario de scripts externos, `npm audit`, grep de patrones peligrosos y revisión de historial de git para fugas de secretos.

---

## Resumen Ejecutivo

El proyecto trae un audit previo del mismo día (`SECURITY_AUDIT_2026-05-25.md`) que cerró deuda de dependencias y agregó hardening básico de hosting / rate limiting / CORS. Sin embargo, esta auditoría detecta **vulnerabilidades nuevas, críticas y altas** que no estaban listadas, principalmente alrededor del modelo de autenticación por `ordenId` y de las reglas de Firestore para `alumnos`.

**Hallazgos críticos (bloquean go-live):**

1. **F-01 (CRITICAL)** — `allow list: if true` en `alumnos` permite dump anónimo de toda la base de alumnos (PII, contraseña temporal en claro, CURP).
2. **F-02 (CRITICAL)** — `ordenId` actúa como bearer token de hecho y se filtra en `success_url`; cualquier persona con la URL accede a PII completa, secuestra la inscripción y sube archivos a expediente ajeno.
3. **F-03 (HIGH)** — `passwordTemporal` y `passwordClassroom` se guardan en texto plano en `alumnos/{uid}`, expuestos por F-01.

**Otros altos / medios:**

4. **F-04 (HIGH)** — HTML injection en correos administrativos (`notifyAdminOrdenPagada`) desde `nombre`/`email`/`programa` del cliente, sin escape.
5. **F-05 (HIGH)** — Email-abuse: `completeInscripcionParte1` envía correo "Bienvenido" al `emailContacto` que envía el cliente (con contraseña interna en el HTML).
6. **F-06 (MEDIUM)** — Rate limiting basado en `x-forwarded-for[0]`, que el cliente puede falsificar en Cloud Functions v2.
7. **F-07 (MEDIUM)** — CORS allowlist incluye `localhost:8000` y `localhost:5173` en producción.
8. **F-08 (MEDIUM)** — Sin CSP en Hosting; el script externo `https://w.behold.so/widget.js` se carga sin SRI.
9. **F-09 (MEDIUM)** — Reglas Storage `comprobantes`: el bloque `write` del alumno está restringido por tamaño y MIME, pero los bloques posteriores `allow read` del admin/grupos pueden sobrescribir reglas previas a través de la semántica OR de Firestore rules — efecto neto seguro, pero la estructura invita a regresiones.
10. **F-10 (LOW)** — `Cache-Control` para HTML por 1 hora; un usuario que cierra sesión podría servir páginas con datos sensibles desde caché del browser.
11. **F-11 (LOW)** — Generador `generarCodigoVerificacion` usa un hash polinómico de 32-bit no criptográfico para emitir el código de verificación de certificados; el dominio se vuelve adivinable con un esfuerzo modesto si un atacante conoce un par `(folio, código)`.
12. **F-12 (INFO)** — Múltiples `target="_blank"` con `rel="noopener noreferrer"` correctos. Otros `target="_blank"` en `components/footer.js` apuntan a rutas internas, lo cual es solo molestia UX.

`npm audit` está limpio en los cuatro paquetes. No se detectaron secretos commiteados (`sk_live_*`, `sk_test_*` reales, `.env`, `.env.stripe.local`, `.env.certificacionmontessori` están todos gitignored y nunca fueron añadidos al historial).

**Mi recomendación es bloquear el go-live de Stripe Live hasta cerrar al menos F-01, F-02, F-03, F-04 y F-05.**

---

## 1) Hallazgos Críticos

### F-01 — Dump anónimo de toda la colección `alumnos` por `allow list: if true`

* **Severidad:** Critical
* **Impacto:** Filtración masiva de PII de todos los alumnos (nombre, email contacto, email institucional, teléfono, fecha de nacimiento, nacionalidad, CURP/pasaporte, domicilio, escolaridad, ocupación, empresa, contraseña temporal en texto plano, contraseña Classroom, niveles, fechas).
* **Ubicación:** `firestore.rules:102-121`

**Evidencia:**

```firestore-rules
match /alumnos/{alumnoId} {
  allow read: if isOwnAlumno(alumnoId)
               || canReadAdmin()
               || canReadAlumno(alumnoId)
               || (request.auth == null &&
                   resource.data.folioCertificado != null &&
                   resource.data.codigoVerificacion != null &&
                   resource.data.estado != 'Inactivo');

  allow write: if isOwnAlumno(alumnoId) || isAdmin();

  // Permitir consultas (list) para verificación de certificados
  allow list: if true; // ← problema
}
```

**Por qué es vulnerable:** Firestore evalúa security rules sobre la **query**, no documento por documento, en operaciones `list`. `resource.data.X` no está disponible durante `list`. Por lo tanto, el `read` con condiciones sobre `resource.data` solo cubre `get`. El `allow list: if true` permite cualquier query, incluyendo `db.collection('alumnos').limit(10000).get()` desde un cliente no autenticado. La intención del autor ("seguro porque necesitas folio + código") no la enforza la regla — la regla simplemente no verifica nada.

**Reproducción (lado atacante anónimo):**

```js
const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, getDocs, limit, query } =
  await import('firebase/firestore');
const app = initializeApp(/* config pública del sitio */);
const db = getFirestore(app);
const snap = await getDocs(query(collection(db, 'alumnos'), limit(1000)));
snap.forEach(d => console.log(d.id, d.data())); // todos los campos PII
```

**Fix recomendado:**

* Endurecer la regla `list` para exigir filtro por `folioCertificado` y `codigoVerificacion`, con `limit` chico:

  ```firestore-rules
  allow list: if request.auth == null
                 && request.query.limit <= 5
                 && 'folioCertificado' in request.query.where
                 && 'codigoVerificacion' in request.query.where;
  ```

  Nota: las security rules de Firestore tienen capacidad limitada para inspeccionar el `where`. La alternativa correcta es **mover la verificación de certificados a una Cloud Function** (`verificarCertificadoPublico({folio, codigo})`) y poner `allow list: if canReadAdmin() || isCatedratico();`.
* Adicionalmente, **no almacenar `passwordTemporal` ni `passwordClassroom` en Firestore** (ver F-03).

**Mitigación temporal (mismo día):**

* En `firestore.rules` cambiar `allow list: if true;` a `allow list: if canReadAdmin();` y desplegar.
* Migrar verificación pública a Function (en horas, no días).

---

### F-02 — `ordenId` actúa como token portador y se filtra por la `success_url`

* **Severidad:** Critical (con explotación 1-click)
* **Impacto:** Cualquiera que conozca un `ordenId` puede:
  * Leer PII completa del comprador y del alumno (`getInscripcionOrden`).
  * Secuestrar la cuenta institucional creándola con su propio `usuarioInstitucional` y password antes que el comprador real (`completeInscripcionParte1`).
  * Sobrescribir el expediente legítimo después de parte 1 (`completeInscripcionParte2` hace `merge:true`).
  * Subir archivos arbitrarios al expediente de cualquier alumno (`getInscripcionUploadUrl`).
* **Ubicación:**
  * `alumnos-app/functions-stripe/stripe/createPublicCheckout.js:197` — `success_url: ${siteUrl}/checkout/success?orden=${ordenRef.id}&tipo=${tipo}…`
  * `alumnos-app/functions-stripe/stripe/getInscripcionOrden.js:11-108` — endpoint público que regresa todos los campos PII de la orden + inscripción si solo conoces `ordenId`.
  * `alumnos-app/functions-stripe/stripe/completeInscripcionParte1.js:40-310` — no exige autenticación, solo `ordenId`.
  * `alumnos-app/functions-stripe/stripe/completeInscripcionParte2.js:19-173` — no exige autenticación, solo `ordenId`.
  * `alumnos-app/functions-stripe/stripe/getInscripcionUploadUrl.js:20-90` — no exige autenticación, solo `ordenId`.

**Por qué es vulnerable:** `ordenRef.id` es un ID Firestore de 20 caracteres (aleatorio, no enumerable trivialmente), pero **se transmite en query string** dentro de `success_url`. Eso es visible en historial de browser, en logs de Stripe Dashboard, en analytics, en referer header al hacer click en cualquier enlace externo desde `/checkout/success`, en capturas de pantalla, en logs de soporte, etc. Y el sistema no requiere otro factor para ejercer acciones críticas sobre el expediente.

**Fix recomendado (capas):**

1. **Emitir un token de cliente firmado, distinto de `ordenId`.** Generar `accessToken` aleatorio de 32 bytes en `createPublicCheckout`, guardar `accessTokenHash` (sha256) en la orden, devolverlo solo dentro del `success_url`. Validar en `getInscripcionOrden`, `completeInscripcionParte1`, `completeInscripcionParte2`, `getInscripcionUploadUrl`. Igual que ya se hace con `digitalDownloadToken` para ebooks (¡buen patrón, replicarlo!).
2. **Forzar idempotencia y bloqueo de re-submission en parte 2.** Si `parte2Completa: true`, rechazar nuevos `completeInscripcionParte2`.
3. **Restringir `expediente/{alumnoId}` en storage rules** para que el alumno solo pueda escribir/leer su propio expediente una vez autenticado, y la subida pública solo funcione con `accessToken` válido y a través de la signed URL emitida por la Function.
4. **Bajar el TTL del token** (15-30 min basta para completar parte 1 + parte 2).

**Mitigación temporal (parche en horas):**

* Marcar la orden con `parte1CompletadaPor` y rechazar `parte1` si ya fue completada (esto ya existe).
* Bloquear `parte2` si `parte2Completa: true` (no existe; añadir).
* Bloquear `getInscripcionOrden` para no devolver `datosParte2` ni `documentos` (datos altamente sensibles) sin un token adicional.

---

### F-03 — Contraseña temporal en texto plano en `alumnos/{uid}`

* **Severidad:** High (escala a Critical si F-01 no se cierra)
* **Impacto:** Cualquier dump de `alumnos` revela credenciales operativas Firebase Auth + Google Workspace del alumno.
* **Ubicación:** `alumnos-app/functions-stripe/stripe/inscripcionAlumno.js:69-71`

**Evidencia:**

```js
const alumnoData = {
  ...
  passwordClassroom: passwordClassroom || null,
  passwordTemporal: passwordTemporal || null,
  mailClassroom: emailInstitucional,
};
```

**Por qué es vulnerable:** Firebase Auth ya almacena la contraseña hasheada. Mantener una copia en Firestore añade superficie sin valor real (no se puede "leer" la contraseña original desde Firebase Auth para cambiarla, pero se puede emitir un password reset). Si un admin con permisos de lectura sobre `alumnos` se compromete, las contraseñas Google Workspace quedan al descubierto. Sumado a F-01, cualquier anónimo las lee.

**Fix recomendado:**

* Eliminar `passwordTemporal` y `passwordClassroom` del documento `alumnos`.
* Si necesitas que el alumno vea su password una vez: muéstrala en la respuesta de la Function al completar parte 1 (no la persistas) y/o envíala por correo (lo cual ya se hace en `notifyAlumnoCuentaCreada`).
* Si en el futuro necesitas rotar passwords desde admin, usa `admin.auth().updateUser({password})` para Firebase y la Directory API de Google Workspace; no guardes el plaintext.

**Migración:** un script `node` de un solo uso que borre los campos en `alumnos` y, opcionalmente, fuerce `passwordChangeRequired = true` por correo.

---

## 2) Hallazgos Altos

### F-04 — HTML injection en correos a admin desde campos del cliente

* **Severidad:** High (depende del cliente de correo del admin; Gmail web sanitiza, otros pueden no)
* **Impacto:** Phishing / XSS dirigido a administradores. Posible ejecución de JS o renderizado de UI engañosa dentro del cliente de correo.
* **Ubicación:**
  * `alumnos-app/functions-stripe/stripe/notifications.js:43-52` (HTML construido con `cliente.nombre`, `cliente.email`, `orden.lineItems[].descripcion`, `orden.programa`).
  * `alumnos-app/functions-stripe/stripe/notifications.js:81-96` (`accesoHtml` con `passwordAcceso` y `nombre`).
  * `alumnos-app/functions-stripe/stripe/webhook.js:113` (`html: <p>El pago <strong>${pagoId}</strong>… </p>` — `pagoId` es controlado por el sistema, bajo riesgo).
  * `alumnos-app/functions-stripe/stripe/completeInscripcionParte1.js:261-264` (`<pre>${JSON.stringify(googleWorkspace)}</pre>` y `${nombre}`).

**Evidencia (notifications.js):**

```js
const html = `
  <h2>Nuevo pago recibido (Stripe)</h2>
  <p><strong>Cliente:</strong> ${cliente.nombre || "—"} (${cliente.email || "—"})</p>
  ...
`;
```

**Fix recomendado:** introducir un helper de escape HTML mínimo y usarlo en todas las interpolaciones:

```js
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
```

Aplicar a `cliente.nombre`, `cliente.email`, `orden.programa`, `lineItems[].descripcion`, `nombre`, `emailInstitucional`, `nivelEspecializacion`.

---

### F-05 — Email-abuse: bienvenida con contraseña al `emailContacto` controlado por el atacante

* **Severidad:** High (a través de F-02), Medium en standalone
* **Impacto:** Si un atacante secuestra una orden vía F-02, controla `emailContacto` y se envía a sí mismo el correo "Tu cuenta en Certificación Montessori está lista" con `password` plaintext. Además, el sistema puede ser usado como remitente legítimo (Gmail org) para mandar mensajes a víctimas con asunto y plantilla institucionales.
* **Ubicación:** `alumnos-app/functions-stripe/stripe/notifications.js:67-114`, `alumnos-app/functions-stripe/stripe/completeInscripcionParte1.js:277-289`.

**Fix recomendado:**

* Validar `emailContacto` contra `orden.cliente.email` (lo que Stripe ya tiene del comprador). Si no coinciden, requerir confirmación adicional o usar `orden.cliente.email` como destino.
* Resolver F-02 primero (un atacante sin `ordenId` no puede llegar a este flujo).
* Limitar contenido del correo: no incluir la contraseña en texto; redirigir al usuario al portal para fijar su contraseña inicial.

---

## 3) Hallazgos Medios

### F-06 — Rate limit basado en `x-forwarded-for[0]` falsificable

* **Severidad:** Medium
* **Impacto:** Atacante eludge el rate-limit por petición simplemente añadiendo un `X-Forwarded-For` con un valor aleatorio en cada request.
* **Ubicación:** `alumnos-app/functions-stripe/stripe/rateLimit.js:4-8`

**Evidencia:**

```js
function getRequestIp(req) {
  const forwardedFor = String(req.get("x-forwarded-for") || "")
      .split(",")[0]   // ← cliente controla el primero
      .trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";
}
```

**Por qué es vulnerable:** En Cloud Functions v2 (Cloud Run) el proxy **prepone** la IP del cliente y los LBs después. Es decir, si el cliente manda `X-Forwarded-For: 1.2.3.4`, el header final es `1.2.3.4, <client-real-ip>, <LB-ip>`. Tomar `split(',')[0]` toma el valor controlado por el atacante.

**Fix:** tomar el **penúltimo** (la IP que GCP añade) o usar el header `Fastly-Client-IP` / `X-Forwarded-For` validando contra una allowlist de proxies, o mejor: usar Firebase App Check para autenticar al cliente browser y bajar la confianza en IP.

**Patrón mínimo aceptable:**

```js
function getRequestIp(req) {
  const xff = String(req.get("x-forwarded-for") || "").split(",").map(s => s.trim()).filter(Boolean);
  // GCP añade siempre 1 IP; tomar la última controlada por GCP.
  return xff[xff.length - 1] || req.ip || "unknown";
}
```

Y combinar con `Firebase App Check` para los endpoints de inscripción.

---

### F-07 — CORS allowlist incluye `localhost` en producción

* **Severidad:** Medium
* **Impacto:** Reduce el valor del control CORS como anti-abuse desde browsers. Un atacante con XSS local o que ejecuta un wrapper en `localhost:8000` puede llamar a los endpoints públicos con `credentials`.
* **Ubicación:** `alumnos-app/functions-stripe/stripe/cors.js:1-14`.

**Fix:** Separar allowlists por entorno mediante `process.env.NODE_ENV` o `process.env.FIREBASE_CONFIG` y emitir el localhost solo cuando se despliega en el proyecto `stripe-test`:

```js
const isTestDeploy = process.env.FUNCTIONS_DEPLOYMENT === "test";
const baseOrigins = ["https://certificacionmontessori.com", "https://www.certificacionmontessori.com", "https://alumnos.certificacionmontessori.com"];
const testOrigins = ["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5173", "http://127.0.0.1:5173"];
const ALLOWED_ORIGINS = new Set(isTestDeploy ? [...baseOrigins, ...testOrigins] : baseOrigins);
```

---

### F-08 — Sin CSP en Hosting; script externo `behold.so` sin SRI

* **Severidad:** Medium
* **Impacto:** Si el CDN o el dominio `w.behold.so` se compromete, ejecuta JS arbitrario en `certificacionmontessori.com` con acceso a cookies de sesión, formularios de checkout, datos del visitante.
* **Ubicación:**
  * Sin `Content-Security-Policy` en `firebase.json` ni `alumnos-app/firebase.json`.
  * `src/pages/contact.js:46` — `<script src="https://w.behold.so/widget.js" type="module"></script>` sin `integrity` ni `crossorigin`.
  * Google gtag (vía `gatsby-plugin-google-gtag`) carga JS de googletagmanager sin SRI; aceptado por ser tracking estándar pero documentarlo en CSP.

**Fix gradual:**

1. **Inventariar** todos los scripts externos vía DevTools en preview (Gatsby + alumnos-app).
2. **Auto-hospedar** `widget.js` de Behold si la página solo lo requiere ocasionalmente; o pinear versión + añadir `integrity` SHA-384.
3. **Diseñar una CSP mínima** y desplegarla en modo `Content-Security-Policy-Report-Only` durante una semana. Cuando los reports bajen a cero, mover a `Content-Security-Policy` enforce. Esqueleto inicial:

   ```
   default-src 'self';
   script-src 'self' https://www.googletagmanager.com https://w.behold.so https://js.stripe.com;
   connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net https://api.stripe.com;
   img-src 'self' data: https:;
   style-src 'self' 'unsafe-inline';
   frame-src https://js.stripe.com https://checkout.stripe.com https://drive.google.com;
   frame-ancestors 'self';
   ```

4. **No** habilitar HSTS desde el repo aún (Firebase Hosting ya lo emite por defecto en preview).

---

### F-09 — Storage rules sobrescritas con OR entre bloques en `comprobantes`

* **Severidad:** Medium (estructural / mantenibilidad)
* **Impacto:** Hoy el efecto neto es seguro, pero la estructura `match /comprobantes/{alumnoId}/{archivo}` con tres bloques `allow read`/`allow write` separados se evalúa como **OR** entre ellos. Un futuro cambio de tamaño máximo o de MIME en un bloque no aplica al otro: regresión silenciosa.
* **Ubicación:** `storage.rules:32-50`.

**Fix recomendado:** consolidar:

```firestore-rules
match /comprobantes/{alumnoId}/{archivo} {
  allow read: if request.auth != null && (
                request.auth.uid == alumnoId
                || isAdmin() || isDirectivo() || canReadAlumno(alumnoId)
              );
  allow write: if request.auth != null
              && request.resource.size < 5 * 1024 * 1024
              && request.resource.contentType.matches('image/.*|application/pdf')
              && (request.auth.uid == alumnoId || isAdmin());
  allow delete: if isAdmin();
}
```

---

## 4) Hallazgos Bajos / Informativos

### F-10 — `Cache-Control: max-age=3600` para HTML

* **Severidad:** Low
* **Ubicación:** `firebase.json:75-82`.
* **Impacto:** Páginas autenticadas servidas con cache de 1h. Para un SPA Gatsby es aceptable; revisar que ninguna ruta personalizada (e.g. `/checkout/success?orden=…`) genere HTML estático con contenido sensible. (Hoy es client-side rendering, así que el riesgo es bajo.)
* **Fix:** dejar como está; documentar.

### F-11 — `generarCodigoVerificacion` usa hash no-criptográfico de 32-bit

* **Severidad:** Low (defense-in-depth)
* **Ubicación:** `alumnos-app/src/services/certificadoService.js:9-17, 37-46`.
* **Impacto:** El código de verificación se deriva de `hashString(${alumnoId}-${folio})` con un hash polinómico de 32-bit. Si un atacante conoce un `(folio, código)` válido y sabe el formato del `alumnoId`, puede invertir la función o causar colisiones más fácilmente que con SHA-256. En conjunto con F-01, la verificación pública se vuelve trivial.
* **Fix:** generar el código con `crypto.randomBytes(8).toString('hex').toUpperCase()` server-side y guardarlo en Firestore. La función `verificarCertificado` debe correr server-side (Cloud Function) y comparar con `timingSafeEqual` para evitar oráculos de tiempo.

### F-12 — `target="_blank"` consistente con `rel="noopener noreferrer"`

* **Severidad:** Info
* **Observación:** la mayoría de enlaces externos en Gatsby usan `rel="noopener noreferrer"` correctamente. Algunos `<a target="_blank">` en `components/footer.js` apuntan a rutas internas sin `rel`; es un nit UX pero no riesgo.

---

## 5) Verificaciones que SÍ pasaron

* `npm audit` limpio en `./`, `alumnos-app/`, `alumnos-app/functions/`, `alumnos-app/functions-stripe/`.
* No hay `.env*` reales en el historial git; los gitignore están aplicados.
* No se detectaron `eval(`, `new Function(`, `document.write(` ni `dangerouslySetInnerHTML` en `src/` ni `alumnos-app/src/`.
* `localStorage`/`sessionStorage` no se usan para tokens JWT (solo theme, viewMode, alertas). Firebase Auth maneja la sesión con IndexedDB internamente, que es lo correcto.
* Webhook Stripe valida firma con `constructEvent` y tiene idempotencia (`stripe_events`).
* `createAlumnoCheckout`, `createSubscriptionCheckout`, `createCustomerPortal` exigen `Bearer` token y validan `decoded.uid` contra `pago.alumnoId`.
* Firebase API key del sitio público está restringida correctamente como variable pública (Vite `import.meta.env.VITE_*`); recordar que en la consola GCP se debe restringir por **HTTP referrer** a los dominios del proyecto.
* Stripe metadata no incluye CURP/RFC/contraseñas (cumple lo que dice `docs/STRIPE_COMPLIANCE.md`).

---

## 6) Plan de Acción Priorizado

### Fase 0 — Mitigaciones inmediatas (mismo día, < 4 horas)

| # | Acción | Archivo | Cierra |
|---|--------|---------|--------|
| 1 | Cambiar `allow list: if true;` por `allow list: if canReadAdmin() \|\| isCatedratico();` y desplegar reglas. | `firestore.rules:120` | F-01 (parcial; rompe verificación pública por minutos hasta Fase 1.3) |
| 2 | Bloquear `parte2` si `inscripcion.parte2Completa === true`. | `alumnos-app/functions-stripe/stripe/completeInscripcionParte2.js` | F-02 (parcial) |
| 3 | Recortar `getInscripcionOrden` para no devolver `datosParte2`/`documentos` ni `curpPasaporte`, ni `domicilio` ni `usuarioInstitucional`. | `alumnos-app/functions-stripe/stripe/getInscripcionOrden.js:82-100` | F-02 (parcial) |
| 4 | Borrar `passwordTemporal` y `passwordClassroom` de los `alumnos` existentes vía script `node` con Admin SDK. | `scripts/` (nuevo) | F-03 |
| 5 | Añadir `escapeHtml` y aplicar a `cliente.nombre`/`cliente.email`/`orden.programa`/`lineItems[].descripcion`/`nombre` en `notifications.js`, `webhook.js`, `completeInscripcionParte1.js`. | varios | F-04 |

### Fase 1 — Cierre estructural (esta semana)

| # | Acción | Cierra |
|---|--------|--------|
| 1.1 | Implementar `accessToken` aleatorio por orden, devuelto en `success_url` y exigido por `getInscripcionOrden`, `completeInscripcionParte1`, `completeInscripcionParte2`, `getInscripcionUploadUrl`. Hashear server-side (`accessTokenHash`). | F-02, F-05 |
| 1.2 | Eliminar `passwordTemporal`/`passwordClassroom` del `set` en `inscripcionAlumno.js`. | F-03 |
| 1.3 | Migrar verificación pública de certificados a una Cloud Function `verificarCertificadoPublico({folio, codigo})` con rate limit y respuesta mínima (nombre, nivel, fecha graduación). Re-permitir `allow list` solo a admins. | F-01 |
| 1.4 | Corregir `getRequestIp` para tomar la última IP del XFF (la que GCP añade). | F-06 |
| 1.5 | Separar CORS por entorno; remover localhost del bundle de producción Live. | F-07 |
| 1.6 | Validar `emailContacto === orden.cliente.email` antes de mandar bienvenida. | F-05 |

### Fase 2 — Hardening (próximas dos semanas)

| # | Acción | Cierra |
|---|--------|--------|
| 2.1 | Inventario completo de scripts externos en Gatsby; auto-hospedar Behold o añadir SRI; CSP report-only en `firebase.json`. | F-08 |
| 2.2 | Habilitar **Firebase App Check** en endpoints públicos (`createPublicCheckout`, `getInscripcionOrden`, `completeInscripcion*`). | F-02, F-06 |
| 2.3 | Consolidar Storage rules para `comprobantes` y `expediente`. | F-09 |
| 2.4 | Regenerar `codigoVerificacion` server-side con `crypto.randomBytes`. Migrar valores existentes vía script. | F-11 |
| 2.5 | Auditoría log + alertas: error rate de Functions Stripe, intentos 403/429, webhook firma inválida. | (operacional) |

### Fase 3 — Go-Live Stripe Live

Solo después de cerrar Fase 0 y Fase 1:

1. Restringir API key Firebase Web por HTTP referrer en GCP Console (al menos `*.certificacionmontessori.com`, `*.firebaseapp.com`, `*.web.app`).
2. Confirmar secretos live en Firebase Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
3. Webhook live apuntando al endpoint correcto.
4. Prueba real pequeña + cancelación + reembolso + idempotencia.
5. Runbook de incidente y rotación de secretos.

---

## 7) Conclusión

El proyecto tiene buena disciplina en muchos frentes (dependencias limpias, webhook firmado, secretos en Firebase Secrets, no commit de `.env*`, idempotencia, rate limiting por endpoint). Sin embargo, los hallazgos F-01, F-02 y F-03 son **bloqueadores reales** para producción Live: cualquier persona con un browser puede, hoy mismo, exfiltrar la base completa de alumnos y, conociendo un `ordenId`, hacer ataques de secuestro de cuenta o relleno de expediente.

Recomiendo aplicar inmediatamente la Fase 0 (cambios pequeños, alto impacto), planear Fase 1 esta semana y postergar Stripe Live hasta cerrar al menos Fase 1.
