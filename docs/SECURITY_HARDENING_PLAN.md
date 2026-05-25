# Plan de Endurecimiento de Seguridad

**Repositorio:** `certificacionMontessori`
**Inicio:** 2026-05-25
**Documento base de hallazgos:** `security_best_practices_report.md` en la raíz.
**Reglas de oro:** no romper producción, deploy por capas, validación en preview/emuladores antes de cada paso, cambios reversibles primero.

---

## 1) Resumen de prioridades

| Fase | Objetivo | Riesgo de regresión | Plazo |
|------|----------|---------------------|-------|
| Fase 0 | Hardening sin cambios funcionales: escape de HTML en correos, recortar respuestas con PII, bloquear re-submission de parte 2, XFF correcto, CORS por entorno, subir `engines.node` a 22 en `package.json`. | Bajo | Hoy |
| Fase 1 | Cierre estructural de F-01, F-02, F-03, F-05: Function de verificación pública de certificados, `accessToken` por orden, encriptado at-rest de `passwordTemporal`/`passwordClassroom` en colección separada. Bump `firebase-functions` 6→7. | Medio (toca flujo público) | Esta semana |
| Fase 2 | Hardening de plataforma: CSP report-only, SRI, App Check, consolidación de Storage rules, regeneración de `codigoVerificacion` con `crypto.randomBytes`, alertas operacionales. | Bajo-Medio | Próximas dos semanas |
| Fase 3 | Go-Live Stripe Live. Solo después de Fase 1 cerrada. | Alto si se salta validación | A confirmar |

---

## 2) Fase 0 — Cambios aplicados hoy

### 2.1 Escape de HTML en correos a admin y a alumno (F-04)

Archivos tocados:

- `alumnos-app/functions-stripe/stripe/notifications.js` — `notifyAdminOrdenPagada`, `notifyAlumnoCuentaCreada`.
- `alumnos-app/functions-stripe/stripe/webhook.js` — `handlePagoAlumnoPagado`, `handleInvoiceFailed`.
- `alumnos-app/functions-stripe/stripe/completeInscripcionParte1.js` — alerta Google Workspace.

Patrón:

```js
function escapeHtml(s) {
  return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}
```

Usar en cualquier interpolación de campos derivados del cliente (`cliente.nombre`, `cliente.email`, `orden.programa`, `lineItems[].descripcion`, `nombre`, etc.).

### 2.2 Recortar respuesta de `getInscripcionOrden` (F-02 parcial)

Archivo: `alumnos-app/functions-stripe/stripe/getInscripcionOrden.js`.

Solo devolver los campos estrictamente necesarios para el siguiente paso del flujo:

- `ok`, `pagado`, `parte1Completa`, `parte2Completa`, `ordenId`, `inscripcionId`, `portalUrl`, `reglamentoUrl`, `programa`.
- `cliente.nombre`, `cliente.email` (necesarios para autorrelleno del formulario).
- Para `datosParte1` y `datosParte2`: dejar de devolver **datos sensibles** sin un `accessToken` (Fase 1). En Fase 0, **eliminar** `curpPasaporte`, `domicilio`, `usuarioInstitucional`, `documentos.*`, `emailInstitucional` del payload público.

El frontend Gatsby de `inscripcion/completar.js` y `inscripcion/documentos.js` solo usa `nombreCompleto`, `emailContacto`, `telefonoMovil`, `nivelEspecializacion`, `nacionalidad`, `fechaNacimiento`, `usuarioInstitucional`. En Fase 1 estos vendrán protegidos por `accessToken`; en Fase 0 los recortamos para minimizar el blast radius si alguien filtra el `ordenId`. Si el usuario regresa a `completar.js` desde `success_url` para rellenar parte 2, parte 1 ya está marcada como completa y la pantalla redirige a `/inscripcion/documentos`, que no necesita `datosParte1` reflejados — recibe los datos del propio formulario.

### 2.3 Bloquear re-submission de parte 2 (F-02 parcial)

Archivo: `alumnos-app/functions-stripe/stripe/completeInscripcionParte2.js`.

Después de validar la inscripción, agregar:

```js
if (inscripcion.parte2Completa || inscripcion.expedienteCompleto) {
  res.status(409).json({error: "El expediente ya fue entregado. Para corregir datos contacta a la administración."});
  return;
}
```

Esto cierra la ventana de sobrescritura por un atacante que conoce el `ordenId`.

### 2.4 XFF correcto en rate limit (F-06)

Archivo: `alumnos-app/functions-stripe/stripe/rateLimit.js`.

Cambiar `getRequestIp` para tomar el último valor de `x-forwarded-for` (el que GCP añade), no el primero (controlado por el cliente):

```js
function getRequestIp(req) {
  const xff = String(req.get("x-forwarded-for") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return xff[xff.length - 1] || req.ip || req.socket?.remoteAddress || "unknown";
}
```

Esto encarece el bypass del rate limit (un atacante tendría que rotar IPs reales en vez de cambiar un header).

### 2.5 CORS por entorno (F-07)

Archivo: `alumnos-app/functions-stripe/stripe/cors.js`.

Separar la allowlist en dos: orígenes "producción siempre permitidos" y orígenes "solo test". El selector se hace por la variable de entorno `STRIPE_FUNCTIONS_ENV` (que ya se inyecta vía `.env.certificacionmontessori`). Si la variable es `production`, no se incluye `localhost`.

```js
const PROD_ORIGINS = new Set([
  "https://certificacionmontessori.com",
  "https://www.certificacionmontessori.com",
  "https://certificacionmontessori.web.app",
  "https://certificacionmontessori.firebaseapp.com",
  "https://alumnos.certificacionmontessori.com",
  "https://alumnos-certificacionmontessori.web.app",
  "https://alumnos-certificacionmontessori.firebaseapp.com",
]);

const TEST_ORIGINS = new Set([
  "https://certificacionmontessori--stripe-test-sl45bkl4.web.app",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const isProd = process.env.STRIPE_FUNCTIONS_ENV === "production";
const ALLOWED_ORIGINS = new Set(
    isProd ? [...PROD_ORIGINS] : [...PROD_ORIGINS, ...TEST_ORIGINS],
);
```

**Importante:** al desplegar a producción, definir `STRIPE_FUNCTIONS_ENV=production` en los parámetros de Firebase Functions (`firebase functions:params:set STRIPE_FUNCTIONS_ENV=production`) o equivalente.

### 2.6 `engines.node` → 22

Archivos: `alumnos-app/functions/package.json` y `alumnos-app/functions-stripe/package.json`.

Subir el campo `engines.node` de `"20"` a `"22"`. Firebase Functions soporta Node 20 y 22 hoy; Node 20 quedó *deprecated* el 2026-04-30 y se retira el 2026-10-30. El bump del runtime se aplica al hacer `firebase deploy --only functions` con `engines.node` actualizado. Hasta entonces, las funciones siguen corriendo en Node 20 sin cambio.

No se cambia `firebase-functions` 6.6 todavía (eso se hace en Fase 1 con emuladores y QA).

---

## 3) Fase 1 — Plan detallado (esta semana)

### 3.1 `accessToken` por orden (F-02)

Cambios:

1. En `createPublicCheckout`, generar `accessToken = crypto.randomBytes(32).toString("base64url")`. Guardar `accessTokenHash = sha256(accessToken)` y `accessTokenExpiresAt = now + 24h` en la orden.
2. Devolver `accessToken` en query string del `success_url`: `?orden=ORDEN_ID&t=ACCESS_TOKEN&tipo=…`.
3. Exigir `accessToken` válido en `getInscripcionOrden`, `completeInscripcionParte1`, `completeInscripcionParte2`, `getInscripcionUploadUrl`.
4. Frontend Gatsby (`inscripcion/completar.js`, `inscripcion/documentos.js`): leer `?t=` y reenviarlo en cada llamada.
5. Backward-compat (transición): aceptar peticiones sin `accessToken` por 48h después del deploy (con flag) y luego desactivar. Documentar fecha exacta del corte.

### 3.2 Verificación pública de certificados como Cloud Function (F-01)

Crear `alumnos-app/functions-stripe/stripe/verificarCertificadoPublico.js` con `onRequest` público + rate limit. Responde con datos mínimos: `nombre, nivel, fechaGraduacion, estado, valido: true|false`. El frontend `VerificarCertificado.jsx` se cambia para llamar a esta Function en vez de `getDocs(alumnos)`.

Solo después de validar la nueva ruta en preview, cambiar `firestore.rules`:

```
match /alumnos/{alumnoId} {
  ...
  allow list: if canReadAdmin() || isCatedratico();
}
```

### 3.3 Encriptado de credenciales sin pérdida de acceso (F-03)

Ver `docs/PASSWORD_HARDENING_DESIGN.md`. Resumen:

- Mover `passwordTemporal` y `passwordClassroom` a una colección separada `alumnoCredenciales/{uid}`.
- Encriptar con AES-256-GCM. La clave maestra (`CREDENTIALS_ENCRYPTION_KEY`) vive en Firebase Secrets, **no** en Firestore.
- `firestore.rules` para `alumnoCredenciales`:
  - `allow get: if isOwnAlumno(uid) || canReadAdmin();`
  - `allow write: if false;` (solo Admin SDK desde Functions).
- Endpoint Cloud Function `getCredencialesAlumno`:
  - Verifica `Authorization: Bearer <idToken>`.
  - Si el caller es el propio alumno o un admin/directivo, descifra y devuelve `{usuario, password, passwordClassroom}`.
  - Devuelve `404` si no existe credencial.
- Frontend muestra las credenciales pidiéndolas a la Function, no leyendo directamente Firestore.
- Migración: script `node` Admin SDK que itera `alumnos`, mueve los campos cifrados a `alumnoCredenciales/{uid}`, luego limpia los campos plaintext en `alumnos`. Idempotente. Detallado en el doc de diseño.

### 3.4 Validar `emailContacto` (F-05)

En `completeInscripcionParte1`, exigir que `emailContacto.toLowerCase() === orden.cliente.email.toLowerCase()`. Si no coincide, devolver `403` con mensaje claro.

### 3.5 Upgrade `firebase-functions` 6→7

- Cambiar `^6.6.0` → `^7.0.0` en los dos `functions*/package.json`.
- Verificar que no se use `functions.config()` (el repo usa `defineSecret`, ok).
- `npm install` y correr emuladores (`firebase emulators:start --only functions,firestore,auth`) para confirmar carga sin errores.
- Probar build local + smoke test de cada endpoint.

---

## 4) Fase 2 — Hardening de plataforma (próximas dos semanas)

| Tarea | Detalle |
|-------|---------|
| CSP report-only | Recolectar dominios reales en preview; añadir `Content-Security-Policy-Report-Only` en `firebase.json` y `alumnos-app/firebase.json`. Después de 1 semana sin reportes nuevos, mover a enforce. |
| SRI | Self-host `https://w.behold.so/widget.js` o pinear versión + `integrity="sha384-..."`. |
| App Check | Activar Firebase App Check (reCAPTCHA Enterprise) en endpoints `createPublicCheckout`, `getInscripcionOrden`, `completeInscripcion*`. |
| Storage rules | Consolidar `match /comprobantes/{alumnoId}/{archivo}` en un solo bloque; agregar regla explícita para `expediente/{alumnoId}/...` con validación de tamaño y MIME al escribir. |
| `codigoVerificacion` server-side | Generar con `crypto.randomBytes(8).toString("hex").toUpperCase()` y guardar via Cloud Function `emitirCertificado`. Script de migración para regenerar códigos existentes. |
| Observabilidad | Alertas Cloud Logging: 5xx en Functions Stripe, firma de webhook inválida, picos de 429, errores de Google Workspace. |

---

## 5) Reglas operativas durante todo el proceso

1. **Nunca** desplegar reglas de Firestore que rompan flujo público sin tener una alternativa (Cloud Function) ya desplegada y validada.
2. Cada deploy de Functions sigue este orden:
   1. Build local + `npm test` (cuando exista) + emuladores.
   2. Deploy a canal de preview (`firebase hosting:channel:deploy preview` para frontend).
   3. Smoke test manual con `STRIPE_FUNCTIONS_ENV=production` apagado.
   4. Deploy a producción.
   5. Monitoreo 30 min post-deploy.
3. **Secretos:** nunca commitear `.env*`. Verificar `git status` antes de cada commit.
4. **Reversibilidad:** todo cambio de regla / Function debe tener un `git revert` claro.
5. **Documentación:** cada finding cerrado se anota aquí en la sección 7 ("bitácora") con fecha, commit y verificación.

---

## 6) Comandos de referencia

```bash
# Build local sitio público
npm run build

# Build local portal alumnos
npm --prefix alumnos-app run build

# Emuladores (Functions + Firestore + Auth)
firebase emulators:start --only functions,firestore,auth

# Deploy frontend a preview
npm run build && npx firebase hosting:channel:deploy preview-fase0

# Deploy reglas Firestore (solo cuando Fase 1 esté lista)
npx firebase deploy --only firestore:rules

# Deploy Functions Stripe (codebase aparte)
npx firebase deploy --only functions:stripe

# Deploy Functions default
npx firebase deploy --only functions:default

# Ver logs en vivo
npx firebase functions:log --only stripeWebhook
```

---

## 7) Bitácora

| Fecha | Cambio | Commit | Verificado por |
|-------|--------|--------|----------------|
| 2026-05-25 | Documentación inicial del plan (este archivo) y diseños asociados. | — | — |
| 2026-05-25 | Fase 0 aplicada en el repo (sin deploy). Cambios: `escape.js` nuevo; `escapeHtml` en `notifications.js`, `webhook.js`, `completeInscripcionParte1.js`; bloqueo de re-submission en `completeInscripcionParte2.js`; recorte de `getInscripcionOrden` (sin CURP/domicilio/ocupación/empresa/documentos/usuarioInstitucional); fix XFF en `rateLimit.js` y `getDigitalBookDownloadUrl.js`; CORS por entorno en `cors.js` (gate `STRIPE_FUNCTIONS_ENV`); `engines.node` 20 → 22 en `alumnos-app/functions/package.json` y `alumnos-app/functions-stripe/package.json`. Validado: `npm audit` 0 vulns en los 4 paquetes; `require()` de ambos codebases carga limpio; build Vite alumnos OK; build Gatsby genera páginas (solo warning punycode). | `396f3ef` + `709cb70` | (pendiente deploy) |
| 2026-05-25 | Fase 1 paso A — F-03 dual-write de credenciales (sin tocar frontend ni eliminar plaintext). Nuevo `stripe/credenciales.js` (AES-256-GCM con `CREDENTIALS_ENCRYPTION_KEY` desde Firebase Secrets); `inscripcionAlumno.js` escribe en `alumnoCredenciales/{uid}` además del plaintext en `alumnos`; nueva Function `getCredencialesAlumno` con Bearer auth; `firestore.rules` declara `alumnoCredenciales` con `allow get` para alumno+admin+directivo, `list/write` deny; script `scripts/migrar-credenciales.js` para backfill idempotente. El frontend sigue leyendo plaintext: cero cambio funcional para alumno/admin durante la coexistencia. | (pendiente commit) | (pendiente deploy) |

(Actualizar cada vez que se cierre un hallazgo.)
