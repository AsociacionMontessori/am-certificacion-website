# Paso 2 de inscripción — qué hace el sistema y qué hace una persona

## Qué ya tienes (no repetir)

- Repositorio **classroom-mcp** / **workspace-directory-admin** con service account y delegación OK.
- **Unidades organizativas** ya creadas en Admin Console.
- Cursos de Classroom identificables (IDs).

El sitio **no reemplaza** esas herramientas para trabajo manual; las usa por API en el momento del paso 2.

## Qué hace el sistema al enviar el paso 2

1. Crea cuenta en **portal de alumnos** (Firebase) con `usuario@certificacionmontessori.com`.
2. Genera una **contraseña única** (16 caracteres) — **la misma** para portal y Google.
3. Crea/actualiza el usuario en **Google Admin** y lo mueve a la **OU** de su nivel.
4. Lo inscribe en los **cursos Classroom** del mapa de configuración.
5. Envía correo al alumno con usuario y contraseña (cola `emails_pendientes`).
6. Guarda en Firestore `alumnos.passwordTemporal` y `googleWorkspace` por si hay que revisar.

El alumno **no** elige contraseña ni cambia el programa en el formulario (viene del pago).

---

## Lo que debe hacer una persona (checklist corto)

### 1. Una vez: secretos en Firebase

```bash
cd alumnos-app
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
```

Pega el mismo JSON de service account que usas en **classroom-mcp** (perfil `asociacion`).

No hace falta secret de contraseña fija: **cada alumno recibe una generada automáticamente**.

### 2. Una vez: parámetros

En Firebase (codebase `stripe`) o `.env.certificacionmontessori`:

| Parámetro | Qué poner |
|-----------|-----------|
| `GOOGLE_WORKSPACE_PROVISION_ENABLED` | `true` cuando quieras activar Google en paso 2 |
| `GOOGLE_ADMIN_EMAIL` | Ej. `admin@asociacionmontessori.com.mx` |
| `GOOGLE_STUDENTS_OU_BASE` | Ruta base que ya usan (ej. `/Students/Certificacion`) |
| `GOOGLE_CLASSROOM_COURSE_MAP` | JSON con IDs de curso por nivel (ver abajo) |

Ejemplo de mapa (ajusta IDs reales):

```json
{
  "Nido & Comunidad infantil": ["123456789"],
  "Casa de Niños": ["987654321"],
  "Taller": ["111222333"],
  "Diplomado en Neuroeducación": ["444555666"]
}
```

Sacar IDs con classroom-mcp (`classroom_list_courses`) o la URL del curso.

### 3. Desplegar

```bash
npm run sync:stripe-functions
npm run deploy:stripe
```

### 4. Probar

1. Inscripción de prueba con Stripe test (`4242…`).
2. Paso 2 con usuario institucional **nuevo** (ej. `maria.prueba01`).
3. Revisar:
   - Correo al alumno con contraseña.
   - Admin Console → usuario en OU correcta.
   - Classroom → alumno en cursos.
   - Login en https://alumnos.certificacionmontessori.com con esa contraseña.

### 5. Si algo falla

- Firestore → `alumnos/{uid}.googleWorkspace` (estado y errores).
- Completar manualmente con **workspace-directory-admin** / **classroom-mcp** (como ya hacen).
- El portal del alumno puede existir aunque Google haya fallado parcialmente.

---

## Cuándo usar las herramientas MCP a mano

- Primeras pruebas con `GOOGLE_WORKSPACE_PROVISION_ENABLED=false` (solo portal).
- Corrección de un alumno que quedó en `partial` / `error`.
- Alta masiva o casos especiales fuera del flujo web.

Detalle técnico: `docs/GOOGLE_WORKSPACE_INSCRIPCION.md`.
