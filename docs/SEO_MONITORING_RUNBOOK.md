# Runbook de monitoreo SEO y conversion

## Proposito y estado de control

Este runbook coordina la comprobacion posterior a la publicacion de
`montessorimexico.org` y `certificacionmontessori.com`. Es una guia de
observacion, no un mecanismo para forzar indexacion. La recepcion de IndexNow,
el rastreo y la indexacion son estados distintos; no se reinician procesos de
Google o Bing mediante reenvios repetidos, solicitudes repetidas o la
reanudacion de validaciones que sigan activas.

Las verificaciones de WordPress, borrador y publicacion se realizan fuera de
este repositorio por la persona propietaria. Este archivo no afirma que esten
instaladas, ejecutadas ni aprobadas. Para cada control externo registre el
estado y evidencia antes de marcarlo como completado.

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

El unico candidato autorizado para este sitio WordPress es **IndexNow Plugin**
por `bingwebmastertools`, version **1.0.4** segun el contexto verificado de
esta tarea. Su ficha oficial de WordPress es
[IndexNow Plugin](https://wordpress.org/plugins/indexnow/). El plugin genera y
aloja su propia clave, notifica cambios de URL publicados, actualizados y
eliminados, respeta `noindex` renderizado y `X-Robots-Tag`, y ofrece exclusion,
historial y reintentos. Por ello no se solicita ni se agrega una credencial de
automatizacion en `.env` para esta integracion.

AIOSEO Lite ya esta instalado, pero su complemento IndexNow requiere un plan
AIOSEO de pago. No se habilita esa segunda integracion ni cualquier otra fuente
duplicada de IndexNow.

| Control externo de WordPress | Estado | Fecha de evidencia | Responsable | Evidencia requerida |
| --- | --- | --- | --- | --- |
| Instalar/confirmar `IndexNow Plugin` de `bingwebmastertools` version 1.0.4. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Captura de Plugins y version. |
| Confirmar pagina de diagnostico disponible y envio automatico para publicaciones, actualizaciones y eliminaciones. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Captura de diagnostico/configuracion. |
| Confirmar que el plugin creo/aloja su clave y que no se solicito una credencial `.env`. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | URL de clave y captura sin secretos. |
| Confirmar que AIOSEO Lite no tiene habilitado IndexNow ni existe otra integracion duplicada. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Captura de AIOSEO y lista de plugins. |

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
| Borrador privado creado; historial de IndexNow sin URL enviada mientras es `draft`. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | ID interno, captura del estado y captura/registro de historial. |
| Articulo revisado y publicado mediante el flujo normal; URL recibida con permalink bonito. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | URL final y recibo/registro de IndexNow. |
| Confirmar que la URL recibida no usa `?p=123`. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | URL final copiada literalmente. |
| Estado editorial final restaurado sin borrar contenido de produccion. | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `pendiente` | Historial de revisiones/captura. |

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

| Control | Estado | Fecha de evidencia | Evidencia/resultado requerido |
| --- | --- | --- | --- |
| Sitemaps | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | `sitemap-index.xml` aparece como `Success` y sus informes hijos muestran 42 URLs canonicas enviadas/descubiertas. |
| Contrato de produccion | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Las 42 URLs enviadas responden `200`, son autocanonicas, indexables y tienen `hreflang` reciproco. |
| Page indexing | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Filtrar por el sitemap enviado; exportar y clasificar cada URL enviada no indexada por motivo. La indexacion se observa, no se fuerza. |
| Validacion existente | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Registrar el estado de validacion de `2026-07-11` para `Crawled - currently not indexed`; nunca reiniciarla mientras siga activa. |
| HTTPS | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Ninguna URL enviada aparece como no HTTPS. |
| Core Web Vitals | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Registrar estado movil/escritorio y p75 de LCP, INP y CLS cuando haya datos de campo; `insufficient data` es valido. |
| Mejoras/datos estructurados | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Investigar cada informe que Google realmente exponga; la ausencia de un informe Course no es error. |
| Acciones manuales | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Ninguna. |
| Problemas de seguridad | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Ninguno. |
| Rendimiento | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Exportar clics, impresiones, CTR y posicion por pagina, consulta, pais y dispositivo; segmentar `/en/`, `/pt-br/` y raiz espanola, ademas de consultas de marca/no marca. |

## Bing Webmaster Tools: checklist de terminacion controlada

Los **17 URLs comerciales modificados** son un objetivo futuro de terminacion
controlada del plan aprobado, no una afirmacion de que hoy existan 17 cambios
en produccion.

| Control | Estado | Fecha de evidencia | Evidencia/resultado requerido |
| --- | --- | --- | --- |
| Sitemaps | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | El indice y los hijos terminan de procesar sin error y contienen el inventario publico esperado. |
| URL Inspection | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Una URL de hub/programa por locale pasa las comprobaciones Index, SEO, Markup y Live URL. |
| Site Scan | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Ejecutar despues del despliegue un escaneo de alcance `Website`; objetivo: cero Errors y clasificar cada Warning/Notice antes de cambiar codigo. |
| Site Explorer | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Revisar filtros Indexed, Error, Warning, Excluded, redirects, noindex y robots; las URLs antiguas redirigidas se esperan fuera del inventario canonico. |
| IndexNow Insights | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Confirmar los 17 URLs comerciales modificados y las transiciones publicas de WordPress; los borradores nunca aparecen. |
| Rendimiento de busqueda | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Registrar movimiento de consulta/pagina/pais por separado de Google. |

## Acceso de crawlers e IA

Ejecute esta comprobacion contra el sitio en vivo y guarde las respuestas
fechadas, sin inferir acceso a partir de archivos locales:

| Control | Estado | Fecha de evidencia | Evidencia/resultado requerido |
| --- | --- | --- | --- |
| `robots.txt` vivo | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Obtener `https://certificacionmontessori.com/robots.txt` y la version publica aplicable de WordPress; archivar respuesta y codigo HTTP. |
| OAI-SearchBot | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Verificar una regla separada para `OAI-SearchBot`, que controla el acceso de ChatGPT Search. |
| GPTBot | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Verificar una regla separada para `GPTBot`, que controla el acceso para entrenamiento y se decide independientemente de OAI-SearchBot. |
| ChatGPT-User | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Verificar una regla/grupo separado. Es un agente activado por la persona usuaria; las reglas de `robots.txt` pueden no aplicar en ese contexto. |
| `llms.txt` localizado | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Comprobar `/llms.txt`, `/en/llms.txt` y `/pt-br/llms.txt`; permanecen informativos y no son una senal de ranking. |
| Interpretacion | `PENDIENTE_CONTROLADO` | `AAAA-MM-DD` | Registrar que permitir un crawler no garantiza ranking, indexacion, aparicion en resultados ni citacion. |

No cambie reglas de `OAI-SearchBot`, `GPTBot` o `ChatGPT-User` como si fueran
intercambiables. El acceso de busqueda, el acceso de entrenamiento y las
solicitudes iniciadas por usuarios son controles independientes.

## Fuentes operativas oficiales

- Google Search Console, [Page Indexing report](https://support.google.com/webmasters/answer/7440203), [sitemaps](https://support.google.com/webmasters/answer/9012289) y [validacion de correcciones](https://support.google.com/webmasters/answer/10268906).
- Bing Webmaster Tools, [URL Inspection](https://www.bing.com/webmasters/help/URL-Inspection-55a30305), [Site Explorer](https://www.bing.com/webmasters/help/site-explorer-c680da37), [Site Scan](https://www.bing.com/webmasters/help/site-scan-623520c9) e [IndexNow](https://www.bing.com/webmasters/help/indexnow-0z209wby).
- WordPress, [IndexNow Plugin](https://wordpress.org/plugins/indexnow/).
- OpenAI, [bots y crawlers](https://developers.openai.com/api/docs/bots).
