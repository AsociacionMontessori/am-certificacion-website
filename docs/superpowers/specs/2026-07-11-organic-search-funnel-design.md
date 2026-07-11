# Diseño del embudo orgánico multilingüe de AMMAC

**Fecha:** 2026-07-11

**Estado:** aprobado para planificación

**Ámbito:** `certificacionmontessori.com` y `montessorimexico.org`

## 1. Resumen

Este proyecto coordina el sitio comercial `certificacionmontessori.com` y el
sitio editorial `montessorimexico.org` para atraer tráfico orgánico cualificado
y convertirlo en conversaciones sobre formación Montessori.

`montessorimexico.org` conservará la propiedad canónica de los artículos y la
autoridad editorial. `certificacionmontessori.com` concentrará las páginas de
programas, la información institucional y las conversiones. Los dos dominios
se comunicarán mediante enlaces contextuales medibles, sin duplicar artículos
ni manipular canonicals entre dominios.

El español es el idioma prioritario. Inglés y portugués brasileño tendrán la
misma cobertura técnica y comercial, con contenido realmente localizado. El
objetivo de negocio principal es iniciar una conversación cualificada por
WhatsApp o formulario; los clics se medirán por separado de las conversaciones
reales.

## 2. Contexto y estado actual

### 2.1 Proyectos

- Frontend Gatsby/Firebase:
  `/home/carlos/Documentos/Repositorios/certificacionMontessori`.
- Automatización editorial Python/WordPress:
  `/home/carlos/montessori-blog-automation`.
- Sitio comercial: `https://certificacionmontessori.com/`.
- Sitio editorial y WordPress: `https://montessorimexico.org/`.

### 2.2 Estado técnico conocido

- El sitemap comercial contiene actualmente 27 URLs públicas: nueve páginas
  lógicas en español, inglés y portugués brasileño.
- Google Search Console procesó correctamente `sitemap-index.xml` y
  `sitemap-0.xml`. La validación de las antiguas URLs rastreadas sin indexar
  comenzó el 2026-07-11 y no debe reiniciarse mientras esté en curso.
- Bing Webmaster Tools tiene importada la propiedad. El índice y el sitemap
  hijo están enviados; se debe esperar a que termine su procesamiento sin
  presentaciones manuales repetidas.
- Las rutas antiguas `/otroscursos` y `/masterclasses` ya redirigen directamente
  a `/diplomados/`.
- El sitio comercial ya genera canonical, `hreflang`, metadatos sociales y
  JSON-LD localizado mediante `src/components/seo.js`.
- `/publicaciones/` integra actualmente el blog completo mediante un iframe y
  muestra antes una sección amplia de libros.
- WordPress expone su REST API pública y usa AIOSEO. La automatización crea
  borradores, aplica controles SEO, agrega imágenes y notifica por Telegram.
- Los dos sitios usan propiedades GA4 diferentes. Montessori México utiliza
  actualmente MonsterInsights y el sitio comercial tiene su propia etiqueta.
- El token de Telegram expuesto en logs rotados ya fue revocado y sustituido en
  `.env`; todavía se debe sanear el historial local y prevenir nuevas fugas.

El detalle operativo de Search Console y Bing se mantiene en
`docs/SEO_INDEXACION_2026-07-09.md`.

## 3. Objetivos

1. Hacer que el 100 % de las URLs públicas previstas sean técnicamente
   rastreables, indexables, canónicas y coherentes entre idiomas.
2. Mejorar el posicionamiento orgánico para búsquedas de formación y
   certificación como Guía Montessori, con énfasis en español.
3. Dar cobertura equivalente a hablantes de inglés y portugués brasileño.
4. Convertir la autoridad editorial de Montessori México en visitas relevantes
   a las páginas de formación sin degradar la credibilidad de los artículos.
5. Sustituir el iframe de `/publicaciones/` por una integración nativa, rápida y
   accesible que muestre primero los artículos y conserve todos los libros y
   enlaces de compra actuales.
6. Medir el recorrido completo desde artículo o búsqueda hasta programa, clic
   de contacto y cliente potencial cualificado.
7. Mejorar el descubrimiento en Google, Bing, ChatGPT Search y otros sistemas
   mediante SEO técnico estándar, contenido útil y protocolos admitidos.
8. Mantener la automatización segura, observable y resistente a fallos de
   servicios secundarios.

## 4. Fuera de alcance

- Migrar artículos completos de Montessori México al dominio comercial.
- Cambiar la propiedad canónica de los artículos de WordPress.
- Reestructurar todavía el ecosistema completo de
  `asociacionmontessori.com.mx`, `asociacionmontessori.mx`, `kalpilli.com`,
  `kalpilli.mx` y `montessorikalpilli.edu.mx`.
- Implementar CRM, WhatsApp Business API o calificación automática de clientes
  potenciales.
- Campañas pagadas, Meta/Facebook, automatización de redes sociales, email
  marketing, remarketing, colaboraciones o alianzas comerciales.

El último grupo constituye un proyecto posterior. Se diseñará cuando este
embudo tenga medición fiable y una línea base orgánica suficiente para decidir
dónde invertir.

## 5. Definición de éxito

### 5.1 "Al 100 %"

El 100 % se refiere a los factores controlables:

- respuesta HTTP correcta;
- permiso de rastreo;
- ausencia de `noindex` accidental;
- canonical coherente;
- `hreflang` recíproco;
- inclusión correcta en sitemap;
- enlaces internos rastreables;
- contenido visible y útil;
- datos estructurados fieles al contenido;
- medición comprobada;
- ausencia de errores técnicos conocidos.

Google, Bing y los sistemas de IA deciden finalmente qué rastrean, indexan y
muestran. Por ello, la inclusión o posición de todas las URLs no se presenta
como una garantía.

### 5.2 Indicadores de negocio

- KPI principal: conversaciones cualificadas sobre formación Montessori.
- Indicadores previos: impresiones orgánicas, clics no relacionados con la
  marca, visitas a programa, clics de CTA, clics de WhatsApp y formularios
  enviados.
- Segmentos obligatorios: idioma, país, programa, página de entrada, artículo
  de origen y posición del CTA.
- Comparación operativa semanal y análisis de rendimiento en ventanas de 28 y
  90 días.

## 6. Arquitectura y responsabilidades

### 6.1 Separación de dominios

`montessorimexico.org` es responsable de:

- artículos, categorías, autores y archivos editoriales;
- canonical de cada artículo;
- señales de experiencia, fuentes y actualización;
- clasificación editorial y enlaces contextuales hacia formación;
- notificación IndexNow cuando un contenido público se crea, actualiza o
  elimina.

`certificacionmontessori.com` es responsable de:

- páginas institucionales y comerciales;
- páginas de programas en los tres idiomas;
- catálogo y venta de libros ya existentes;
- integración visual de artículos recientes;
- WhatsApp, formularios, inscripción y medición de conversión;
- sitemap, `hreflang`, schemas comerciales y notificación de cambios públicos.

### 6.2 Flujo principal

```text
fuente editorial
  -> automatización genera borrador
  -> clasificación cerrada de tema y relevancia
  -> ruta configurada + CTA medible, si corresponde
  -> revisión humana y publicación en WordPress
  -> IndexNow recibe únicamente la URL pública
  -> lector visita la página de programa apropiada
  -> GA4 registra el recorrido entre dominios
  -> WhatsApp o formulario inicia el contacto
  -> calificación real se registra fuera de GA4
```

El modelo generativo no construirá URLs. Solo podrá devolver valores de enums
predefinidos. Un router determinista resolverá el destino final.

## 7. Sitio comercial

### 7.1 Arquitectura de páginas

`/diplomados/` seguirá siendo el hub para la intención amplia "formación o
certificación Montessori". Se añadirán cinco páginas específicas basadas en el
catálogo real `src/data/programasOferta.js`:

- `/diplomados/nido-comunidad-infantil/`
- `/diplomados/casa-de-ninos/`
- `/diplomados/taller-i-ii/`
- `/diplomados/educacion-cosmica/`
- `/diplomados/neuroeducacion/`

Gatsby aplicará el patrón actual de prefijos:

- español: sin prefijo;
- inglés: `/en/` antes de la ruta;
- portugués brasileño: `/pt-br/` antes de la ruta.

Las cinco páginas producirán 15 URLs nuevas. Con el inventario actual, el
sitemap público esperado pasará de 27 a 42 URLs.

Cada página debe tener:

- título, H1, descripción y contenido propios para una intención concreta;
- versión localizada completa, no una mezcla de idiomas;
- canonical hacia sí misma;
- conjunto recíproco idéntico de `hreflang` `es`, `en`, `pt-BR` y `x-default`;
- `x-default` dirigido a la variante española equivalente;
- información visible derivada del catálogo real, sin duplicar precios o
  promociones en fuentes de datos paralelas;
- audiencia, modalidad, duración, plan de formación, requisitos, docentes,
  certificación, preguntas frecuentes visibles y CTA correspondiente;
- enlaces jerárquicos entre inicio, hub y programa, sin bloques de texto
  duplicados entre páginas.

Las traducciones comerciales se revisarán por una persona antes del despliegue;
ninguna variante se publicará con texto parcial, automático sin revisar o
afirmaciones distintas de la oferta original.

La portada mantendrá la intención de marca y oferta general; el hub cubrirá la
categoría; cada hija cubrirá únicamente su programa. Esta distribución reduce
la canibalización.

### 7.2 Nueva `/publicaciones/`

El iframe será eliminado. La página conservará un hero compacto y usará dos
pestañas accesibles:

- `Artículos`, activa por defecto y vinculable mediante `#articulos`;
- `Libros AMMAC`, secundaria y vinculable mediante `#libros`.

Requisitos:

- La primera pantalla después del hero mostrará artículos, no libros.
- El HTML inicial contendrá una instantánea de hasta 12 artículos publicados,
  obtenida desde WordPress en la construcción.
- En el navegador se intentará refrescar esa lista desde la REST API para
  mostrar publicaciones más recientes sin requerir un despliegue diario.
- Si WordPress no responde, se conservará la instantánea y un enlace "Ver todos
  los artículos" llevará al blog.
- Cada tarjeta mostrará título, extracto limpio, fecha, autor, imagen si existe
  y una indicación visible de que el artículo está en español en las interfaces
  inglesa y portuguesa.
- Las tarjetas siempre enlazarán al artículo canónico de Montessori México. No
  se crearán copias ni canonicals cruzados.
- Los libros conservarán sus datos, portadas, enlaces de Amazon y demás ofertas
  actuales desde las fuentes de datos existentes.
- Habrá invitaciones discretas entre ambas vistas, sin insertar tarjetas dentro
  de tarjetas ni hacer que los libros opaquen los artículos.
- Ambas colecciones y sus JSON-LD estarán presentes en el HTML inicial aunque
  la interfaz muestre una pestaña a la vez.
- Las pestañas funcionarán con teclado, roles y estados ARIA correctos, foco
  visible y dimensiones estables en móvil y escritorio.

### 7.3 Datos estructurados

El sitio emitirá un grafo enlazado con identificadores `@id` estables:

- `Organization` para Asociación Montessori de México A.C.;
- `Person` para perfiles públicos y autores con información verificable;
- `Course` para cada programa;
- `CourseInstance` solo cuando fechas, modalidad y demás datos estén visibles y
  vigentes;
- `BreadcrumbList` para hub y páginas hijas;
- `ItemList` para las colecciones de artículos y libros;
- `Book` para cada libro con datos visibles y destino real.

No se incluirán precios dinámicos, reseñas, calificaciones, disponibilidad o
credenciales que no estén visibles y verificadas. Los artículos conservarán su
schema `Article` en WordPress; el dominio comercial no se declarará autor ni
editor de copias inexistentes.

## 8. Automatización editorial

### 8.1 Contrato de clasificación

Cada borrador tendrá una salida estructurada validada con estos valores:

```text
intent:
  nido | casa | taller | cosmica | neuro | general_training | editorial

commercial_relevance:
  high | medium | low
```

El clasificador puede proponer esos dos valores, pero no una URL. Una tabla de
configuración versionada resolverá el destino:

| Intent | Destino comercial |
| --- | --- |
| `nido` | `/diplomados/nido-comunidad-infantil/` |
| `casa` | `/diplomados/casa-de-ninos/` |
| `taller` | `/diplomados/taller-i-ii/` |
| `cosmica` | `/diplomados/educacion-cosmica/` |
| `neuro` | `/diplomados/neuroeducacion/` |
| `general_training` | `/diplomados/` |
| `editorial` | sin destino comercial |

Una salida ausente, inválida o contradictoria se degradará a `editorial/low` y
no generará CTA. El idioma del artículo decidirá el prefijo de destino; los
artículos españoles usarán la URL española.

### 8.2 Política de enlaces y CTA

- Relevancia alta: un enlace contextual dentro del artículo y un bloque final
  de formación; WhatsApp será una acción secundaria.
- Relevancia media: un único enlace contextual natural, sin bloque final ni
  WhatsApp promocional.
- Relevancia baja: ningún CTA comercial.
- No se insertará más de una promoción final por artículo.
- Los anchors describirán el destino y variarán de forma natural; no repetirán
  palabras clave de manera mecánica.
- Las recomendaciones institucionales actuales podrán permanecer, pero no
  duplicarán el CTA del mismo destino.

La URL de destino añadirá:

```text
utm_source=montessorimexico.org
utm_medium=referral
utm_campaign=guia_montessori
utm_content=post_<16-hex-sha256-del-slug>
utm_term=<intent>
```

`utm_content` nunca expondrá el slug: será `post_` más los primeros 16
caracteres hexadecimales minúsculos del SHA-256 de los bytes UTF-8 del slug.

El mensaje prellenado de WhatsApp puede incluir programa y artículo de origen,
pero su texto completo y los datos del usuario nunca se enviarán a GA4.

### 8.3 Calidad editorial

- Todos los resultados seguirán siendo borradores sujetos a revisión humana.
- La frecuencia diaria será un objetivo operativo, no una excepción a los
  controles de calidad.
- El pipeline rechazará salidas sin aportación útil, fuentes insuficientes,
  afirmaciones no respaldadas o similitud excesiva con títulos y temas
  recientes.
- La aportación original de AMMAC, la experiencia de autores identificados y
  las referencias deben distinguir el artículo de un resumen genérico.
- La automatización no creará páginas o artículos repetitivos para cubrir cada
  variante posible de una consulta.

### 8.4 Publicación e IndexNow

Crear un borrador no notificará a ningún buscador. IndexNow se ejecutará desde
WordPress únicamente después de que el estado sea público y también en cambios
o eliminaciones posteriores. Se preferirá una integración mantenida para
WordPress y se verificará que envíe el permalink final, no `?p=<id>`.

## 9. Medición y atribución

### 9.1 Arquitectura GA4

La propiedad del sitio comercial será la fuente de verdad del embudo y recibirá
datos de ambos dominios con medición entre dominios. La propiedad editorial
actual de Montessori México se conservará para no perder su histórico.

La implementación deberá:

- cargar la propiedad compartida una sola vez por página en ambos dominios;
- conservar la propiedad editorial existente sin duplicar `page_view` dentro
  de la misma propiedad;
- configurar el enlazador entre ambos dominios;
- conservar UTM explícitas como respaldo legible;
- auditar MonsterInsights y las etiquetas Gatsby antes de activar la medición;
- comprobar la atribución en tiempo real y DebugView.

### 9.2 Eventos

| Evento | Momento |
| --- | --- |
| `click_article` | salida desde `/publicaciones/` al artículo canónico |
| `view_program` | una vez al cargar una ruta específica de programa, después de inicializar la medición permitida |
| `click_program_cta` | CTA de programa, incluido el originado en un artículo |
| `click_whatsapp` | intento de abrir WhatsApp |
| `generate_lead` | formulario enviado y aceptado correctamente |
| `click_amazon` | salida hacia una ficha de libro en Amazon |
| `begin_checkout` | inicio comprobado de la inscripción o compra |
| `purchase` | confirmación real del pago, cuando exista una fuente fiable |

Parámetros comunes:

- `language`;
- `program_id`;
- `source_hostname`;
- `source_content_id` (formato exacto `^post_[0-9a-f]{16}$`);
- `landing_path`;
- `cta_position`;
- `lead_channel`.

No se enviarán nombres, correos, teléfonos, mensajes, direcciones ni otra
información personal a GA4.

La carga de analítica respetará la política de privacidad y el consentimiento
aplicable en cada mercado. La medición opcional nunca será un requisito para
navegar, consultar programas o contactar a AMMAC.

### 9.3 Niveles de conversión

1. Interés: visita a una página de formación.
2. Intención: clic en WhatsApp o formulario aceptado.
3. Cliente potencial cualificado: conversación real revisada manualmente o por
   un futuro CRM/WhatsApp Business API.

`click_whatsapp` no se reportará como conversación ni como cliente potencial
cualificado.

## 10. SEO técnico, buscadores e IA

### 10.1 Rastreo e indexación

- Cada sitemap contendrá únicamente URLs absolutas, HTTPS, canónicas,
  indexables y con respuesta `200`.
- Redirecciones, 404, checkout, inscripción y páginas privadas no aparecerán en
  el sitemap.
- Cada variante localizada se enlazará a sí misma y a las otras variantes con
  el mismo conjunto recíproco de `hreflang`.
- La navegación y el contenido principal estarán disponibles en HTML estático.
- Las páginas transaccionales seguirán accesibles para las personas, pero se
  mantendrán fuera del índice mediante `noindex,follow` cuando no aporten una
  intención de búsqueda independiente. Los crawlers podrán leer esa directiva;
  no se intentará conseguir el mismo resultado bloqueándolas solo en
  `robots.txt`.
- Las redirecciones antiguas serán de un solo salto y sus URLs no se volverán a
  incluir en enlaces internos o sitemaps.

### 10.2 Robots y sistemas de IA

- `Googlebot`, `Bingbot` y `OAI-SearchBot` podrán acceder al contenido público.
- `GPTBot` se permitirá inicialmente por la decisión de máxima difusión, pero
  tendrá una regla separada para poder cambiar esa política sin afectar la
  presencia en ChatGPT Search.
- `ChatGPT-User` no se bloqueará deliberadamente.
- `User-agent: *` permitirá por defecto el contenido público y las exclusiones
  se limitarán a rutas que realmente lo requieran.
- `llms.txt` y sus variantes localizadas se conservarán como documentación
  complementaria para sistemas que decidan usarlas. No se tratarán como un
  factor de posicionamiento en Google.

La estrategia denominada GEO se basará en el mismo fundamento que el SEO:
contenido original, autoría clara, estructura técnica, acceso al HTML,
entidades coherentes y referencias verificables. No se crearán archivos,
schemas o textos artificiales solo para simular optimización para IA.

### 10.3 IndexNow

- WordPress notificará URLs públicas en creación, actualización y eliminación.
- El sitio comercial notificará únicamente URLs públicas modificadas después
  de un despliegue exitoso.
- Cada dominio alojará su archivo público de verificación IndexNow en la
  `keyLocation` requerida. Esa clave es pública por diseño y se mantendrá
  separada de tokens y credenciales reales.
- Fallos temporales usarán reintentos limitados y no bloquearán publicación o
  despliegue.
- La recepción se verificará en Bing Webmaster Tools; no se interpretará como
  garantía de indexación.

## 11. Resiliencia y manejo de errores

- Fallo de WordPress durante build: usar la última instantánea válida y no
  dejar vacía `/publicaciones/`.
- Fallo de WordPress en navegador: mantener el HTML inicial y el enlace al blog.
- Respuesta REST incompleta: descartar solo el elemento inválido y conservar los
  demás; nunca renderizar HTML no saneado.
- Clasificación editorial inválida: publicar el borrador sin CTA comercial.
- Fallo de GA4: preservar navegación, formularios y WhatsApp.
- Fallo de Telegram: registrar de forma segura y mantener el borrador creado.
- Fallo de IndexNow: reintentar con límite, registrar el estado y mantener el
  contenido público.
- Fallo de schema: impedir el despliegue si la fuente es controlada por el
  repositorio; no inventar datos para completar propiedades.

Los clientes de WordPress, analítica, Telegram e IndexNow serán módulos
separados con contratos pequeños para poder probarlos y sustituirlos de forma
independiente.

## 12. Seguridad de secretos y logs

1. Sanear o eliminar los logs locales rotados que contienen el token revocado.
2. Cambiar la regla de Git para ignorar todo el contenido de `logs/`, incluidos
   sufijos como `.log.1` y `.log.2`.
3. Evitar que `httpx` registre URLs completas de servicios autenticados; usar
   nivel de log reducido o un filtro de redacción.
4. Mantener `.env`, tokens y credenciales reales fuera de Git. El archivo
   público de verificación IndexNow se documentará explícitamente para que no
   se confunda con un secreto.
5. Validar variables obligatorias al iniciar sin imprimir sus valores.
6. Añadir una comprobación automatizada que detecte patrones de tokens en
   archivos rastreables y salida de pruebas.
7. Mantener la notificación Telegram en modo no bloqueante y sin datos
   personales.

## 13. Estrategia de pruebas

### 13.1 Automatización editorial

- Tests unitarios para todos los enums, tabla de rutas, localización y UTM.
- Casos de relevancia alta, media, baja, salida inválida y tema ambiguo.
- Verificación de máximo de CTA y ausencia de URL generada por el modelo.
- Pruebas con WordPress, Telegram e IndexNow simulados, incluidos timeouts,
  respuestas parciales y límites de reintento.
- Escaneo de logs y repositorio para confirmar que no aparece ningún secreto.

### 13.2 Gatsby y SEO

- Build completo en los tres idiomas.
- Test de las 42 URLs públicas esperadas y de la ausencia de rutas
  transaccionales o redirigidas en sitemap.
- Rastreo de cada URL: estado `200`, canonical propia, robots indexable,
  `hreflang` recíproco y enlaces internos válidos.
- Validación sintáctica y semántica del JSON-LD.
- Test del cliente WordPress con instantánea válida, API caída y datos
  incompletos.
- Verificación de que los enlaces a artículos conservan la URL canónica de
  WordPress y que los enlaces de libros existentes no se pierden.

### 13.3 Interfaz, accesibilidad y rendimiento

- Capturas y pruebas de `/publicaciones/` en escritorio y móvil.
- Artículos visible por defecto; `#libros` abre libros y `#articulos` abre
  artículos.
- Navegación por teclado, foco, roles, nombres accesibles y ausencia de
  solapamientos o cambios de tamaño inesperados.
- Imágenes con dimensiones, texto alternativo y carga adecuada.
- Medición de Core Web Vitals y comprobación de que la eliminación del iframe
  no introduce regresiones.
- Objetivo de campo en el percentil 75 cuando haya datos suficientes: LCP no
  mayor de 2.5 segundos, INP no mayor de 200 milisegundos y CLS no mayor de
  0.1; mientras no haya muestra de campo, se usarán pruebas de laboratorio y
  comparación contra la línea base.

### 13.4 Producción

- Smoke test HTTP tras el despliegue.
- Rich Results Test o validación equivalente de las páginas representativas.
- GA4 Realtime/DebugView sin información personal.
- Inspección de sitemap, robots, canonical y `hreflang` desde producción.
- Revisión en Search Console y Bing a las 48 horas, 7 días y 28 días sin
  reenvíos repetitivos durante el procesamiento.

## 14. Despliegue y reversión

### Fase 1: base segura y medible

- Sanear logs y endurecer la configuración de secretos.
- Crear pruebas de regresión y registrar la línea base de GA4, Search Console y
  Bing.
- Auditar etiquetas antes de habilitar medición entre dominios.

### Fase 2: automatización editorial

- Añadir contrato de clasificación, router, CTA y UTM.
- Probar únicamente con borradores revisables.
- Configurar IndexNow en el evento real de publicación.

### Fase 3: publicaciones nativas

- Implementar cliente WordPress, instantánea y fallback.
- Sustituir el iframe por pestañas Artículos/Libros.
- Conservar catálogo y destinos de compra.

### Fase 4: páginas comerciales multilingües

- Crear las cinco páginas y sus tres variantes.
- Añadir schema, navegación, CTA y eventos.
- Validar sitemap, canonical y `hreflang` antes de desplegar.

### Fase 5: producción y observación

- Desplegar después de build y pruebas completas.
- Enviar cambios a IndexNow después del éxito.
- Presentar el sitemap una sola vez si su ubicación no cambia; los buscadores
  volverán a leerlo.
- Observar 48 horas, 7 días, 28 días y 90 días.

La automatización tendrá una opción de configuración para desactivar CTA e
IndexNow sin detener la creación de borradores. El frontend podrá volver al
último despliegue Firebase válido. La instantánea permitirá conservar artículos
visibles durante una caída de WordPress.

## 15. Criterios de aceptación

El proyecto estará implementado cuando:

1. Las pruebas cubran las 42 URLs públicas y todas pasen los controles de
   estado, canonical, idioma, `hreflang`, robots y sitemap.
2. `/publicaciones/` muestre artículos primero, conserve los libros y enlaces
   existentes, funcione sin iframe y tenga fallback comprobado.
3. Cada programa real tenga una página propia en los tres idiomas sin contenido
   mezclado ni claims no verificados.
4. Un artículo de relevancia alta reciba el destino correcto y atribución; uno
   medio reciba solo un enlace; uno bajo no reciba promoción.
5. Ningún modelo pueda inventar una URL comercial.
6. Los eventos crucen dominios sin duplicación ni información personal.
7. Los fallos de Telegram, IndexNow, GA4 o refresco de WordPress no interrumpan
   los flujos principales.
8. No queden tokens en logs o archivos rastreables y los logs futuros estén
   redactados.
9. Google Search Console y Bing acepten los sitemaps sin errores técnicos; su
   decisión posterior de indexación se siga como métrica, no como garantía.
10. La documentación operativa explique cómo revisar eventos, sitemaps,
    IndexNow, logs y estados de procesamiento.

## 16. Proyecto posterior: marketing multicanal

Cuando este proyecto haya producido al menos una ventana fiable de 28 días, e
idealmente una de 90 días, se abrirá un diseño separado que evalúe:

- Meta/Facebook e Instagram, Pixel y Conversion API;
- calendario y automatización de redes sociales;
- captación y nutrición por correo;
- CRM y seguimiento de conversaciones;
- Google Ads, Microsoft Ads y campañas de pago en redes;
- remarketing con consentimiento adecuado;
- colaboraciones con escuelas, guías, instituciones y medios;
- programa de referidos, webinars y contenidos descargables;
- atribución de coste por cliente potencial cualificado y por inscripción.

No se elegirán canales pagados únicamente por alcance. La selección se basará
en la conversión orgánica observada por idioma, país, programa y contenido.

## 17. Referencias oficiales

- Google, sitemaps:
  <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- Google, páginas localizadas y `hreflang`:
  <https://developers.google.com/search/docs/specialty/international/localized-versions>
- Google, canonical:
  <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Google, búsqueda generativa:
  <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
- Bing, IndexNow:
  <https://www.bing.com/webmasters/help/indexnow-0z209wby>
- OpenAI, rastreadores:
  <https://developers.openai.com/api/docs/bots>
