# Google Workspace + Classroom - inscripción Stripe

Tras un pago Stripe, `completeInscripcionParte1` automatiza el alta institucional del alumno:

1. **Firebase Auth / Firestore** - crea la cuenta del portal con `usuario@certificacionmontessori.com`.
2. **Admin SDK Directory** - crea o actualiza el usuario Google Workspace y lo manda a la UO del programa.
3. **Classroom** - inscribe al alumno en Portal Montessori y en los cursos configurados para su nivel.
4. **Correo** - encola la bienvenida con usuario y contraseña temporal.

El alumno elige solo el nombre de usuario local en `src/components/inscripcion/InscripcionParte1Form.js`; el backend valida y arma el correo con `@certificacionmontessori.com`.

## Estado actual de implementación

Archivos principales:

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/components/inscripcion/InscripcionParte1Form.js` | Envía `usuarioInstitucional` desde el sitio público. |
| `src/utils/inscripcionApi.js` | Llama a `completeInscripcionParte1`. |
| `alumnos-app/functions/stripe/completeInscripcionParte1.js` | Crea portal/Firebase y dispara Google Workspace. |
| `alumnos-app/functions/stripe/googleWorkspaceProvision.js` | Orquesta Directory + Classroom. |
| `alumnos-app/functions/stripe/googleWorkspaceClient.js` | Cliente Admin SDK y Classroom API con service account. |
| `alumnos-app/functions/stripe/googleWorkspaceCatalog.js` | Mapa UO + cursos Classroom por nivel. |

`alumnos-app/functions-stripe/stripe/` es el codebase desplegable. Se sincroniza desde `alumnos-app/functions/stripe/` con:

```bash
cd alumnos-app
npm run sync:stripe-functions
```

## Estado aplicado

- `GOOGLE_SERVICE_ACCOUNT_JSON` ya existe en Firebase Secret Manager como versión 1. El contenido del JSON no se guarda en el repo.
- `alumnos-app/functions-stripe/.env.certificacionmontessori` quedó con `GOOGLE_WORKSPACE_PROVISION_ENABLED=true`, `GOOGLE_ADMIN_EMAIL=admin@asociacionmontessori.com.mx`, `GOOGLE_STUDENTS_OU_BASE=/Diplomados` y `GOOGLE_CLASSROOM_COURSE_MAP={}`. Ese archivo está gitignored.
- El codebase `functions:stripe` ya fue desplegado y Firebase confirmó que cargó `.env.certificacionmontessori`.
- Durante el deploy, Firebase avisó que Node.js 20 está deprecado y se decomisiona el 2026-10-30; conviene planear el salto de runtime antes de esa fecha.

## Requisitos Google Cloud / Admin Console

La service account usada por Firebase Functions debe tener Domain-Wide Delegation y estar autorizada en Admin Console con estos scopes:

| Scope | Uso |
|-------|-----|
| `https://www.googleapis.com/auth/admin.directory.user` | Crear, actualizar y mover usuarios de UO. |
| `https://www.googleapis.com/auth/classroom.rosters` | Inscribir alumnos en Classroom. |

El usuario delegado debe ser:

```text
admin@asociacionmontessori.com.mx
```

No subas el JSON de la service account al repo. Va solo como secret de Firebase.

## Secret y parámetros Firebase

Desde `alumnos-app`:

```bash
# Pega el JSON completo de la service account cuando Firebase CLI lo pida.
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
```

La CLI local de este repo no expone `functions:params:set`; los `defineString` se cargan desde `functions-stripe/.env.certificacionmontessori` (gitignored) al desplegar el codebase `stripe`.

Agregar ahí:

```dotenv
GOOGLE_WORKSPACE_PROVISION_ENABLED=true
GOOGLE_ADMIN_EMAIL=admin@asociacionmontessori.com.mx
GOOGLE_STUDENTS_OU_BASE=/Diplomados
```

`GOOGLE_WORKSPACE_PROVISION_ENABLED=false` deja el flujo en modo seguro: crea portal/Firebase, pero no toca Google Workspace ni Classroom.

## UO por nivel

`GOOGLE_STUDENTS_OU_BASE` queda por defecto en `/Diplomados`. El código agrega la ruta relativa según `nivelPortal`:

| Nivel portal | UO final |
|--------------|----------|
| `Propedéutico` | `/Diplomados` |
| `Nido & Comunidad infantil` | `/Diplomados/Nido & Comunidad` |
| `Casa de Niños` | `/Diplomados/Casa de Niños` |
| `Taller` | `/Diplomados/Taller` |
| `Neuroeducación` | `/Diplomados/Neuroeducación` |
| `Diplomado en Neuroeducación` | `/Diplomados/Neuroeducación` |

Estas rutas ya fueron contrastadas contra usuarios reales del tenant.

## Classroom

Portal Montessori queda como curso base automático para todos los niveles:

| Curso | ID |
|-------|----|
| Portal Montessori | `765463029199` |

Con esto, si `GOOGLE_WORKSPACE_PROVISION_ENABLED=true` y no configuras `GOOGLE_CLASSROOM_COURSE_MAP`, el alumno entra al menos a Portal Montessori.

`GOOGLE_CLASSROOM_COURSE_MAP` sirve para agregar cursos específicos del programa. No repitas Portal Montessori ahí; el código lo agrega y deduplica siempre.

Ejemplo:

```dotenv
GOOGLE_CLASSROOM_COURSE_MAP={"Nido & Comunidad infantil":["COURSE_ID_NIDO_1","COURSE_ID_NIDO_2"],"Casa de Niños":["COURSE_ID_CASA_1"],"Taller":["COURSE_ID_TALLER_1"],"Diplomado en Neuroeducación":["COURSE_ID_NEURO_1"],"Propedéutico":[]}
```

Las claves deben coincidir con `getNivelPortal()` en `alumnos-app/functions/stripe/inscripcionCatalog.js`.

## Deploy

```bash
cd alumnos-app
npm run sync:stripe-functions
npm run deploy:stripe
```

El deploy de hosting del sitio público es independiente. Solo hace falta si cambias frontend o URLs Gatsby.

## Prueba mínima

1. Crear orden pagada en Stripe test.
2. Abrir `/inscripcion/completar?orden=...`.
3. Enviar un usuario institucional nuevo.
4. Revisar Firestore `alumnos/{uid}.googleWorkspace`:
   - `status`: `ok`, `partial`, `skipped` o `error`.
   - `orgUnitPath`: UO esperada.
   - `courses`: debe incluir `765463029199`.
5. Revisar Admin Console: usuario activo en la UO correcta.
6. Revisar Classroom: alumno inscrito en Portal Montessori.

Si `status` queda en `partial` o `error`, la función encola alerta en `emails_pendientes` para `admin@certificacionmontessori.com`.

## Notas operativas

- No guardes service accounts, `.env`, passwords ni dumps de usuarios en git.
- Para cambiar el curso base Portal Montessori, edita `PORTAL_MONTESSORI_COURSE_ID` en `googleWorkspaceCatalog.js` y vuelve a correr `npm run sync:stripe-functions`.
- Para cursos por generación o programa, usa `GOOGLE_CLASSROOM_COURSE_MAP` en Firebase params.
- Antes de producción, prueba con un usuario nuevo que no exista ni en Firebase Auth ni en Google Workspace.
