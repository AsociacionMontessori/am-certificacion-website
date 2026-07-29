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
| Articulo revisado y publicado mediante el flujo normal con permalink bonito. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | La API publica de WordPress devolvio post `1345`, estado `publish`, fecha original programada `2026-07-12T22:24:29`, titulo intacto y slug `educar-en-la-era-digital-asociacion-montessori-de-mexico`. No se adelanto ni se repitio la publicacion. |
| Confirmar el recibo automatico de IndexNow para la transicion natural del post `1345`. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Consulta autenticada de solo lectura al historial del plugin: recibo `Success`, tipo `add`, fecha `2026-07-12 16:32:38 CST` y URL exacta `https://montessorimexico.org/educar-en-la-era-digital-asociacion-montessori-de-mexico/`. Los contadores quedaron en `2` exitosos y `0` fallidos. No se reenvio la URL para generar esta evidencia. |
| Confirmar que la URL publicada no usa `?p=123`. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | `https://montessorimexico.org/educar-en-la-era-digital-asociacion-montessori-de-mexico/` respondio HTTP `200` y declaro ese mismo permalink como canonical. El enlace publico de la API coincide y no contiene query string. |
| Estado editorial final restaurado sin borrar contenido de produccion. | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | El estado editorial final del post `1345` es `publish`. No se borro contenido ni se altero su titulo, slug o fecha programada. |

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

| Control de produccion | Estado | Fecha de evidencia | Responsable | Evidencia/resultado |
| --- | --- | --- | --- | --- |
| Despliegue de Firebase Hosting | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | `npm run deploy` completo: contratos base, compilacion Gatsby y SEO construido pasaron; se generaron `27` URLs canonicas, `9` por idioma, y Firebase confirmo la liberacion de la version. |
| Contrato HTTP del dominio publico | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | `npm run test:deployed-hosting -- https://certificacionmontessori.com` paso despues del despliegue final. Valida `404` con `noindex`, redirecciones localizadas, archivos de robots/sitemap/IA, canonicales, `hreflang`, Contacto sin embeds retirados y la verificacion publica de IndexNow. |
| Redireccion heredada de `/buscador/` | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | La comprobacion HTTPS posterior al despliegue registro exactamente `1` redireccion desde `/buscador/` hasta `https://certificacionmontessori.com/directorio/`, con respuesta final HTTP `200`. Se elimino la cadena intermedia sin recuperar la ruta antigua como pagina indexable. |
| QA visual responsive de Contacto | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Playwright verifico produccion en `1440x900` y `390x844`: enlaces sociales legibles, menu movil con icono visible y ancho movil sin desbordamiento horizontal. |

### Release de paginas comerciales por programa: 2026-07-22

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado |
| --- | --- | --- | --- | --- |
| Ventana de despliegue y version | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | Build final generado entre `15:08` y `15:10 CST`; el contenido desplegado quedo registrado en Git como `c42a5ef` (`feat(programs): add localized SEO landing pages`) sobre la rama `feat/program-pages-seo`. |
| Release de Firebase Hosting | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | `npm run deploy` termino correctamente para el proyecto `certificacionmontessori`; Firebase activo la release en `https://certificacionmontessori.com`. El CLI no guardo un identificador opaco adicional en el repositorio, por lo que la evidencia reproducible es proyecto, dominio, commit y contrato HTTP posterior. |
| Inventario canonico desplegado | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | `npm run test:seo-production` paso contra produccion con `42` URLs canonicas: `14` en espanol, `14` en ingles y `14` en portugues brasileno. Incluye cinco paginas de programa por idioma: Nido/Comunidad Infantil, Casa de Ninos, Taller I-II, Educacion Cosmica y Neuroeducacion. |
| Acceso desde `/diplomados/` | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | El directorio de programas enlaza primero a la pagina informativa localizada de cada nivel; el pago queda como una accion posterior explicita. Las rutas, copias y schemas pasaron `npm run test:program-pages`. |
| Consentimiento y experiencia | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | El panel conserva aceptar, rechazar y personalizar; permite cerrar o minimizar sin interpretar silencio como consentimiento. Analitica opcional permanece bloqueada hasta consentimiento afirmativo. |
| GA4 y atribucion editorial | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | DebugView confirmo exactamente un `click_program_cta` en el destino atribuido, con parametros permitidos como `program_id`, `cta_position`, `landing_path`, `lead_channel`, `source_content_id` y `source_hostname`; la fuente WordPress no emitio el evento comercial y la navegacion multidominio conservo `_gl`. No se capturo PII. |
| IndexNow del cambio | `COMPLETADO_CON_EVIDENCIA` | `2026-07-22` | `AMMAC / Codex` | El lote diferencial incluyo exclusivamente `17` URLs canonicas modificadas y `api.indexnow.org` lo acepto (`IndexNow accepted 17 URL(s)`). No se reenvio el sitemap completo ni se incluyeron rutas de pago, privadas o redirigidas. |
| Geolocalizacion de moneda | `PENDIENTE_CONTROLADO` | `2026-07-22` | `AMMAC / Codex` | `ipapi.co/json` respondio `429` durante QA. El checkout conserva el fallback seguro a MXN, por lo que no es una caida ni un bloqueo SEO. Antes de campanas pagadas se evaluara cache, proveedor alterno o eliminacion de esta dependencia para evitar clasificacion incorrecta de moneda. |
| Automatizacion editorial | `COMPLETADO_CON_EVIDENCIA` | `2026-07-23` | `AMMAC / Codex` | `montessori-blog-automation` quedo en `ee7be18` con `IMAGE_WORKFLOW=manual`, contenido en `gemini-3.6-flash`, reintentos acotados y `114` pruebas aprobadas. El primer paquete real `img-20260723-193234-4d3276be` preservo el articulo sin crear un borrador hasta recibir y validar la portada; despues genero la imagen destacada `1631` y el borrador de WordPress `1632`, y se archivo como `draft_created`. La cola quedo vacia. Al reactivar `montessori-blog.timer` y `montessori-cuadernillos.timer`, sus ejecuciones atrasadas detectaron el paquete pendiente y terminaron sin generar un segundo articulo o cuadernillo; ambos temporizadores permanecen activos. |

Controles de esta release:

| Momento | Fecha objetivo | Estado | Evidencia requerida |
| --- | --- | --- | --- |
| 48 horas | `2026-07-24` | `EN_PROCESAMIENTO` | Control anticipado ejecutado el `2026-07-23`: Google ya proceso las `42` URLs; Bing proceso el indice pero aun conserva `27` URLs en el sitemap hijo. Se inspecciono una pagina de programa por idioma en ambos buscadores y el smoke HTTP de las `42` canonicas paso. No se reenviaron sitemaps ni URLs. |
| 7 dias | `2026-07-29` | `COMPLETADO_CON_EVIDENCIA` | Produccion conserva `42` canonicas validas. Google ya indexa la muestra Casa de Ninos en ES, EN y PT-BR; el rendimiento del `2026-07-21` al `2026-07-27` registra primeras impresiones en cuatro paginas individuales de programa. Bing ya muestra trafico y paginas EN/PT-BR, pero las tres paginas Casa siguen descubiertas sin rastrear y el sitemap hijo conserva `27` URLs. La muestra de programas aun no permite evaluar reescrituras de titulos. No se reenviaron sitemaps ni solicitudes de indexacion. |
| 28 dias | `2026-08-19` | `PROGRAMADO` | Clics, impresiones, CTR, posicion, idioma, pais y eventos `click_program_cta`/lead frente a la linea base. |
| 90 dias | `2026-10-20` | `PROGRAMADO` | Leads calificados, conversion por programa e idioma, rendimiento editorial y decision separada sobre publicidad, email y colaboraciones. |

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

La release historica del `2026-07-13` contenia **27 URLs canonicas**, nueve por
idioma. Desde el despliegue del `2026-07-22`, el contrato publico contiene
**42 URLs canonicas**, catorce por idioma. Los informes retrasados de Search
Console pueden conservar temporalmente recuentos anteriores; solo se actualiza
su estado cuando la propiedad muestre evidencia fechada.

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado requerido |
| --- | --- | --- | --- | --- |
| Sitemaps | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Captura de la propiedad correcta: `/sitemap-index.xml`, tipo `Indice de sitemaps`, enviado `2026-07-09`, ultima lectura `2026-07-11`, estado `Correcto`, `27` paginas descubiertas y `0` videos. No se reenvio el sitemap. |
| Contrato de sitemap actual | `COMPLETADO_CON_EVIDENCIA` | `2026-07-29` | `AMMAC / Codex` | Consulta autenticada de control: `sitemap-index.xml` conserva estado `Correcto`, ultima lectura `2026-07-22`, `42` paginas descubiertas y `0` videos. Coincide con las `42` canonicas (`14` por idioma) verificadas de nuevo por `npm run test:deployed-hosting -- https://certificacionmontessori.com` y `npm run test:seo-production`. No se volvio a presentar el sitemap. |
| Contrato de produccion | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | El contrato HTTP posterior al despliegue valido las `27` URLs canonicas, nueve por idioma: respuestas publicas correctas, canonicales, indexabilidad y `hreflang` reciproco. Este control tecnico no afirma que Google ya las haya indexado. |
| Muestra manual de programas | `COMPLETADO_CON_EVIDENCIA` | `2026-07-29` | `AMMAC / Codex` | Inspeccion autenticada de Casa de Ninos en los tres idiomas: `/diplomados/casa-de-ninos/`, `/en/diplomados/casa-de-ninos/` y `/pt-br/diplomados/casa-de-ninos/` estan en Google. Los ultimos rastreos fueron `2026-07-26`, `2026-07-23` y `2026-07-24`, respectivamente; Googlebot smartphone obtuvo cada pagina correctamente, permitio rastreo e indexacion y eligio como canonical la URL localizada inspeccionada. Las tres pertenecen al sitemap y exponen un breadcrumb valido. No se repitieron solicitudes de indexacion. |
| Page indexing | `EN_PROCESAMIENTO` | `2026-07-29` | `AMMAC / Codex` | El informe agregado, actualizado `2026-07-23`, muestra `26` URLs indexadas y `34` sin indexar entre `60` URLs conocidas. Los motivos son `9` paginas con redireccion, `4` alternativas con canonical adecuada, `1` no encontrada (`404`), `16` descubiertas actualmente sin indexar y `4` rastreadas actualmente sin indexar. El total incluye redirecciones, alternativas y otras variantes; no se compara directamente con las `42` canonicas del sitemap. La muestra manual posterior confirma el avance de las tres versiones Casa. |
| Validacion existente | `EN_PROCESAMIENTO` | `2026-07-23` | `AMMAC / Codex` | La pantalla actual marca `No iniciada` en los cuatro motivos; la validacion historica iniciada el `2026-07-11` ya no aparece activa en este informe reclasificado. No se inicia otra validacion ni se solicitan indexaciones repetidas mientras el informe conserve fecha anterior al release. |
| HTTPS | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | El informe HTTPS muestra `15` URLs HTTPS, `0` URLs no HTTPS, ningun problema critico y ninguna incidencia detectada en los ultimos 90 dias. El recuento retrasado de este informe no se interpreta como inventario total del sitemap. |
| Core Web Vitals | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Chrome UX Report, actualizado `2026-07-11`: movil muestra `15` URLs rapidas, `0` deficientes y `0` que necesitan mejora. Ordenador indica datos de uso insuficientes durante los ultimos 90 dias; se registra como resultado valido, no como error. No existen grupos problematicos que validar. |
| Mejoras/datos estructurados | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | La propiedad solo expone el informe `Rutas de exploracion`, actualizado `2026-07-11`: `14` elementos validos, `0` no validos y ningun problema detectado en los ultimos 90 dias. El recuento es anterior al despliegue actual y no se interpreta como inventario del sitemap. Google no expone otros informes de mejoras; la ausencia de un informe Course no es un error. |
| Acciones manuales | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | El informe de Acciones manuales de la propiedad muestra `No se ha detectado ningun problema`; no existe penalizacion manual activa. |
| Problemas de seguridad | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | El informe de Problemas de seguridad muestra `No se ha detectado ningun problema`; Google no reporta incidencias de seguridad activas en la propiedad. |
| Rendimiento | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Exportacion CSV de los ultimos 28 dias, busqueda Web sin filtros, analizada en `docs/SEO_GSC_BASELINE_2026-07-13.md`: `288` clics, `5,417` impresiones, CTR `5.32 %`, posicion `7.39` y `221` consultas visibles. Incluye segmentacion por pagina, locale, pais, dispositivo, marca/no marca visible e intencion, con limites de privacidad y agregacion documentados. Es la linea base anterior al despliegue del `2026-07-13`. |
| Rendimiento post-release: 7 dias | `COMPLETADO_CON_EVIDENCIA` | `2026-07-29` | `AMMAC / Codex` | Search Console, busqueda Web sin filtros, `2026-07-21` a `2026-07-27`: `73` clics, `1.12 mil` impresiones, CTR `6.5 %` y posicion media `8.2`; el periodo anterior (`2026-07-14` a `2026-07-20`) registro `71`, `1.11 mil`, `6.4 %` y `7.0`. El trafico agregado permanece estable: `+2` clics, aproximadamente `+10` impresiones y `+0.1` puntos de CTR, mientras la posicion media empeoro `1.2` posiciones. En las filas visibles aparecen por primera vez paginas individuales de programa: Taller I-II ES (`8` impresiones), Casa ES (`1`), Neuroeducacion EN (`2`) y Nido EN (`2`), todas aun con `0` clics. EN ya registra clics en portada, directorio y diplomados; PT-BR registra `9` impresiones en su portada pero aun no clics ni paginas individuales de programa. El volumen de programas no permite atribuir reescrituras de titulo ni tomar decisiones de contenido. |

## Bing Webmaster Tools: checklist de terminacion controlada

Los **17 URLs comerciales modificados** de la release del `2026-07-22` ya
existen en produccion y fueron aceptados en un unico lote diferencial por
IndexNow. Aceptacion, rastreo, indexacion y posicionamiento siguen siendo
estados distintos.

| Control | Estado | Fecha de evidencia | Responsable | Evidencia/resultado requerido |
| --- | --- | --- | --- | --- |
| Sitemaps | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | Bing muestra `2` mapas conocidos, `0` con errores y `0` con advertencias. `sitemap-0.xml` fue leido el `2026-07-11`, tiene estado `Exito` y `27` URLs descubiertas; `sitemap-index.xml` tiene estado `Exito` y cuenta como `1` recurso descubierto. El resumen de `28` es la suma del indice y las `27` URLs, no una pagina canonica adicional. No se reenvio. |
| Contrato de sitemap actual | `EN_PROCESAMIENTO` | `2026-07-29` | `AMMAC / Codex` | Bing volvio a rastrear `sitemap-index.xml` el `2026-07-27` con estado `Success`, pero `sitemap-0.xml` conserva ultima lectura `2026-07-11` y `27` URLs. El resumen permanece en `28` por sumar el indice. Produccion sigue validando `42` canonicas y Bing ya muestra rendimiento de paginas internacionales, por lo que se espera el refresco natural del sitemap hijo sin volver a enviarlo. |
| Release de programas e IndexNow | `EN_PROCESAMIENTO` | `2026-07-22` | `AMMAC / Codex` | El contrato publico contiene `42` canonicas y el lote diferencial de `17` URLs fue aceptado una sola vez. Bing debe poblar Site Explorer, rastreo e indexacion de forma asincrona; no se repite el lote sin cambios nuevos. |
| URL Inspection | `EN_PROCESAMIENTO` | `2026-07-13` | `AMMAC / Codex` | La portada espanola esta `Indexado con exito`: descubierta `2022-08-16`, ultimo rastreo exitoso `2026-07-11 23:25`, fetch correcto y rastreo/indexacion permitidos. `/en/` y `/pt-br/` fueron descubiertas `2026-07-09`, pero aun figuran `Descubierto pero no arrastrado`. Las tres pruebas `URL en vivo` indican que pueden ser indexadas; Bing reconoce JSON-LD y OpenGraph. El error de titulo ingles desaparecio tras reducir todos los titulos canonicos a un maximo de `63` caracteres. El aviso restante cuenta `20` separadores de Gatsby con `alt=""`, `role="presentation"` y `aria-hidden="true"`; el contrato confirma cero imagenes de contenido sin `alt`, por lo que se registra como falso positivo de accesibilidad y no se modifica. El control sigue en procesamiento hasta que Bing rastree e indexe las portadas internacionales. |
| Muestra manual de programas | `EN_PROCESAMIENTO` | `2026-07-29` | `AMMAC / Codex` | `/diplomados/casa-de-ninos/`, `/en/diplomados/casa-de-ninos/` y `/pt-br/diplomados/casa-de-ninos/` siguen `Discovered but not crawled`; Bing conserva como fecha de descubrimiento `2026-07-22`. Las pruebas en vivo del control anterior ya demostraron que las tres pueden indexarse y el contrato publico volvio a pasar hoy. No aparecio un fallo tecnico nuevo, por lo que no se repitio la prueba en vivo, el envio de sitemap ni la solicitud manual de indexacion. |
| Site Scan | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | `AMMAC / Codex` | `Auditoria SEO completa - 2026-07-14` finalizo sobre `56` paginas con `0` errores, `51` advertencias por `alt` y `3` avisos por H1. El CSV de las `51` URLs se contrasto con los HTML construidos: `1,461` imagenes, `0` sin atributo `alt` y `672` con `alt=""`, todas decorativas dentro de `aria-hidden="true"`; tres muestras en produccion confirmaron el mismo resultado, por lo que se clasifica como falso positivo de Bing y no se agrega texto alternativo artificial. El unico hallazgo real eran `/reembolsos/`, `/en/reembolsos/` y `/pt-br/reembolsos/` sin H1: el titulo introductorio cambio de `h2` a `h1`, el contrato exige ahora exactamente un H1 en las `27` canonicas y las tres versiones se verificaron en produccion con canonical e `index,follow` correctos. El informe original queda como fotografia historica; no se repite el escaneo solo para alterar su contador. |
| Site Explorer | `EN_PROCESAMIENTO` | `2026-07-14` | `AMMAC / Codex` | La vista `URLs indexadas` y la vista `Todas las URLs` aun muestran `No hay datos disponibles`. Esto se registra como informe agregado pendiente, no como cero indexacion: la inspeccion individual confirma la portada espanola indexada y Sitemaps confirma `27` URLs canonicas descubiertas. No se prueban repetidamente los filtros vacios; se revisara de nuevo cuando Bing termine de poblar la propiedad. |
| IndexNow Insights | `EN_PROCESAMIENTO` | `2026-07-14` | `AMMAC / Codex` | Tras el cambio global de titulos, el CLI valido contra el sitemap exactamente las `27` URLs canonicas y `api.indexnow.org` acepto el lote unico (`IndexNow accepted 27 URL(s)`). No se enviaron rutas privadas, transaccionales, redirigidas o externas. Despues de corregir el H1, se notificaron una sola vez y por separado exactamente las tres canonicas modificadas de reembolsos; IndexNow acepto las `3` URLs. La opcion `IndexAhora` de la interfaz autenticada todavia muestra la introduccion publica y conduce a la guia de implementacion, aunque la [documentacion oficial](https://www.bing.com/webmasters/help/indexnow-0z209wby) sigue describiendo el informe Insights. No se genera otra clave, no se sustituye la verificacion ya desplegada y no se repite ningun lote sin cambios nuevos. Se revisara una vez transcurridas `24-48` horas para comprobar si el informe aparece al procesarse el primer lote. Las transiciones publicas de WordPress se controlan por separado y los borradores nunca se notifican. |
| Recomendaciones | `EN_PROCESAMIENTO` | `2026-07-14` | `AMMAC / Codex` | La vista autenticada muestra `No hay datos disponibles`. No se interpreta como cero incidencias ni se aplican sugerencias genericas; el informe depende del inventario agregado que Bing todavia esta poblando. Se revisara junto con Site Explorer e IndexNow Insights despues del procesamiento inicial. |
| Investigacion de palabras clave | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | `AMMAC / Codex` | Se probaron cuatro consultas con ventana maxima de `6 M`. Para `certificacion montessori` con pais `Mexico`, idioma `Espanol (Estados Unidos)` y todos los dispositivos, la portada de AMMAC aparece en la primera fila, `/diplomados/` en la cuarta y CIMA en la segunda. Para `diplomado montessori` con los mismos filtros, `/diplomados/` aparece primera, la portada sexta y Politecnico Intercontinental segundo; este ultimo ofrece una formacion informal de `3` semanas y `120` horas, por lo que no se trata como equivalente a la formacion profesional por niveles de AMMAC. Con filtros globales, Bing normaliza `curso montessori` a `Cursos montessori`: AMMAC no aparece en el Top 10, dominado por cursos introductorios/gratuitos y organizaciones internacionales. AMMAC tampoco aparece en el Top 10 global de `guia montessori`, cuya intencion es mayoritariamente informativa sobre funciones, perfil y formacion. En las cuatro consultas Bing muestra muestra insuficiente para tendencia y `0` sugerencias relacionadas, preguntas o terminos nuevos; se cierra la herramienta como fuente de volumen y se conserva solo su evidencia competitiva. Search Console queda como fuente principal para medir demanda y para identificar la URL actual antes de crear contenido que pueda canibalizarla. La comparacion tecnica de CIMA verifico `lang=en`, cero H1, cero JSON-LD y descripcion de `264` caracteres, frente al H1, `lang=es-MX`, metadatos concisos y JSON-LD educativo de AMMAC. No se copian textos ni se sustituyen afirmaciones verificables como `RVOE en tramite` por promesas ajenas. |
| Backlinks | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | `AMMAC / Codex` | La pestana especifica de la propiedad aun muestra `No hay datos disponibles`, pero el comparador general de Bing detecta `3` dominios y `33` enlaces: `kalpilli.com` (`21`), `montessorimexico.org` (`11`) e `itinnitus.com` (`1`). Los `6` anclajes son naturales: `Publicaciones` (`21`), `certificacionmontessori.com` (`8`) y cuatro variantes con una referencia cada una. `itinnitus.com` se confirma como pagina personal de autor y se conserva. `asociacionmontessori.com.mx` aun no aparece en Bing, aunque su portada responde `200`, permite rastreo y contiene un enlace HTML directo a la portada de certificacion sin `nofollow`; se registra para la auditoria futura del dominio matriz, no como defecto de este sitio. La autoridad externa independiente sigue siendo una oportunidad futura; no se compran enlaces. |
| Rendimiento de busqueda | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | `AMMAC / Codex` | Linea base inicial de Bing desde `2026-07-12`; las ventanas de `3 M` y `24 M` muestran el mismo inventario, por lo que no se importo historial anterior. Total: `6` impresiones, `0` clics y `0 %` CTR. Paginas: portada `3` impresiones/posicion media `4`, `/diplomados/` `2`/`6` y `/directorio/` `1`/`5`; aun no aparecen URLs EN o PT-BR. Dispositivos: escritorio `4` y movil `2`. Pais: las `6` se agrupan en `El resto del mundo`; la muestra no permite interpretar geografia ni CTR. Consultas visibles: `curso de guia montessori en el olivo` (`2`), `certificacion montessori`, `escuelas montessori en obispado`, `curso de guia montessori ami` y `asociacion montessori de mexico` (`1` cada una). Se monitorea por separado de la linea base de Google y no se cambia contenido con esta muestra minima. |
| Rendimiento de busqueda: 7 dias | `COMPLETADO_CON_EVIDENCIA` | `2026-07-29` | `AMMAC / Codex` | Bing, ventana `7 D` con datos disponibles del `2026-07-22` al `2026-07-27`: `4` clics, `35` impresiones y CTR `11.43 %`. Paginas visibles: portada `10` impresiones/`3` clics, `/diplomados/` `7`/`0`, `/en/` `6`/`0`, `/directorio/` `4`/`1`, `/pt-br/diplomados/` `2`/`0`, `/pt-br/` `2`/`0` e `/inscripcion/pagar/` `1`/`0`. Bing ya genera senales EN y PT-BR, aunque todavia no muestra paginas individuales de programa. Entre las consultas visibles hay demanda en espanol y una consulta en portugues sobre certificacion internacional Montessori. La muestra sigue siendo pequena y no justifica cambios de copy ni solicitudes repetidas. |
| Rendimiento de IA | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | `AMMAC / Codex` | La ventana maxima disponible de `6 M` muestra `0` citas y `0` paginas citadas en las fuentes declaradas por Bing como `Microsoft Copilots and Partners`; no existen consultas ni paginas para desglosar. Se registra como linea base cero, no como error tecnico ni como evidencia sobre ChatGPT. El crecimiento se medira desde esta fecha sin generar contenido o reenvios artificiales para alterar la muestra. |

## Experimento SEO: intención «Guía Montessori»

| Control | Estado | Fecha de evidencia | Evidencia/resultado |
| --- | --- | --- | --- |
| Línea base de Google | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | Search Console, búsqueda Web, últimos 28 días y consulta que contiene `guia montessori`: `200` impresiones, `6` clics, CTR `3 %` y posición media `6,3`. La portada reúne `189` impresiones y los `6` clics; `/diplomados/` reúne `21` impresiones y `0` clics. La consulta exacta `guia montessori` aporta `153` impresiones y `2` clics. Las filas pueden solaparse por la agregación de Search Console. |
| Decisión de intención | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | La portada conserva la intención `Guía Montessori`; no se crea `/guia-montessori/`. `/diplomados/` conserva su intención específica. Se sustituyó la franja genérica por una respuesta localizada sobre el rol de la Guía y el título español pasó a `Certificación de Guía Montessori Online | AMMAC`. |
| Producción e IndexNow | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | Los contratos local y público validaron las tres portadas, un solo H1, H2 localizado, canonicales, `hreflang`, robots y JSON-LD. IndexNow aceptó una sola vez exactamente `/`, `/en/` y `/pt-br/`. No se reenvió el sitemap ni se repitieron solicitudes manuales en Google. |
| Seguimiento | `EN_PROCESAMIENTO` | `2026-07-23`, `2026-08-11`, `2026-10-12` | Control de 7 dias completado en Search Console comparando los ultimos 7 dias con los 7 anteriores para consultas que contienen `guia montessori`: clics `0` frente a `2`, impresiones `41` frente a `58`, CTR `0 %` frente a `3,4 %` y posicion media `6,5` frente a `6,8`. La portada concentro `39` impresiones y `/diplomados/` `4`; no aparecio una tercera URL ni evidencia de canibalizacion. La posicion se mantuvo y la muestra es demasiado pequena para atribuir la caida de clics al cambio. Se conserva el contenido actual y siguen programados los controles de 28 y 90 dias. |

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
| `llms.txt` localizado | `COMPLETADO_CON_EVIDENCIA` | `2026-07-13` | `AMMAC / Codex` | `/llms.txt`, `/en/llms.txt` y `/pt-br/llms.txt` respondieron HTTP `200`; cada respuesta publica coincidio exactamente con su fuente local desplegada. Los tres archivos usan el destino canonico localizado `/{locale}/diplomados/#certificacion_internacional`, no contienen `/certificate/` y se presentan como recursos informativos, no como directivas para crawlers. |
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
