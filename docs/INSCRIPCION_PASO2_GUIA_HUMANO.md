# Paso 2 de inscripción - guía operativa

## Qué hace el sistema

Cuando el alumno termina el pago Stripe y completa el paso 2:

1. Crea su cuenta del portal con `usuario@certificacionmontessori.com`.
2. Genera una contraseña única para portal y Google Workspace.
3. Crea o actualiza el usuario en Google Workspace.
4. Lo mueve a la UO de su programa bajo `/Diplomados`.
5. Lo inscribe automáticamente en **Portal Montessori**.
6. Lo inscribe en cursos extra si están en `GOOGLE_CLASSROOM_COURSE_MAP`.
7. Encola el correo de bienvenida con usuario y contraseña.

## Checklist para activar Google Workspace

### 1. Secret de service account

```bash
cd alumnos-app
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
```

Pega el JSON completo de la service account con Domain-Wide Delegation. No lo guardes en el repo.

### 2. Parámetros obligatorios

En `alumnos-app/functions-stripe/.env.certificacionmontessori`:

```dotenv
GOOGLE_WORKSPACE_PROVISION_ENABLED=true
GOOGLE_ADMIN_EMAIL=admin@asociacionmontessori.com.mx
GOOGLE_STUDENTS_OU_BASE=/Diplomados
```

Para pruebas sin tocar Google, usa:

```dotenv
GOOGLE_WORKSPACE_PROVISION_ENABLED=false
```

### 3. Portal Montessori

No necesitas configurar nada adicional para Portal Montessori. El código lo agrega siempre:

```text
Portal Montessori: 765463029199
```

### 4. Cursos extra por programa

Solo configura este parámetro cuando quieras agregar clases además de Portal Montessori:

```dotenv
GOOGLE_CLASSROOM_COURSE_MAP={"Nido & Comunidad infantil":["COURSE_ID_NIDO"],"Casa de Niños":["COURSE_ID_CASA"],"Taller":["COURSE_ID_TALLER"],"Diplomado en Neuroeducación":["COURSE_ID_NEURO"],"Propedéutico":[]}
```

### 5. Desplegar funciones Stripe

```bash
cd alumnos-app
npm run sync:stripe-functions
npm run deploy:stripe
```

## UO esperada

| Programa portal | UO |
|-----------------|----|
| Propedéutico | `/Diplomados` |
| Nido & Comunidad infantil | `/Diplomados/Nido & Comunidad` |
| Casa de Niños | `/Diplomados/Casa de Niños` |
| Taller | `/Diplomados/Taller` |
| Diplomado en Neuroeducación | `/Diplomados/Neuroeducación` |

## Verificación rápida

1. Hacer una inscripción Stripe de prueba.
2. Completar paso 2 con un usuario nuevo.
3. Ver en Firestore `alumnos/{uid}.googleWorkspace.status`.
4. Confirmar que `courses` incluye `765463029199`.
5. Confirmar en Admin Console que el usuario está en la UO correcta.
6. Confirmar en Classroom que aparece en Portal Montessori.

Detalle técnico completo: `docs/GOOGLE_WORKSPACE_INSCRIPCION.md`.
