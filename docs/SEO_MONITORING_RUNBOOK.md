# Runbook de monitoreo SEO y conversion

## Proposito y estado de control

Este runbook coordina la comprobacion posterior a la publicacion de
`montessorimexico.org` y `certificacionmontessori.com`. Es una guia de
observacion, no un mecanismo para forzar indexacion. La recepcion de IndexNow,
el rastreo y la indexacion son estados distintos; no se reinician procesos de
Google o Bing mediante reenvios repetidos, solicitudes repetidas o la
reanudacion de validaciones que sigan activas.

Las verificaciones de WordPress, borrador y publicacion se realizan fuera de
este repositorio por la persona propietaria u operadora autorizada. Este archivo
puede registrar un estado externo cuando una comprobacion autorizada, incluida
una consulta autenticada, deja evidencia fechada y verificable. No registre
claves, contrasenas de aplicacion, tokens ni otros secretos.

| Estado permitido | Significado |
| --- | --- |
| `PENDIENTE_CONTROLADO` | No se ha realizado o no se ha registrado evidencia. |
| `EN_PROCESAMIENTO` | El proveedor esta procesando; observar sin reiniciar ni reenviar. |
| `COMPLETADO_CON_EVIDENCIA` | Se registro fecha, responsable, URL/ID y resultado. |
| `BLOQUEADO` | No puede completarse; registrar causa y siguiente responsable. |

Plantilla de evidencia para cada item externo:

| Estado | Fecha de evidencia (YYYY-MM-DD) | Responsable | Evidencia verificable (captura, exportacion, URL o ID) | Resultado/notas |
| --- | --- | --- | --- | --- |
| `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | `pendiente` | `pendiente` |

## Control de WordPress e IndexNow

### Integracion unica mantenida

La unica integracion autorizada y verificada para este sitio WordPress es
**IndexNow Plugin** por `bingwebmastertools`, version **1.0.4**. Su ficha oficial
de WordPress es
[IndexNow Plugin](https://wordpress.org/plugins/indexnow/). El plugin genera y
aloja su propia clave, notifica cambios de URL publicados, actualizados y
eliminados, respeta `noindex` renderizado y `X-Robots-Tag`, y ofrece exclusion,
historial y reintentos. Por ello no se solicita ni se agrega una credencial de
automatizacion en `.env` para esta integracion.

AIOSEO base permanece activo. No se habilita un complemento IndexNow de AIOSEO
ni cualquier otra fuente duplicada de IndexNow junto al plugin autorizado.

| Control externo de WordPress | Estado | Fecha de evidencia | Responsable | Evidencia requerida |
| --- | --- | --- | --- | --- |
| Instalar/confirmar `IndexNow Plugin` de `bingwebmastertools` version 1.0.4. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Inventario autenticado previo: AIOSEO activo y plugin oficial ausente. Instalado mediante `POST /wp/v2/plugins`: `indexnow/indexnow-url-submission`, activo, version `1.0.4`, autor Microsoft Bing, HTTP `201`. |
| Confirmar configuracion/diagnostico y envio automatico para publicaciones, actualizaciones y eliminaciones. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | API autenticada del plugin inicializada: formato de clave valido, envio automatico activo y rutas excluidas vacias. |
| Confirmar que el plugin creo/aloja su clave y que no se solicito una credencial `.env`. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | El archivo publico de clave respondio HTTP `200` y su contenido coincidio exactamente con la clave configurada; no se agrego ninguna credencial a `.env`. No se registra el valor de la clave. |
| Confirmar que AIOSEO no tiene habilitado IndexNow ni existe otra integracion duplicada. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Inventario autenticado: 5 Code Snippets y cero coincidencias para IndexNow, `api.indexnow` o Bing IndexNow; no hay una segunda integracion en plugins. AIOSEO base sigue activo y no se instalo un complemento/plugin IndexNow duplicado. |

### Aislamiento del borrador y permalink final

1. Crear un articulo privado de prueba con estado `draft`. No publicar ni
   enviar la URL manualmente.
2. Revisar el historial/Insights de IndexNow en Bing Webmaster Tools. El
   resultado requerido es que no exista envio mientras el estado sea `draft`.
3. Tras la revision editorial, publicar usando el flujo normal de revisiones de
   WordPress y registrar la URL recibida. Debe tener el patron
   `https://montessorimexico.org/titulo-del-articulo/`; se rechaza
   `https://montessorimexico.org/?p=123`.
4. Devolver el articulo a su estado editorial previsto exclusivamente mediante
   el flujo normal de revisiones de WordPress. No eliminar contenido de
   produccion para repetir la prueba.

| Control externo de transicion | Estado | Fecha de evidencia | Responsable | Evidencia requerida |
| --- | --- | --- | --- | --- |
| Borrador privado creado; historial de IndexNow sin URL enviada mientras es `draft`. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Post `1630`, slug `control-indexnow-draft-2026-07-12`, estado `draft`; historial local `0` antes y `0` despues, sin coincidencias del slug. |
| Control independiente de actualizacion publica segura; no sustituye la prueba natural de alta programada. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Post `1338` guardado de nuevo como `publish`, con hash de titulo/contenido/extracto/slug sin cambios. Historial `0` a `1`, recibo `Success` para la URL exacta y contadores locales `1` exitoso/`0` fallidos. `https://montessorimexico.org/desarrollo-motor-grueso-asociacion-montessori-de-mexico/` respondio HTTP `200` con canonical coincidente y sin `?p=`. |
| Articulo revisado y publicado mediante el flujo normal; URL recibida con permalink bonito. | `PENDIENTE_CONTROLADO` | `2026-07-12` | `AMMAC / Codex` | Post `1345`, titulo Educar en la era digital: &iquest;personas o procesadores?, estado `future`, programado para `2026-07-12 22:24:29` hora del sitio. No publicar antes; falta observar la transicion natural `future` a `publish` y su recibo. |
| Confirmar que la URL recibida no usa `?p=123`. | `PENDIENTE_CONTROLADO` | `2026-07-12` | `AMMAC / Codex` | Slug previsto `educar-en-la-era-digital-asociacion-montessori-de-mexico`; falta verificar el permalink publico despues de la transicion natural. |
| Estado editorial final restaurado sin borrar contenido de produccion. | `PENDIENTE_CONTROLADO` | `2026-07-12` | `AMMAC / Codex` | Falta confirmar el estado editorial final del post `1345` despues de su publicacion programada. No borrar contenido ni repetir/forzar la prueba. |

## Verificacion del hosting desplegado

Despues de cada vista previa y despliegue de produccion, ejecute el contrato
HTTP contra el origen HTTPS exacto, sin una barra final:

```bash
npm run test:deployed-hosting -- https://ORIGEN-DESPLEGADO
```

La prueba comprueba respuestas `404` con `noindex`, redirecciones heredadas
localizadas, archivos para buscadores y sistemas de IA, canonicales y
`hreflang`, ausencia de los embeds externos retirados de Contacto y el archivo
publico de verificacion de IndexNow. Pasar esta prueba confirma el contrato
tecnico observado en ese origen; no confirma por si solo indexacion ni ranking.

## Cadencia posterior a cada release

| Momento | Revisar y registrar |
| --- | --- |
| Semanal | Estado de sitemaps, errores de rastreo/indexacion, recibos de IndexNow, comprobaciones de eventos rotos y diagnosticos de Consent Mode. |
| 48 horas despues del release | Estado de procesamiento y smoke test de produccion. |
| 7 dias | Muestras de URLs indexadas y movimiento de consultas no de marca. |
| 28 dias | Adquisicion por idioma/programa/articulo y eventos de intencion. |
| 90 dias | Tendencia de leads calificados y decision sobre el proyecto de marketing separado. |

En cada punto registre fecha de consulta, rango de fechas, propiedad/herramienta,
filtros, exportacion o captura y responsable. Separe observacion de acciones:
un estado en procesamiento se vuelve `EN_PROCESAMIENTO` y no se intenta
acelerarlo con reenvios reiterados.

## Google Search Console: checklist de terminacion controlada

Los **42 URLs canonicos** son un objetivo futuro del plan aprobado, no un
recuento declarado de produccion en la fecha de este documento. Completar esta
lista solo contra una exportacion fechada de la propiedad correcta.

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado requerido |
| --- | --- | --- | --- | --- |
| Sitemaps | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | `sitemap-index.xml` aparece como `Success` y sus informes hijos muestran 42 URLs canonicas enviadas/descubiertas. |
| Contrato de produccion | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Las 42 URLs enviadas responden `200`, son autocanonicas, indexables y tienen `hreflang` reciproco. |
| Page indexing | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Filtrar por el sitemap enviado; exportar y clasificar cada URL enviada no indexada por motivo. La indexacion se observa, no se fuerza. |
| Validacion existente | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Registrar el estado de validacion de `2026-07-11` para `Crawled - currently not indexed`; nunca reiniciarla mientras siga activa. |
| HTTPS | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Ninguna URL enviada aparece como no HTTPS. |
| Core Web Vitals | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Registrar estado movil/escritorio y p75 de LCP, INP y CLS cuando haya datos de campo; `insufficient data` es valido. |
| Mejoras/datos estructurados | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Investigar cada informe que Google realmente exponga; la ausencia de un informe Course no es error. |
| Acciones manuales | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Ninguna. |
| Problemas de seguridad | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Ninguno. |
| Rendimiento | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Exportar clics, impresiones, CTR y posicion por pagina, consulta, pais y dispositivo; segmentar `/en/`, `/pt-br/` y raiz espanola, ademas de consultas de marca/no marca. |

## Bing Webmaster Tools: checklist de terminacion controlada

Los **17 URLs comerciales modificados** son un objetivo futuro de terminacion
controlada del plan aprobado, no una afirmacion de que hoy existan 17 cambios
en produccion.

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado requerido |
| --- | --- | --- | --- | --- |
| Sitemaps | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | El indice y los hijos terminan de procesar sin error y contienen el inventario publico esperado. |
| URL Inspection | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Una URL de hub/programa por locale pasa las comprobaciones Index, SEO, Markup y Live URL. |
| Site Scan | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Ejecutar despues del despliegue un escaneo de alcance `Website`; objetivo: cero Errors y clasificar cada Warning/Notice antes de cambiar codigo. |
| Site Explorer | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Revisar filtros Indexed, Error, Warning, Excluded, redirects, noindex y robots; las URLs antiguas redirigidas se esperan fuera del inventario canonico. |
| IndexNow Insights | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Confirmar los 17 URLs comerciales modificados y las transiciones publicas de WordPress; los borradores nunca aparecen. |
| Rendimiento de busqueda | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Registrar movimiento de consulta/pagina/pais por separado de Google. |

## Acceso de crawlers e IA

Ejecute esta comprobacion contra el sitio en vivo y guarde las respuestas
fechadas, sin inferir acceso a partir de archivos locales:

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado requerido |
| --- | --- | --- | --- | --- |
| `robots.txt` vivo | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Se obtuvieron correctamente `https://certificacionmontessori.com/robots.txt` y `https://montessorimexico.org/robots.txt` desde produccion. |
| OAI-SearchBot | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Prueba HTTP en vivo con el UA oficial `OAI-SearchBot/1.4`: HTTP `200` tanto en `certificacionmontessori.com` como en `montessorimexico.org`. Ademas, Certificacion tiene grupo explicito con `Allow: /`; WordPress lo cubre con `User-agent: *`, que permite contenido publico, bloquea solo `/wp-admin/` y permite `/wp-admin/admin-ajax.php`. |
| GPTBot | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Prueba HTTP en vivo con el UA oficial `GPTBot/1.4`: `certificacionmontessori.com` respondio HTTP `200`; SiteGround cerro/restablecio la conexion a `montessorimexico.org`, incluso para `robots.txt`. El contenido de `robots.txt` permite GPTBot mediante `User-agent: *`, pero la capa de hosting de WordPress bloquea este bot de entrenamiento. El diagnostico queda completo; este bloqueo no impide ChatGPT Search y no se recomienda cambiarlo automaticamente. Desbloquear acceso para entrenamiento seria una decision separada de AMMAC y, en su caso, de soporte de hosting. |
| ChatGPT-User | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Prueba HTTP en vivo con el UA oficial `ChatGPT-User/1.0`: HTTP `200` tanto en `certificacionmontessori.com` como en `montessorimexico.org`. Ademas, Certificacion tiene grupo explicito con `Allow: /`; WordPress permite contenido publico mediante `User-agent: *`. Es un agente activado por la persona usuaria y `robots.txt` puede no aplicar en ese contexto. |
| Googlebot y bingbot: smoke HTTP | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Solicitudes en vivo con `Googlebot/2.1` y `bingbot/2.0` recibieron HTTP `200` de `certificacionmontessori.com` y `montessorimexico.org`. Esta es una comprobacion de acceso HTTP, no evidencia de indexacion. |
| `llms.txt` localizado | `PENDIENTE_CONTROLADO` | `2026-07-12` | `AMMAC / Codex` | `/llms.txt`, `/en/llms.txt` y `/pt-br/llms.txt` respondieron HTTP `200` y `text/plain`. El espanol de produccion aun recomienda la redireccion heredada `/certificate/`. El commit `0e7a0eb` corrige los canonicos localizados a `/{locale}/diplomados/#certificacion_internacional` y marca `llms.txt` como informativo; faltan despliegue y verificacion en produccion. |
| Interpretacion | `COMPLETADO_CON_EVIDENCIA` | `2026-07-12` | `AMMAC / Codex` | Permitir acceso a un crawler no garantiza ranking, indexacion, aparicion en resultados ni citacion. Base oficial: controles de acceso de [OpenAI](https://developers.openai.com/api/docs/bots), estado de indexacion de [Google](https://support.google.com/webmasters/answer/7440203) e IndexNow de [Bing](https://www.bing.com/webmasters/help/indexnow-0z209wby). |

No cambie reglas de `OAI-SearchBot`, `GPTBot` o `ChatGPT-User` como si fueran
intercambiables. El acceso de busqueda, el acceso de entrenamiento y las
solicitudes iniciadas por usuarios son controles independientes. OpenAI define
`OAI-SearchBot` como el control de aparicion en ChatGPT Search y `GPTBot` como el
bot para contenido que puede usarse en entrenamiento. El resultado de WordPress
coincide con la politica de SiteGround: permite crawlers de chat/busqueda y
bloquea bots de entrenamiento en el servidor. Por ello, el bloqueo observado de
`GPTBot` no es un impedimento para atraer visitas desde ChatGPT Search.

## Fuentes operativas oficiales

- Google Search Console, [Page Indexing](https://support.google.com/webmasters/answer/7440203), [Sitemaps](https://support.google.com/webmasters/answer/7451001), [URL Inspection](https://support.google.com/webmasters/answer/9012289), [Validation](https://support.google.com/webmasters/answer/9216203), [Search Console operations](https://support.google.com/webmasters/answer/10351509) y [Performance](https://support.google.com/webmasters/answer/10268906).
- Bing Webmaster Tools, [URL Inspection](https://www.bing.com/webmasters/help/URL-Inspection-55a30305), [Site Explorer](https://www.bing.com/webmasters/help/site-explorer-c680da37), [Site Scan](https://www.bing.com/webmasters/help/site-scan-623520c9) e [IndexNow](https://www.bing.com/webmasters/help/indexnow-0z209wby).
- WordPress, [IndexNow Plugin](https://wordpress.org/plugins/indexnow/).
- OpenAI, [bots y crawlers](https://developers.openai.com/api/docs/bots).
- SiteGround, [crawlers de IA permitidos](https://www.siteground.com/kb/allowed-ai-crawlers/) y [politica de crawling de bots de IA](https://eu.siteground.com/blog/ai-bot-crawling/).
