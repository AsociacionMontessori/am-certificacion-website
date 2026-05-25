# Configurar Credenciales Cifradas (F-03)

Procedimiento operativo para activar el cifrado at-rest de las contraseñas
de alumno (`passwordTemporal`, `passwordClassroom`) sin perder acceso.

**Diseño general:** `docs/PASSWORD_HARDENING_DESIGN.md`.
**Plan de fases:** `docs/SECURITY_HARDENING_PLAN.md`.

---

## 1) Concepto

- Hoy las contraseñas están en `alumnos/{uid}.passwordTemporal` y
  `alumnos/{uid}.passwordClassroom` en **texto plano**.
- A partir de este cambio, también se escriben **cifradas con AES-256-GCM**
  en `alumnoCredenciales/{uid}`, con reglas Firestore estrictas.
- La clave maestra `CREDENTIALS_ENCRYPTION_KEY` vive en **Firebase Secrets**
  y nunca en Firestore.
- El frontend **no cambia todavía**: sigue leyendo `passwordClassroom` /
  `passwordTemporal` del documento del alumno como hasta ahora. Esto evita
  romper el portal durante el deploy.
- El cleanup del plaintext es un **paso posterior**, una vez verificado que
  el frontend lee de la nueva fuente (otro commit / sesión).

---

## 2) Generar la clave maestra

```bash
# 32 bytes aleatorios en base64 (44 chars con padding)
openssl rand -base64 32
```

Guarda el valor en un gestor seguro fuera del repo (1Password, Bitwarden,
gestor de contraseñas del equipo). **Una vez perdida la clave, los
ciphertexts ya generados no se podrán descifrar.**

---

## 3) Setear el secret en Firebase

```bash
cd /home/carlos/Documentos/Repositorios/certificacionMontessori
npx firebase functions:secrets:set CREDENTIALS_ENCRYPTION_KEY
# Pegar el valor generado en el paso anterior cuando lo pida.
```

Verificar:

```bash
npx firebase functions:secrets:access CREDENTIALS_ENCRYPTION_KEY
# Debe imprimir el mismo valor que pusiste.
```

---

## 4) Deploy de las Functions

El secret debe existir ANTES del deploy; si no, `firebase deploy` falla
con `Secret CREDENTIALS_ENCRYPTION_KEY does not exist`.

```bash
# Solo el codebase stripe (que es el que usa la clave)
npx firebase deploy --only functions:stripe
```

Funciones afectadas:

- `completeInscripcionParte1` — ahora declara la clave como secret y, al
  crear alumno, hace dual-write a `alumnoCredenciales`.
- `getCredencialesAlumno` — **nueva** Function pública con auth Bearer.
  El propio alumno o un admin/directivo pueden leer sus credenciales
  descifradas. Catedráticos y grupos no.

Comprobar que la nueva ruta exista:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/getCredencialesAlumno
# Esperado: 401 (no auth)
```

---

## 5) Deploy de las reglas Firestore

```bash
npx firebase deploy --only firestore:rules
```

La nueva regla es **aditiva**: añade `match /alumnoCredenciales/{alumnoId}`
con `allow get` para alumno+admin+directivo y `list/write` deny. No toca
las reglas existentes de `alumnos`. Si el deploy falla, las reglas
anteriores siguen activas.

---

## 6) Migración (backfill) de alumnos existentes

El dual-write solo cubre alumnos **nuevos**. Para alumnos que ya tenían
`passwordTemporal`/`passwordClassroom` antes del deploy:

```bash
# Tener un service account JSON local o ADC con permisos sobre Firestore
export GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/sa.json

# Mismo valor que está en Firebase Secrets
export CREDENTIALS_ENCRYPTION_KEY="$(npx firebase functions:secrets:access CREDENTIALS_ENCRYPTION_KEY)"

# Dry-run para ver qué tocaría
node alumnos-app/scripts/migrar-credenciales.js --dry-run

# Apply real
node alumnos-app/scripts/migrar-credenciales.js
```

El script es idempotente: salta alumnos que ya tengan documento en
`alumnoCredenciales`. Con `--force` re-cifra los ya migrados (útil tras
rotar la clave).

**Reversibilidad:** este script no borra nada en `alumnos`. Si algo sale
mal, las contraseñas plaintext siguen intactas.

---

## 7) Validación

Después del deploy + migración:

1. **Verificar dual-write en una inscripción nueva.** Hacer una compra de
   prueba con `sk_test_`, completar parte 1 y comprobar que existe
   `alumnoCredenciales/{nuevoUid}` con `passwordEnc` y
   `passwordClassroomEnc`.

2. **Verificar lectura.** Como alumno autenticado:

   ```bash
   curl -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/getCredencialesAlumno \
     -H "Authorization: Bearer ID_TOKEN_DEL_ALUMNO" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   Esperado: `200` con `password` y `passwordClassroom` descifrados.

3. **Verificar permisos.** Como admin:

   ```bash
   curl -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/getCredencialesAlumno \
     -H "Authorization: Bearer ID_TOKEN_DEL_ADMIN" \
     -H "Content-Type: application/json" \
     -d '{"alumnoId":"UID_DE_ALUMNO"}'
   ```

   Esperado: `200` con las credenciales del alumno indicado.

4. **Verificar denegación.** Como alumno autenticado pero pidiendo
   credenciales de otro:

   ```bash
   curl -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/getCredencialesAlumno \
     -H "Authorization: Bearer ID_TOKEN_DEL_ALUMNO" \
     -H "Content-Type: application/json" \
     -d '{"alumnoId":"OTRO_UID"}'
   ```

   Esperado: `403`.

5. **Verificar que el frontend actual sigue funcionando.** Login alumno,
   ver Dashboard, ver `passwordClassroom`. Login admin, ver
   `AlumnoDetail`, ver `passwordClassroom`. Todo igual que antes
   (lee plaintext en `alumnos/{uid}`).

---

## 8) Siguientes pasos (otro commit)

1. **Migrar frontend** a llamar `getCredencialesAlumno` en vez de leer el
   campo plaintext. Componentes afectados:
   - `alumnos-app/src/pages/Dashboard.jsx:197-229`
   - `alumnos-app/src/pages/Expediente.jsx:116-119`
   - `alumnos-app/src/pages/Admin/AlumnoDetail.jsx:276, 881-887`
2. **Periodo de coexistencia** (1 semana) para detectar regresiones.
3. **Cleanup del plaintext.** Script `limpiar-passwords-alumnos.js` que
   `FieldValue.delete()` los campos en `alumnos/{uid}` después de verificar
   que `alumnoCredenciales/{uid}` existe.

---

## 9) Rotación de la clave maestra

Si la clave se compromete (o quieres rotar periódicamente):

1. Generar `CREDENTIALS_ENCRYPTION_KEY_V2` (otra `openssl rand -base64 32`).
2. `firebase functions:secrets:set CREDENTIALS_ENCRYPTION_KEY_V2 …`
3. Adaptar `credenciales.js` para que `getKey(version)` elija por `version`.
4. Script `rotar-credenciales.js` (a crear) que lee con v1, descifra,
   re-cifra con v2 y actualiza `version: 2`.
5. Una vez todos los docs tienen `version: 2`, retirar la clave v1.

---

## 10) Troubleshooting

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `Secret CREDENTIALS_ENCRYPTION_KEY does not exist` al `firebase deploy` | Olvidaste el paso 3 | `firebase functions:secrets:set CREDENTIALS_ENCRYPTION_KEY` |
| `getCredencialesAlumno` devuelve 500 con `no se pudo descifrar` | La clave en Secrets cambió respecto a cuando se cifró el doc | Volver a la clave anterior, o forzar re-cifrado |
| `inscripcionAlumno.js` deja warning `no se pudo guardar alumnoCredenciales` | La clave no estaba al momento de crear el alumno | Set del secret + correr `migrar-credenciales.js` para ese uid |
| Alumnos antiguos sin `alumnoCredenciales/{uid}` | Falta correr el backfill | `node alumnos-app/scripts/migrar-credenciales.js` |
| Frontend muestra password vacía | Solo aplica después de migrar el frontend en el siguiente commit | Mientras tanto el frontend sigue leyendo plaintext en `alumnos` |
