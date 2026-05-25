# Diseño: Endurecimiento de Credenciales sin Pérdida de Acceso

**Status:** propuesta — implementación en Fase 1.
**Hallazgo asociado:** F-03 en `security_best_practices_report.md`.

---

## 1) Por qué este cambio

Hoy `alumnos/{uid}.passwordTemporal` y `alumnos/{uid}.passwordClassroom` viven **en texto plano** en Firestore. Mientras el dump masivo de `alumnos` siga siendo posible (F-01) o si en el futuro un admin con permisos reducidos puede leer `alumnos`, esas contraseñas — que también dan acceso a Google Workspace — quedan al descubierto.

**No se pueden eliminar:** el alumno necesita ver su password inicial para entrar al portal y a Classroom, y administración necesita poder reenviársela. El objetivo es **mantener el acceso** pero **cifrar el dato** y **restringir quién lo lee**.

---

## 2) Modelo objetivo

### 2.1 Colección separada y reglas estrictas

Nueva colección `alumnoCredenciales/{alumnoId}` con documentos de la forma:

```json
{
  "passwordEnc": "<base64-iv|ciphertext|authtag>",
  "passwordClassroomEnc": "<base64-iv|ciphertext|authtag>",
  "version": 1,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>,
  "rotatedAt": null
}
```

Regla Firestore:

```firestore-rules
match /alumnoCredenciales/{alumnoId} {
  // Solo el propio alumno o un admin/directivo lee. Y solo `get`, no `list`.
  allow get: if (request.auth != null && request.auth.uid == alumnoId)
                || isAdmin()
                || isDirectivo();
  allow list: if false;
  // Escritura solo desde Admin SDK (Cloud Functions). Cliente no escribe nunca.
  allow write: if false;
}
```

Justificación de `allow list: if false`: no hay caso de uso para listar todas las credenciales; eso evita un dump tipo F-01 incluso si un día se equivoca un admin habilitando algo.

### 2.2 Cifrado at-rest

Algoritmo: **AES-256-GCM** (autenticado, anti-tamper).

Clave maestra `CREDENTIALS_ENCRYPTION_KEY`:

- 32 bytes aleatorios, generada con `openssl rand -base64 32`.
- Vive en Firebase Secrets: `firebase functions:secrets:set CREDENTIALS_ENCRYPTION_KEY`.
- Solo las Functions con `secrets: [credentialsEncryptionKey]` la leen.
- **No** se almacena ni se logea en ningún lugar más.

Esquema de cifrado por campo:

```
plaintext: utf-8 password
iv: 12 random bytes
ciphertext, authTag = aes-256-gcm(plaintext, key, iv)
stored = base64( concat(iv, ciphertext, authTag) )
version: 1   ← permite rotar a v2 si cambiamos algoritmo
```

Si en el futuro se rota la clave maestra, se actualiza `version` y un job migra documentos de v1→v2.

### 2.3 Helper de cifrado

`alumnos-app/functions-stripe/stripe/credenciales.js` (Fase 1):

```js
const crypto = require("crypto");
const {defineSecret} = require("firebase-functions/params");

const credentialsEncryptionKey = defineSecret("CREDENTIALS_ENCRYPTION_KEY");

function getKey() {
  const raw = credentialsEncryptionKey.value();
  // Acepta base64 o hex.
  if (/^[A-Fa-f0-9]+$/.test(raw) && raw.length === 64) {
    return Buffer.from(raw, "hex");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes");
  return key;
}

function encryptPassword(plain) {
  if (!plain) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

function decryptPassword(stored) {
  if (!stored) return null;
  const buf = Buffer.from(String(stored), "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);
  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return out.toString("utf8");
}

module.exports = {
  encryptPassword,
  decryptPassword,
  credentialsEncryptionKey,
};
```

### 2.4 Función de creación (en `inscripcionAlumno.js`)

Reemplazar:

```js
const alumnoData = {
  ...
  passwordClassroom: passwordClassroom || null,
  passwordTemporal: passwordTemporal || null,
};
```

por:

```js
// Ya no se guardan plaintexts en `alumnos`.
// Se guardan cifrados en alumnoCredenciales/{uid}.
const {encryptPassword} = require("./credenciales");

await db.collection("alumnoCredenciales").doc(uid).set({
  passwordEnc: encryptPassword(passwordTemporal),
  passwordClassroomEnc: encryptPassword(passwordClassroom),
  version: 1,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  rotatedAt: null,
});
```

### 2.5 Lectura desde frontend — Cloud Function `getCredencialesAlumno`

Nueva Function pública con auth de Firebase:

```js
exports.getCredencialesAlumnoHandler = onRequest(
    {region: "us-central1", cors: false, invoker: "public", secrets: [credentialsEncryptionKey]},
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;
      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }
      try {
        const authHeader = req.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          res.status(401).json({error: "No autenticado"});
          return;
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const alumnoId = String(req.body?.alumnoId || decoded.uid).trim();

        const db = admin.firestore();
        // Autoriza al propio alumno o a admin/directivo
        const isOwner = decoded.uid === alumnoId;
        const adminDoc = await db.collection("admins").doc(decoded.uid).get();
        const directivoDoc = adminDoc.exists ? null : await db.collection("directivos").doc(decoded.uid).get();
        if (!isOwner && !adminDoc.exists && !directivoDoc?.exists) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        const credSnap = await db.collection("alumnoCredenciales").doc(alumnoId).get();
        if (!credSnap.exists) {
          res.status(404).json({error: "Sin credenciales guardadas"});
          return;
        }
        const cred = credSnap.data();
        res.json({
          ok: true,
          alumnoId,
          password: decryptPassword(cred.passwordEnc),
          passwordClassroom: decryptPassword(cred.passwordClassroomEnc),
          rotatedAt: cred.rotatedAt || null,
        });
      } catch (err) {
        console.error("getCredencialesAlumno:", err);
        res.status(500).json({error: "Error al obtener credenciales"});
      }
    },
);
```

Notas operativas:

- Esta Function **no** se llama desde el sitio público; solo desde `alumnos-certificacionmontessori.web.app`.
- Rate limit (`enforceRateLimit` con key `getCredencialesAlumno`, límite 30/10min) para mitigar abuso si el `idToken` se filtra.
- Cada llamada se loguea con `alumnoId` consultado y `decoded.uid` actor; útil para auditoría.

### 2.6 Frontend

Reemplazar cualquier lectura directa de `alumnos.passwordTemporal` / `passwordClassroom` en el portal por una llamada a la Function:

- Página del alumno (`Dashboard.jsx` / `Expediente.jsx`): al pedir "ver mi acceso", llamar a `getCredencialesAlumno` con su propio `idToken`.
- Pantalla admin (`Admin/AlumnoDetail.jsx`): al ver detalle de alumno, mostrar botón "Ver credenciales" que llama a la misma Function pasando `alumnoId`.

Buscar referencias actuales en frontend para confirmar dónde se lee el campo plaintext (script `grep -rn "passwordTemporal\|passwordClassroom" alumnos-app/src src`).

---

## 3) Plan de migración (sin pérdida de acceso)

1. **Deploy de la Function** `getCredencialesAlumno` y de las helpers de cifrado. No cambia nada del modelo de datos todavía.
2. **Generar y configurar** `CREDENTIALS_ENCRYPTION_KEY` en Firebase Secrets.
3. **Script de migración** `alumnos-app/scripts/migrar-credenciales.js`:
   - Itera `alumnos` con paginación de 200.
   - Para cada doc con `passwordTemporal` o `passwordClassroom`, crea/actualiza `alumnoCredenciales/{uid}` con los valores cifrados.
   - Conserva los plaintexts en `alumnos` durante la transición.
   - Imprime resumen (creados, actualizados, sin password).
4. **Update frontend** para que las pantallas pidan credenciales a la Function. Verificar que cliente alumno y admin siguen viendo su password.
5. **Período de coexistencia** (1 semana): si la Function devuelve credenciales correctamente para 100% de los alumnos, proceder al paso 6. Si no, debuggear y reintentar paso 3.
6. **Script de limpieza** `alumnos-app/scripts/limpiar-passwords-alumnos.js`:
   - Itera `alumnos` y `unset` (FieldValue.delete) de `passwordTemporal`, `passwordClassroom`, `passwordAcceso` y `passwordHash` si existieran.
   - Antes de borrar, verifica que `alumnoCredenciales/{uid}` existe.
7. **Deploy de reglas Firestore** con `alumnoCredenciales` definido y `allow list: if false`.

Rollback en cualquier paso: el plaintext sigue existiendo hasta el paso 6. Si algo falla, revertir la UI a usar el plaintext.

---

## 4) Rotación de la clave maestra

Si en algún momento se cree comprometida `CREDENTIALS_ENCRYPTION_KEY`:

1. Generar nueva clave `CREDENTIALS_ENCRYPTION_KEY_V2` y guardarla en Firebase Secrets sin borrar la v1.
2. Script `rotar-credenciales.js`: lee con clave v1, re-encripta con v2, actualiza el doc con `version: 2`.
3. Actualizar helper para que `getKey()` seleccione por `version`.
4. Después de verificar 100%, retirar la clave v1.

---

## 5) Qué se logra con este diseño

| Atacante | Antes | Después |
|----------|-------|---------|
| Anónimo con dump de `alumnos` (F-01 abierto) | Lee password plaintext de todos los alumnos | Solo ve `email`, `nombre`, no hay password en `alumnos` |
| Admin con acceso a Firestore Console | Lee password plaintext directo | Lee ciphertext; sin la clave en Secrets no descifra |
| Compromiso de UI admin | Puede mostrar password al pedirla a la Function | Sí, pero quedó en log auditable |
| Filtración de la clave maestra | n/a | Re-encriptar todo con rotación; ciphertext anterior no se puede descifrar sin la clave |

---

## 6) Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Pérdida de la clave maestra → no se descifran credenciales antiguas | Backup cifrado de la clave fuera de Firebase (gestor de secretos del equipo); documentar en `CONFIGURAR_SECRETOS.md` |
| Rate de llamadas a `getCredencialesAlumno` muy alto | `enforceRateLimit` por usuario + cache 30s en frontend |
| Atacante con sesión de admin secuestrada | Auditoría server-side de cada lectura; rotación de admin tokens; obligar re-auth para "ver credenciales" |
| Cambios en lectura de credenciales rompen onboarding | Toggle frontend para volver al lectura legacy mientras dura el período de coexistencia |
