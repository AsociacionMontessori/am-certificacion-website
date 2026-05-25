# Google Workspace + Classroom — Paso 2 (inscripción pública)

Tras el pago Stripe, `completeInscripcionParte1` puede automatizar:

1. **Admin SDK** — crear o actualizar usuario `@certificacionmontessori.com`
2. **OU** — ubicarlo en la unidad organizativa del nivel
3. **Classroom** — inscribirlo en los cursos del programa

La cuenta **Firebase** del portal de alumnos se sigue creando siempre; Google es un paso adicional (no bloquea el flujo si falla).

## Requisitos en Google Cloud

1. **Service account** con **Domain-Wide Delegation** (misma familia que `classroom-mcp` / `workspace-directory-admin`).
2. En **Admin Console → Seguridad → Controles de API → Delegación en todo el dominio**, autorizar el `client_id` de la SA con estos alcances:

| Alcance |
|--------|
| `https://www.googleapis.com/auth/admin.directory.user` |
| `https://www.googleapis.com/auth/classroom.rosters` |

3. Usuario delegado (impersonación): p. ej. `admin@asociacionmontessori.com.mx`

## Secretos y parámetros Firebase

```bash
cd alumnos-app

# JSON completo de la service account (una línea)
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON

# Contraseña unificada portal + Classroom (mín. 8 caracteres)
firebase functions:secrets:set INSCRIPCION_PASSWORD_UNIFICADA

# Activar provisión (test: false hasta validar OU y cursos)
firebase functions:config:set google.workspace_provision_enabled=false
# En Functions v2 params (recomendado tras deploy):
# GOOGLE_WORKSPACE_PROVISION_ENABLED=true
```

Parámetros (`defineString`, proyecto `certificacionmontessori`):

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `GOOGLE_WORKSPACE_PROVISION_ENABLED` | `true` para ejecutar alta Google | `true` |
| `GOOGLE_ADMIN_EMAIL` | Admin delegado | `admin@asociacionmontessori.com.mx` |
| `GOOGLE_STUDENTS_OU_BASE` | OU base bajo dominio certificación | `/Students/Certificacion` |
| `GOOGLE_CLASSROOM_COURSE_MAP` | JSON nivel portal → IDs de curso | ver abajo |

### Mapa de cursos Classroom

`GOOGLE_CLASSROOM_COURSE_MAP` es un JSON. Las claves deben coincidir con **nivel del portal** (`getNivelPortal`):

```json
{
  "Nido & Comunidad infantil": ["765463029199"],
  "Casa de Niños": ["123456789012"],
  "Taller": ["234567890123"],
  "Diplomado en Neuroeducación": ["345678901234"],
  "Propedéutico": []
}
```

Obtén los `courseId` desde Classroom (URL del curso) o con `classroom-mcp` → `classroom_list_courses`.

### Unidades organizativas

Ruta final: `{GOOGLE_STUDENTS_OU_BASE}/{slug}`

| Nivel portal | Slug OU |
|--------------|---------|
| Propedéutico | Propedeutico |
| Nido & Comunidad infantil | Nido |
| Casa de Niños | Casa |
| Taller | Taller |
| Diplomado en Neuroeducación | Neuroeducacion |

Crea las OU en Admin Console antes de activar en producción.

## Despliegue

```bash
cd alumnos-app
npm install --prefix functions-stripe
npm run sync:stripe-functions
npm run deploy:stripe
```

## Prueba del paso 2

1. Pago test Stripe → `completeInscripcionParte1` con orden pagada.
2. Revisar Firestore `alumnos/{uid}.googleWorkspace`:
   - `status`: `ok` | `partial` | `skipped` | `error`
   - `directoryAction`: `created` | `updated`
   - `courses`: inscripciones por `courseId`
3. Admin Console → Usuario en OU correcta.
4. Classroom → alumno en cursos del nivel.

Si `status` es `partial` o `error`, se encola correo a `admin@certificacionmontessori.com` en `emails_pendientes`.

## Herramientas locales existentes

- `/home/carlos/agent-projects/workspace-directory-admin` — altas y OU manuales
- `/home/carlos/agent-projects/classroom-mcp` — listar cursos e inscribir alumnos

Mantén **un solo** service account para Functions y MCP, o documenta cuál usa cada entorno.
