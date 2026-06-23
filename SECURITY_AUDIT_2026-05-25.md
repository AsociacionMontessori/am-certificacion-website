# Auditoría de Seguridad Integral

**Repositorio:** `certificacionMontessori`
**Fecha:** 2026-05-25
**Estado:** auditoría actualizada después de remediación inicial de dependencias
**Alcance:** sitio público Gatsby, portal `alumnos-app`, Firebase Hosting, Cloud Functions default y Cloud Functions Stripe.

---

## 1) Resumen Ejecutivo

El reporte previo pegado en la conversación describía un servidor Express mínimo (`app.js`, puerto 3000, `express@4.18.2`). Ese inventario no corresponde al estado actual de este repositorio. La superficie real es:

- Sitio público Gatsby desplegado en Firebase Hosting.
- Portal de alumnos Vite/React desplegado en Firebase Hosting.
- Cloud Functions default para notificaciones por correo.
- Cloud Functions `stripe` para pagos, webhooks e inscripción pública.

Después de la primera fase de remediación, el estado cambió de **riesgo medio-alto** a **riesgo medio controlado**. La deuda crítica de dependencias quedó cerrada: `npm audit` reporta **0 vulnerabilidades** en los cuatro lockfiles principales.

Aún no considero el sistema listo para abrir pagos reales en producción hasta completar las capas pendientes: verificación de secretos live, webhook live, monitoreo/alertas, revisión de CORS por entorno y pruebas de pago real controlado. El rate limiting server-side de endpoints públicos de Stripe ya quedó aplicado en esta fase.

---

## 2) Evidencia de Verificación

Comandos ejecutados el 2026-05-25:

```bash
npm audit
npm --prefix alumnos-app audit
npm --prefix alumnos-app/functions audit
npm --prefix alumnos-app/functions-stripe audit
npm run build
npm --prefix alumnos-app run build
node -e "require('/home/carlos/Documentos/Repositorios/certificacionMontessori/alumnos-app/functions/index.js')"
node -e "require('/home/carlos/Documentos/Repositorios/certificacionMontessori/alumnos-app/functions-stripe/index.js')"
```

Resultado:

- Sitio público: `found 0 vulnerabilities`.
- Portal alumnos: `found 0 vulnerabilities`.
- Functions default: `found 0 vulnerabilities`.
- Functions Stripe: `found 0 vulnerabilities`.
- Build Gatsby: exitoso.
- Build Vite alumnos: exitoso.
- Carga de módulos Functions default y Stripe: exitosa.
- Headers básicos verificados en previews de Firebase Hosting para sitio público y portal alumnos.

Advertencias no bloqueantes observadas:

- Gatsby mantiene advertencias conocidas de `punycode`, icono manifest no cuadrado y orden CSS.
- Vite advierte que `baseline-browser-mapping` / Browserslist están desactualizados.
- `npm --prefix alumnos-app/functions run lint` falla por errores existentes de estilo/JSDoc en la copia legacy `alumnos-app/functions/stripe`; el codebase Stripe real se despliega desde `alumnos-app/functions-stripe`.

---

## 3) Cambios Aplicados en esta Fase

### 3.1 Dependencias

Sitio público:

- Se eliminaron dependencias no usadas o reemplazadas: `csvtojson`, `google-map-react`, `iframe-resizer-react`, `lint`, `react-search-box`.
- Se reemplazó `react-search-box` por un buscador nativo en React para evitar una cadena vulnerable pesada.
- Se actualizó `firebase-tools` a `^15.18.0`.
- Se agregaron overrides transitivos para cerrar CVEs en dependencias de build de Gatsby, incluyendo `uuid`, `webpack`, `cookie`, `lodash`, `serialize-javascript`, `file-type`, `tmp` y el grupo `@parcel/*` alineado en `2.16.4`.

Portal alumnos:

- Se aplicó `npm audit fix`.
- Se actualizó `firebase-tools` a `^15.18.0`.
- Se agregó override de `uuid@11.1.1` para corregir transitivos de herramientas Firebase.

Cloud Functions default:

- Se actualizó `nodemailer` a `^8.0.8`.
- Se aplicó override de `uuid@11.1.1` para transitivos de Firebase Admin.

Cloud Functions Stripe:

- Se actualizó `googleapis` a `^172.0.0`.
- Se aplicó override de `uuid@11.1.1` para transitivos de Firebase Admin / Google APIs.

### 3.2 Headers de Firebase Hosting

Se agregaron headers básicos al sitio público y al portal de alumnos:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

No se agregó todavía CSP estricta ni HSTS desde el repo. CSP requiere pruebas por los scripts externos actuales (Facebook, Behold, Google/analytics y flujos de pago). En preview se observó `Strict-Transport-Security` emitido por Firebase Hosting; si se configura HSTS manualmente en el futuro debe hacerse solo después de validar dominios, subdominios y estrategia de rollback.

---

## 4) Hallazgos Actualizados

### S-01 — Dependencias vulnerables

**Severidad original:** Alta
**Estado:** Cerrado en esta fase
**Evidencia:** `npm audit` limpio en raíz, `alumnos-app`, `alumnos-app/functions` y `alumnos-app/functions-stripe`.

**Notas:** Se usaron overrides cuando el paquete padre aún no publicaba un rango limpio compatible. Esto debe revisarse en futuras actualizaciones mayores de Gatsby/Firebase para retirar overrides que ya no hagan falta.

### S-02 — Headers HTTP básicos ausentes

**Severidad original:** Media-Alta
**Estado:** Parcialmente cerrado
**Evidencia:** `firebase.json` y `alumnos-app/firebase.json` ahora incluyen headers básicos de seguridad.

**Pendiente:** CSP, `frame-ancestors` vía CSP y posible HSTS en edge cuando se valide producción completa.

### S-03 — Endpoints públicos de Stripe sin rate limiting visible

**Severidad:** Alta
**Estado:** Cerrado en esta fase

**Evidencia:** Se agregó `alumnos-app/functions-stripe/stripe/rateLimit.js` y se aplicó a `createPublicCheckout`, `getInscripcionOrden`, `completeInscripcionParte1`, `completeInscripcionParte2` y `getInscripcionUploadUrl`. El control usa Firestore con IP hasheada, ventana fija y respuesta `429` con `Retry-After`.

**Impacto mitigado:** reduce abuso de endpoints, costos, ruido operativo, creación de órdenes basura e intentos automatizados contra el flujo de inscripción.

**Pendiente opcional:** evaluar Firebase App Check o Cloud Armor si el volumen público crece o se detecta abuso que requiera una capa edge adicional.

### S-04 — CORS con orígenes de desarrollo en código de producción

**Severidad:** Media
**Estado:** Abierto

**Evidencia:** `alumnos-app/functions-stripe/stripe/cors.js` permite producción, preview y localhost.

**Impacto:** CORS no reemplaza autenticación, pero permitir localhost en producción reduce la utilidad del control contra abuso desde navegadores.

**Recomendación:** mover allowlist a configuración por entorno o usar una lista estricta para deploy productivo: dominios canónicos, `www`, alumnos y preview solo cuando se necesite.

### S-05 — Gestión de secretos por validar antes de live

**Severidad:** Alta para producción
**Estado:** Abierto

**Evidencia positiva:** las Functions usan `defineSecret` para `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_USER`, `EMAIL_PASS` y secretos de Google Workspace. No se detectó necesidad de secretos en el bundle frontend.

**Pendiente antes de producción:**

- Confirmar secretos live en Firebase, no test.
- Confirmar webhook secret live y endpoint correcto.
- Confirmar service account de Google Workspace con mínimos scopes necesarios.
- Confirmar rotación/documentación de recuperación.

### S-06 — Lint de Functions default falla por copia legacy de Stripe

**Severidad:** Media operacional
**Estado:** Abierto

**Evidencia:** `npm --prefix alumnos-app/functions run lint` falla con 66 errores de estilo/JSDoc en `alumnos-app/functions/stripe/*`.

**Impacto:** si esto se vuelve gate de CI, bloqueará despliegues aunque el codebase Stripe real viva en `alumnos-app/functions-stripe`.

**Recomendación:** decidir una de estas rutas:

1. Eliminar la copia legacy `alumnos-app/functions/stripe` si ya no se usa.
2. Excluirla explícitamente del lint/deploy default.
3. Unificar definitivamente ambos codebases y corregir lint.

### S-07 — Observabilidad y respuesta a incidentes incompleta

**Severidad:** Media-Alta
**Estado:** Abierto

**Evidencia:** hay logs con `console`, pero no se ve una política formal de alertas, métricas, dashboards, presupuesto o runbook de incidentes.

**Recomendación:** antes de producción:

- alertas por errores 5xx en Functions Stripe,
- alertas por volumen anómalo de checkout/webhook,
- presupuesto/costos Firebase/Google Cloud,
- dashboard mínimo de pagos fallidos, webhooks duplicados y órdenes inconclusas,
- runbook de rollback y rotación de secretos.

### S-08 — CSP y scripts externos

**Severidad:** Media
**Estado:** Abierto

**Evidencia:** el sitio usa scripts/widgets externos como Facebook y Behold. Gatsby también inyecta scripts inline/build-time.

**Recomendación:** diseñar CSP en modo gradual:

1. inventario de scripts/dominios reales en preview,
2. CSP report-only si la infraestructura lo permite,
3. CSP enforce sin `unsafe-eval`; minimizar `unsafe-inline` con hash/nonce si es viable,
4. documentar excepciones necesarias para widgets de terceros.

### S-09 — Stripe live pendiente

**Severidad:** Alta para lanzamiento
**Estado:** Abierto

**Pendiente mínimo:**

- catálogo live de productos/precios,
- `STRIPE_SECRET_KEY` live,
- `STRIPE_WEBHOOK_SECRET` live,
- webhook live apuntando a la función correcta,
- prueba de pago real controlado,
- prueba de cancelación/fallo,
- prueba de idempotencia webhook,
- confirmación de creación de cuenta y Classroom solo después de pago confirmado.

---

## 5) Checklist de Producción por Capas

### Capa 1 — Dependencias

- [x] Auditar sitio público.
- [x] Auditar portal alumnos.
- [x] Auditar Functions default.
- [x] Auditar Functions Stripe.
- [x] Cerrar vulnerabilidades críticas/altas/moderadas reportadas por npm audit.

### Capa 2 — Hosting

- [x] Headers básicos de seguridad.
- [ ] CSP diseñada y probada.
- [ ] Decisión HSTS documentada y probada.
- [ ] Verificación de headers en preview y producción.

### Capa 3 — Functions / API

- [x] CORS allowlist existente.
- [ ] CORS por entorno sin localhost en producción.
- [x] Rate limiting server-side en endpoints públicos de Stripe.
- [ ] Límites operativos por función (`maxInstances`, timeouts, memoria) revisados.
- [ ] Lint/CI limpio o exclusiones documentadas.

### Capa 4 — Stripe

- [ ] Catálogo live.
- [ ] Secretos live.
- [ ] Webhook live.
- [ ] Prueba real pequeña.
- [ ] Validación de idempotencia y estados.

### Capa 5 — Google Workspace / Classroom

- [ ] Service account live en Firebase secret.
- [ ] Admin subject correcto.
- [ ] Scopes mínimos confirmados.
- [ ] UO y mapas de Classroom confirmados.
- [ ] Prueba end-to-end con alumno controlado.

### Capa 6 — Observabilidad

- [ ] Alertas Functions Stripe.
- [ ] Alertas webhook fallido/reintentos.
- [ ] Presupuesto/costos Firebase.
- [ ] Runbook de incidente y rollback.

---

## 6) Conclusión

La primera fase redujo el riesgo de dependencias a cero hallazgos de `npm audit` en todos los paquetes relevantes y agregó hardening básico de Hosting. El sistema está más cerca de producción, pero todavía no debe abrir Stripe live sin resolver o aceptar explícitamente los hallazgos S-05, S-07 y S-09.

Siguiente paso recomendado: **validar secretos, webhook live y prueba controlada end-to-end**.
