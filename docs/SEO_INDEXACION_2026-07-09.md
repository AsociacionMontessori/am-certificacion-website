# Bitácora de indexación SEO multilingüe

Fecha: 2026-07-09

## Seguimiento 2026-07-11

- `sitemap-index.xml` y `sitemap-0.xml` siguen respondiendo `200` con
  `content-type: application/xml` para visitantes, Googlebot y Bingbot.
- Se detectó que la localización del flujo de pago del 2026-07-10 había añadido
  al sitemap 14 rutas transaccionales EN/PT-BR marcadas como `noindex,follow`.
- Se corrigieron las exclusiones del sitemap para aplicarlas en todos los
  idiomas configurados y se añadió una prueba de regresión.
- El cambio fue desplegado en Firebase Hosting el 2026-07-11.
- Producción vuelve a contener exactamente 27 URLs públicas y ninguna ruta
  `/checkout/` o `/inscripcion/`.
- Google Search Console confirmó el 2026-07-11 que el índice del sitemap se
  procesó correctamente:
  - última lectura mostrada: 2026-07-10;
  - `/sitemap-0.xml`: estado `Correcto`;
  - páginas descubiertas: 27;
  - vídeos descubiertos: 0.
- El informe general de indexación visible el 2026-07-11 tiene datos atrasados,
  con última actualización del 2026-06-29, anterior al SEO multilingüe:
  - 16 páginas conocidas;
  - 6 indexadas;
  - 10 sin indexar;
  - 3 clasificadas como `Página con redirección`;
  - 7 clasificadas como `Rastreada: actualmente sin indexar`.
  Estos números son una línea base histórica y deben revisarse de nuevo cuando
  el informe incorpore el sitemap de 27 URLs leído el 2026-07-10.
- Detalle de las 7 URLs `Rastreada: actualmente sin indexar`, cuyos últimos
  rastreos visibles eran de enero a marzo de 2026:
  - `/certificate` devuelve `301` a
    `/diplomados/#certificacion_internacional`;
  - `/masterclasses` y `/masterclasses/` devuelven `301` directo a
    `/diplomados/`;
  - `/contact`, `/privacy` y `/publicaciones` devuelven `301` a sus URLs
    canónicas con barra final;
  - `/otroscursos` y `/otroscursos/` devolvían incorrectamente `200` con la
    portada debido al rewrite general de Firebase. Se corrigieron el 2026-07-11
    con un `301` directo a `/diplomados/` y se añadió una prueba de regresión.
- Las 7 URLs quedaron verificadas en producción con redirecciones permanentes;
  corresponde iniciar `Validar corrección` en ese motivo de Search Console.
- Google Search Console aceptó `Validar corrección` para el motivo
  `Rastreada: actualmente sin indexar` y muestra `Resultado de la validación:
  iniciada`, con fecha de inicio 2026-07-11. No volver a iniciar la validación
  mientras permanezca en curso; revisar `Ver detalles` en el seguimiento.
- Pendiente de confirmar en los paneles:
  - páginas indexadas y no indexadas en Google;
  - estado actual del sitemap en Bing Webmaster Tools;
  - texto exacto de cada aviso en las tarjetas SEO y Marcado de Bing.

## Objetivo

Dejar indexables las versiones públicas en español, inglés y portugués brasileño para captar clientes de habla hispana, inglesa y portuguesa.

## Estado actual

- Google Search Console: `sitemap-index.xml` fue añadido, pero el estado inicial apareció como "No se ha podido obtener".
- Google Search Console: se solicitó indexación manual para URLs prioritarias; algunas ya estaban en Google.
- Bing Webmaster Tools: la propiedad fue importada desde Google Search Console.
- Bing Webmaster Tools: los datos e informes quedaron en procesamiento, con aviso de hasta 48 horas.
- Bing Webmaster Tools: `https://certificacionmontessori.com/sitemap-index.xml` aparece en estado "Procesando".
- Bing URL Inspection: se enviaron URLs prioritarias a indexación.
- Bing mostró avisos de SEO/geo que deben revisarse y documentarse con captura o texto exacto.

Seguimiento Bing 2026-07-11:

- `sitemap-index.xml` cambió a `Procesado con éxito`.
- La pantalla muestra `Última tramita: 7/9/2026`.
- El índice todavía muestra una expansión incompleta: 0 sitemaps descubiertos y
  1 URL descubierta.
- Acción siguiente: usar `Re-presentación` después del despliegue del 2026-07-11
  y, si la expansión sigue incompleta, enviar directamente `sitemap-0.xml`, que
  contiene las 27 URLs canónicas públicas.
- Se usó `Re-presentación` el 2026-07-11 y Bing cambió el estado a
  `Procesamiento`. Los contadores permanecen temporalmente en 0 sitemaps y 1
  URL porque todavía muestran la lectura anterior. No volver a pulsar
  `Re-presentación` mientras esté procesando; enviar también `sitemap-0.xml`
  como sitemap directo.

## Evidencia técnica en producción

Verificado el 2026-07-09:

- `https://certificacionmontessori.com/sitemap-index.xml` responde `200`.
- `https://certificacionmontessori.com/sitemap-index.xml` sirve `content-type: application/xml`.
- `https://certificacionmontessori.com/sitemap-0.xml` responde `200`.
- `https://certificacionmontessori.com/sitemap-0.xml` sirve `content-type: application/xml`.
- `https://certificacionmontessori.com/robots.txt` declara:

```txt
Sitemap: https://certificacionmontessori.com/sitemap-index.xml
```

El sitemap publicado contiene 27 URLs públicas indexables:

- Home, diplomados, contacto, directorio, IA, publicaciones, privacidad, reembolsos y Roxana.
- Versiones equivalentes en raíz español, `/en/` inglés y `/pt-br/` portugués brasileño.

## URLs prioritarias enviadas

```txt
https://certificacionmontessori.com/en/
https://certificacionmontessori.com/pt-br/
https://certificacionmontessori.com/en/diplomados/
https://certificacionmontessori.com/pt-br/diplomados/
https://certificacionmontessori.com/diplomados/
https://certificacionmontessori.com/
```

## Diagnóstico del estado "No se ha podido obtener" en Google

La evidencia técnica apunta a que el sitemap sí está disponible. Si Search Console muestra "No se ha podido obtener" justo después de enviarlo, puede ser un estado temporal de procesamiento.

Acción recomendada:

1. Esperar 24 horas sin reenviar muchas veces.
2. Revisar si cambia a "Correcto" o "Success".
3. Si sigue igual después de 48 horas, eliminar ese sitemap en Search Console y volver a añadir exactamente:

```txt
sitemap-index.xml
```

4. Si persiste, probar añadiendo directamente:

```txt
sitemap-0.xml
```

## Pendientes para pulido SEO/geo

- Dejar Google Search Console al 100%:
  - sitemap procesado correctamente.
  - cobertura/indexación sin errores importantes.
  - URLs prioritarias inspeccionadas y validadas.
  - páginas EN/PT-BR reconocidas con canonical propio y `hreflang`.
  - datos estructurados sin errores.
  - Core Web Vitals y experiencia de página revisados.
  - consultas, países, idiomas y páginas de destino monitoreados por mercado.
- Guardar el texto exacto o captura de los avisos SEO/geo de Bing.
- Revisar si Bing pide `geo.region`, `geo.placename`, dirección, idioma o targeting regional.
- Revisar títulos y metadescripciones por intención de búsqueda:
  - español: "certificación Montessori", "diplomado Montessori", "guía Montessori".
  - inglés: "online Montessori certification", "Montessori guide training", "Montessori diploma course".
  - portugués: "certificação Montessori online", "curso de formação Montessori", "guia Montessori".
- Evaluar schema por idioma para `EducationalOrganization`, `EducationalOccupationalProgram` y `Course`.
- Revisar si los datos estructurados deben declarar `availableLanguage` en `es`, `en` y `pt-BR`.
- Revisar señales regionales sin encerrar el sitio solo en México, porque el objetivo es internacional.
- Medir cobertura en Search Console por rutas:
  - `/en/`
  - `/pt-br/`
  - `/diplomados/`
- Medir cobertura en Bing Webmaster Tools cuando termine el procesamiento.
- Preparar una tabla de keywords por idioma y página de destino.
- Añadir seguimiento de conversiones por idioma si todavía no está separado en Analytics.

## Revisión recomendada

- 2026-07-10: revisar estado de sitemap en Google Search Console.
- 2026-07-11: revisar si Google resolvió "No se ha podido obtener".
- 2026-07-11: revisar Google Search Console completo: indexación, experiencia, mejoras, datos estructurados, rendimiento internacional y páginas por idioma.
- 2026-07-11: revisar informes de Bing después de las 48 horas.
- 2026-07-12: documentar avisos SEO/geo y corregirlos en código si aplican.
