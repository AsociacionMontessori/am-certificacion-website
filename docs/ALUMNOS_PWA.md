# PWA del portal de alumnos

Implementada el 15 de septiembre de 2026, sobre 3714c99. Portal: https://alumnos.certificacionmontessori.com.

## Instalación

Botón «Instalar app» en login y dentro de los layouts de alumnos y administración. Chrome/Edge compatibles muestran su diálogo nativo; los demás reciben instrucciones accesibles. iPhone/iPad: Safari → Compartir → Añadir a pantalla de inicio. No es una publicación en tiendas.

## Alcance y privacidad

Manifest con ID, inicio y scope `/`, modo standalone, iconos 192/512, maskable y Apple 180. Conserva la autenticación, roles, rutas y datos actuales. No añade dependencias.

Service worker `alumnos-app/public/sw.js`: solo guarda `/offline.html` (página pública) en `alumnos-public-offline-v1`. Navegación same-origin usa red y fallback al fallar; no intercepta APIs, documentos, peticiones externas ni escrituras. No activa `skipWaiting` ni fuerza recargas: actualizaciones de worker se activan al cerrar las ventanas anteriores. Cambiar el nombre de caché al modificar la página offline. No modifica la persistencia que Firebase ya tuviera configurada.

HTML/rutas, worker y manifiesto se revalidan; `/assets/**` conserva caché immutable por hash. Publicación limitada al sitio Hosting `alumnos-certificacionmontessori`, desde `alumnos-app`; no desplegar desde la raíz para esta tarea.

## Verificación

- Build de la base reprodujo los hashes de producción antes del cambio.
- `npm run build`, ESLint de los dos módulos nuevos y `git diff --check` correctos.
- Playwright Chromium persistente: `Page.getInstallabilityErrors` vacío (el contexto incógnito informa `in-incognito`, esperado).
- Vista 390×844 sin desbordamiento; guía legible y cierre con Escape.
- Navegación offline a `/expediente` muestra solo aviso público; recuperación online correcta.
- Cache Storage contiene exclusivamente `/offline.html`.
- Evento appinstalled simulado oculta el botón; no equivale a instalación física.
- No se realizaron inicios de sesión reales ni pruebas en teléfonos físicos.

## Publicar y revertir

Desde `alumnos-app`: `npm run build` y `npx --offline firebase deploy --only hosting --project certificacionmontessori --non-interactive`.

Antes del cambio se clonó live al canal `before-pwa-20260915`. Mientras el canal siga disponible:

```
npx --offline firebase hosting:clone alumnos-certificacionmontessori:before-pwa-20260915 alumnos-certificacionmontessori:live --project certificacionmontessori --non-interactive
```

Copia duradera de dist y firebase.json originales: `/home/carlos/.openclaw/workspace/artifacts/alumnos-pwa-20260915/`. Para revertir tras expirar el canal, usar esos archivos con la misma selección de proyecto/sitio. Un worker ya instalado puede seguir mostrando el aviso offline, pero su navegación online siempre usa red; no almacena la app anterior. No tocar AppMontessori ni el sitio principal.
