# Auditoría de Seguridad Integral

**Repositorio:** `certificacionMontessori`
**Fecha:** 2026-05-25
**Branch:** `security/main-dependency-audit` desde `main`
**Alcance:** backport seguro para `main`: sitio público Gatsby, portal `alumnos-app`, Firebase Hosting y Cloud Functions default. El codebase `functions-stripe` no existe en `main` y no se incluyó en esta rama.

---

## 1) Resumen Ejecutivo

Esta rama aplica únicamente remediación segura sobre la rama `main`, sin mezclar el trabajo activo de Stripe que vive en `develop`.

Objetivo:

- cerrar avisos de Dependabot en la rama default,
- no introducir cambios funcionales de Stripe,
- mantener producción protegida mediante preview, build y auditoría antes de cualquier merge.

Después de la remediación, `npm audit` reporta **0 vulnerabilidades** en los tres lockfiles presentes en `main`:

- sitio público Gatsby,
- `alumnos-app`,
- `alumnos-app/functions`.

---

## 2) Cambios Aplicados

### 2.1 Dependencias

Sitio público:

- Se eliminaron dependencias no usadas o reemplazadas: `csvtojson`, `google-map-react`, `iframe-resizer-react`, `lint`, `react-search-box`.
- Se reemplazó `react-search-box` por un buscador nativo en React.
- Se actualizó `firebase-tools` a `^15.18.0`.
- Se agregaron overrides transitivos para cerrar CVEs en dependencias de build de Gatsby, incluyendo `uuid`, `webpack`, `cookie`, `lodash`, `serialize-javascript`, `file-type`, `tmp` y el grupo `@parcel/*` alineado en `2.16.4`.

Portal alumnos:

- Se aplicó `npm audit fix`.
- Se actualizó `firebase-tools` a `^15.18.0`.
- Se agregó override de `uuid@11.1.1`.

Cloud Functions default:

- Se actualizó `nodemailer` a `^8.0.8`.
- Se agregó override de `uuid@11.1.1`.

### 2.2 Headers de Firebase Hosting

Se agregaron headers básicos al sitio público y al portal de alumnos:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

No se agregó CSP estricta ni HSTS desde el repo. CSP requiere pruebas por scripts externos y HSTS debe decidirse con estrategia de rollback.

---

## 3) Verificación Requerida antes de Merge

```bash
npm audit
npm --prefix alumnos-app audit
npm --prefix alumnos-app/functions audit
npm run build
npm --prefix alumnos-app run build
node -e "require('/home/carlos/Documentos/Repositorios/certificacionMontessori/alumnos-app/functions/index.js')"
```

También verificar headers en previews de Firebase Hosting.

### 3.1 Verificación Ejecutada

- `npm audit` en root: 0 vulnerabilidades.
- `npm audit` en `alumnos-app`: 0 vulnerabilidades.
- `npm audit` en `alumnos-app/functions`: 0 vulnerabilidades.
- `npm --prefix alumnos-app run lint`: OK.
- `npm --prefix alumnos-app/functions run lint`: OK.
- `npm run build` en root: OK, con advertencias preexistentes de Gatsby.
- `npm run build` en `alumnos-app`: OK, con advertencias preexistentes de Browserslist.
- `node -e` cargando `alumnos-app/functions/index.js`: OK, con advertencia `punycode` preexistente.
- Preview sitio público: https://certificacionmontessori--main-security-audit-qk6ii9uh.web.app
- Preview portal alumnos: https://alumnos-certificacionmontessori--main-security-audit-bnsptp1k.web.app
- Headers verificados con `curl -sI`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.


---

## 4) Riesgo de Producción

Riesgo estimado: **bajo, no cero**.

Motivos de bajo riesgo:

- no se agrega `functions-stripe`,
- no se cambian rutas de inscripción o checkout,
- no se cambia lógica de pago,
- no se modifica el deploy script de reglas en `alumnos-app`,
- la remediación se puede validar en previews antes de merge.

Riesgo residual:

- cambios de lockfile y overrides de build pueden afectar compilación,
- el reemplazo del buscador cambia un componente UI menor en `/buscador`,
- headers podrían afectar embeds si alguna página dependiera de iframe cross-site; por eso se valida en preview.

---

## 5) Pendiente Fuera de esta Rama

Stripe producción sigue pendiente en `develop`:

- rate limiting/App Check para endpoints públicos,
- secretos live,
- webhook live,
- prueba real controlada,
- observabilidad y alertas.

Esta rama no resuelve ni intenta resolver esos puntos.
