# Cerrar F-01 — Tightening de la regla `list` en `alumnos`

Procedimiento para el paso final del hallazgo F-01: endurecer
`firestore.rules` para que la colección `alumnos` ya no pueda listarse
anónimamente. Solo se aplica **después** de validar en producción que la
Function `verificarCertificadoPublico` funciona y el frontend la usa.

**Diseño:** la verificación pública de certificados pasa de
`getDocs(query(collection(db,'alumnos'), where('folioCertificado','==', folio)))`
a `POST https://…/verificarCertificadoPublico`. La regla pública en
Firestore deja de ser necesaria.

---

## 1) Estado actual (después del commit que introduce este doc)

- Cloud Function `verificarCertificadoPublico` está en el código.
- `certificadoService.verificarCertificado` (frontend portal alumnos)
  intenta la Function primero y cae al método legacy (getDocs Firestore)
  si la Function no está disponible o responde 5xx.
- `firestore.rules` sigue con `allow list: if true;` en `alumnos`. La
  Function NO está desplegada todavía.

---

## 2) Secuencia segura de deploy

### Paso 1 — Deploy de la Function

```bash
cd /home/carlos/Documentos/Repositorios/certificacionMontessori
npx firebase deploy --only functions:stripe
```

Verificar:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/verificarCertificadoPublico \
  -H "Content-Type: application/json" \
  -d '{}'
# Esperado: 400 (faltan parámetros)

curl -s \
  -X POST https://us-central1-certificacionmontessori.cloudfunctions.net/verificarCertificadoPublico \
  -H "Content-Type: application/json" \
  -d '{"folio":"FOLIO_REAL","codigoVerificacion":"CODIGO_REAL"}'
# Esperado: { "valido": true, "alumno": { ... } }
```

### Paso 2 — Deploy del portal alumnos

```bash
npm --prefix alumnos-app run build
npx firebase deploy --only hosting:alumnos-certificacionmontessori
```

Probar manualmente la ruta `/verificar/:folio/:codigo` con un certificado
real. Debe ver "Certificado Válido". En DevTools confirmar que la llamada
va al Function endpoint (no a Firestore).

### Paso 3 — Validación en producción (24-48h)

Monitorear logs:

```bash
npx firebase functions:log --only verificarCertificadoPublico
```

Confirmar:

- Llamadas reales legítimas pasan (200 con `valido:true`).
- Llamadas con folio/código incorrectos devuelven `valido:false`.
- No hay 5xx significativos.
- Rate limit razonable (60 / 10min por IP).

Si todo se ve bien después de 24-48h, proceder al paso 4. Si hay
problemas, revertir el frontend al método legacy con `git revert` y
descartar el paso 4 mientras se debugea.

### Paso 4 — Tightening de la regla Firestore (cierra F-01)

Cambio en `firestore.rules`:

```diff
   match /alumnos/{alumnoId} {
     allow read: if isOwnAlumno(alumnoId)
                  || canReadAdmin()
                  || canReadAlumno(alumnoId)
                  || (request.auth == null &&
                      resource.data.folioCertificado != null &&
                      resource.data.codigoVerificacion != null &&
                      resource.data.estado != 'Inactivo');

     allow write: if isOwnAlumno(alumnoId) || isAdmin();

-    // Permitir consultas (list) para verificación de certificados
-    // Esto es necesario para la función verificarCertificado que usa where()
-    // Permite tanto usuarios autenticados como no autenticados
-    // La seguridad está en que necesitas el folio Y el código para verificar
-    allow list: if true; // Permitir consultas para verificación (seguro porque necesitas folio + código)
+    // F-01 cerrado: la verificación pública pasó a la Cloud Function
+    // `verificarCertificadoPublico`. Aquí dejamos `list` restringido a
+    // perfiles admin/directivo/catedrático que sí necesitan consultar el
+    // padrón completo de alumnos.
+    allow list: if canReadAdmin();
   }
```

Deploy:

```bash
npx firebase deploy --only firestore:rules
```

Después del deploy:

- Llamada anónima `getDocs(collection(db,'alumnos'), where(...))` falla
  con `permission-denied`. ✓
- Función pública `verificarCertificadoPublico` sigue funcionando porque
  usa Admin SDK. ✓
- Páginas admin (Dashboard, GestionPagos, RegenerarCodigos, GeneradorQR,
  GestionGrupos, DiagnosticoCodigos) siguen funcionando porque el `read`
  rule todavía incluye `canReadAdmin()` para autenticados. ✓

### Paso 5 — Limpieza del fallback en frontend

Una vez validado el paso 4 (1 semana sin reportes), eliminar el bloque
"Intento 2 (legacy)" en
`alumnos-app/src/services/certificadoService.js`. Mantener solo la
llamada a la Function. Documentar el cierre en
`docs/SECURITY_HARDENING_PLAN.md`.

---

## 3) Rollback

Si después del paso 4 algo se rompe en producción:

```bash
git revert <sha del commit que cambió firestore.rules>
npx firebase deploy --only firestore:rules
```

Las reglas vuelven a permitir `allow list: if true;` y la verificación
legacy (fallback en el frontend) recupera funcionalidad. El cierre se
puede reintentar después de identificar la causa.

---

## 4) Por qué este orden y no otro

- **Function antes que rules:** si tightening de rules va antes y la
  Function falla, la verificación de certificados queda rota. El usuario
  externo (RVOE, empleadores, padres) que entra al QR no ve nada.
- **Frontend con fallback:** durante la transición, si por algún motivo
  la Function tiene cold start lento o falla, el legacy sigue
  funcionando. Una vez confirmada estabilidad, se quita el fallback.
- **Validación en producción real:** los emuladores no replican el rate
  limiter de Firestore ni el flujo real de Cloud Run. 24-48h en prod
  con tráfico real es la confianza mínima antes de tocar reglas.
