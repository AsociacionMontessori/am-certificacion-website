# Upgrade de Runtime: Node 22 + firebase-functions 7

**Status:** Node 22 se sube en Fase 0 (solo en `package.json`, sin re-deploy hasta validar). `firebase-functions` 6→7 se sube en Fase 1 con QA en emuladores.

---

## 1) Por qué

- **Node 20** quedó *deprecated* en Cloud Functions el **2026-04-30** y se retira el **2026-10-30**. Después de esa fecha, deploys con `engines.node: "20"` fallan y las funciones existentes dejan de invocarse.
- **firebase-functions 6.6.0** funciona, pero la rama mantenida es **7.x** y trae correcciones de seguridad y bug fixes (incluido el comportamiento de errores 500 en async handlers que ya manejamos con try/catch).
- **firebase-admin 13.10.0** ya está al día en ambos codebases (igual o más nuevo que la última publicada al momento de este doc).
- Local development corre en Node 22.x; el repo ya está alineado.

---

## 2) Compatibilidad de firebase-functions 7

Breaking changes relevantes (release notes oficiales v7.0.0):

| Cambio | Aplica a este repo | Acción |
|--------|--------------------|--------|
| Drop Node 16; mínimo Node 18 | No (subimos a 22) | Ninguna |
| Remueve `functions.config()` | No (el repo usa `defineSecret`) | Ninguna |
| TypeScript v5, target ES2022 | No (JS puro, CommonJS) | Ninguna |
| Async unhandled errors → 500 en Emulator | Parcial: ya hay try/catch en cada handler | Verificar que ninguna promesa quede sin manejar |
| Rename v1 `Event` → `LegacyEvent` (tipos) | No (no se usan tipos v1) | Ninguna |
| Soporte ESM | Opcional, seguimos en CommonJS | Ninguna |

No se detectaron incompatibilidades. La migración consiste en bump del rango semver y `npm install`.

---

## 3) Fase 0 — Cambio en `engines.node` (aplicado hoy)

Archivos:

- `alumnos-app/functions/package.json`
- `alumnos-app/functions-stripe/package.json`

Cambio:

```diff
 "engines": {
-  "node": "20"
+  "node": "22"
 },
```

**Efecto:** ninguno hasta el próximo `firebase deploy --only functions`. Mientras tanto, las funciones en producción siguen corriendo en Node 20.

---

## 4) Fase 1 — Bump firebase-functions 6→7 (con QA)

### 4.1 Cambios en `package.json`

Ambos codebases:

```diff
 "dependencies": {
-  "firebase-functions": "^6.6.0",
+  "firebase-functions": "^7.0.0",
   ...
 }
```

### 4.2 QA local con emuladores

```bash
cd alumnos-app/functions
npm install
node -e "require('./index.js')"          # carga sin errores

cd ../functions-stripe
npm install
node -e "require('./index.js')"

cd ..
# Levantar emuladores (Functions + Firestore + Auth + Storage)
firebase emulators:start \
  --only functions,firestore,auth,storage \
  --import=./tmp-emulator-data \
  --export-on-exit
```

Smoke tests (con `curl` contra los puertos del emulator, o usando el frontend Vite local apuntando al emulator):

1. **`createPublicCheckout`**: enviar cuerpo válido con `programa` + `cliente`, esperar `200` con `url` Stripe (en emulator Stripe responde igual con sk_test_).
2. **`stripeWebhook`**: enviar un evento simulado con `stripe trigger checkout.session.completed --webhook-endpoint http://localhost:5001/.../stripeWebhook` y verificar idempotencia.
3. **`createAlumnoCheckout`**: con `idToken` de un alumno de prueba.
4. **`completeInscripcionParte1`** y **`Parte2`**: usar `ordenId` generado en (1).
5. **`getInscripcionUploadUrl`** + PUT con curl al `uploadUrl` para confirmar Storage.
6. **`enviarEmailNotificacion`** (default codebase): crear doc en `emails_pendientes` y ver que se procese.

Pasa si: ningún error 500 sin causa, todos los logs muestran "ok", emuladores no reportan deprecaciones nuevas.

### 4.3 Deploy a producción

```bash
# 1. Deploy codebase stripe primero (más sensible)
npx firebase deploy --only functions:stripe

# 2. Deploy codebase default
npx firebase deploy --only functions:default

# 3. Verificar logs 5 min
npx firebase functions:log --only createPublicCheckout
npx firebase functions:log --only stripeWebhook
```

Si hay errores: `git revert` del commit del bump y re-deploy.

---

## 5) Lista de verificación pre-deploy

- [ ] `npm audit` limpio en `alumnos-app/functions` y `alumnos-app/functions-stripe`.
- [ ] `node -e "require('./index.js')"` carga sin error en ambos codebases.
- [ ] `firebase emulators:start` levanta sin warnings nuevos.
- [ ] Smoke tests (sección 4.2) pasan.
- [ ] `firebase functions:secrets:access STRIPE_SECRET_KEY` regresa valor esperado (existe en proyecto).
- [ ] El usuario que hace deploy tiene rol `Cloud Functions Admin` o equivalente.
- [ ] Hay una ventana de 30 min post-deploy para monitorear.

---

## 6) Rollback

```bash
# Revertir commit del bump
git revert <sha>
git push

# Re-deploy con la versión previa
npx firebase deploy --only functions
```

Cloud Functions no rota automáticamente al runtime anterior si el deploy falla a medias; si el deploy queda inconsistente, ejecutar de nuevo con los `package.json` revertidos.

---

## 7) Bitácora

| Fecha | Cambio | Verificado |
|-------|--------|------------|
| 2026-05-25 | `engines.node` 20 → 22 en ambos codebases. Sin re-deploy aún. | — |
| pendiente | `firebase-functions` 6 → 7. | — |
| pendiente | Deploy a producción. | — |
