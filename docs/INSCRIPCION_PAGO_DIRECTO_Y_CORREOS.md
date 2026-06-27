# Inscripción: código de pago directo, expediente y correos

Resumen de los cambios hechos para el flujo de inscripción autoservicio
(sitio público Gatsby + app de alumnos + Cloud Functions del codebase `stripe`
y `default`). Proyecto Firebase/GCP: **certificacionmontessori** (nº 77935287015),
cuenta dueña `admin@asociacionmontessori.com.mx`.

## 1. Código compartido de inscripción directa
Para alumnos que pagaron **fuera de línea** (transferencia/efectivo/terminal),
validados por el equipo.

- El alumno teclea un **código compartido** en "Referencia de pago" del paso 2
  (`/inscripcion/completar`).
- Función `canjearCodigoDirecto` (`functions-stripe/stripe/canjearCodigoDirecto.js`):
  valida el código contra `config/inscripcionDirecta` (`{codigo, activo}` en
  Firestore — **rotable sin redeploy**) y genera **una orden pagada individual**
  (id corto, `tipo:inscripcion`, `estado:pagado`, `origen:pago_directo`) + un
  accessToken de 7 días. Un mismo código sirve para todos sin colisionar.
- `completar.js` hace el canje como fallback cuando lo tecleado no es una orden.
- Auditoría: cada uso queda en `ordenes` con `origen:"pago_directo"`.

## 2. Bug crítico corregido (bloqueaba TODA inscripción)
`crearAlumnoDesdeInscripcion` (`inscripcionAlumno.js`) metía
`FieldValue.serverTimestamp()` dentro del array `niveles` → Firestore lo prohíbe
→ el paso 1 siempre fallaba con 500 y nunca se completaba ninguna inscripción
(Stripe o directa). Fix: `creadoEn: Timestamp.now()`.

## 3. Expediente (paso 3) — Storage
- Las subidas usan **URLs firmadas** (`getInscripcionUploadUrl`) a
  `expediente/{alumnoId}/{docType}/...` en el bucket
  `certificacionmontessori.firebasestorage.app`.
- **Requisitos de infraestructura (una sola vez):**
  - **IAM:** la cuenta de servicio del runtime
    `77935287015-compute@developer.gserviceaccount.com` necesita el rol
    `roles/iam.serviceAccountTokenCreator` (para firmar URLs v4). Sin esto:
    `SigningError: iam.serviceAccounts.signBlob denied`.
  - **CORS del bucket:** orígenes del sitio con métodos `GET/PUT/HEAD`. Sin esto:
    "NetworkError when attempting to fetch resource" al subir.
- **Cédula fiscal condicional:** el documento `cedulaFiscal` solo se muestra/exige
  si la orden trae `requiereFacturaFiscal` (expuesto por `getInscripcionOrden`,
  filtrado en `InscripcionParte2Form`).

## 4. Panel admin — documentos del expediente
- Función `getExpedienteDocsUrls` (admin/directivo o el propio alumno): lista
  `expediente/{alumnoId}/` y devuelve URLs de descarga firmadas (15 min).
- UI: sección "Documentos del expediente" en `AlumnoDetail.jsx`
  (`components/ExpedienteDocumentos.jsx`, `services/expedienteService.js`).

## 5. Contraseñas
`inscripcionPassword.js` genera contraseñas **solo alfanuméricas** (sin `=`, `*`
ni otros signos que rompen al pegar en Excel/WhatsApp).

## 6. Fecha estimada de egreso
Se calcula al crear el alumno: ingreso + meses del nivel
(`DURACION_MESES_POR_NIVEL` en `inscripcionCatalog.js`).

## 7. Classroom — reintento diferido
`retryClassroomEnrollment` (programada cada 15 min): reintenta inscribir en el
curso a los alumnos con `googleWorkspace.status` en `partial/error` (el alta
directa falla en cuentas recién creadas: `@CannotDirectAddUser`).

## 8. Correos (bienvenida)
- Cola `emails_pendientes` → función `enviarEmailNotificacion`
  (`functions/index.js`, codebase `default`).
- Envía por **Gmail API + cuenta de servicio con delegación de dominio**
  (scope `gmail.send`), impersonando `admin@asociacionmontessori.com.mx`.
  Remitente "Certificación Montessori", respeta `to`/`cc`/`bcc`. **No usa SMTP /
  App Password.** Mismo método que `agent-projects/workspace-directory-admin`.
- El correo de bienvenida lleva CC a `sociedadmontessori@gmail.com`.
