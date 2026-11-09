# Programación vigente desde el 9 de noviembre de 2026

Esta sección sustituye las ventanas de lanzamiento/vista temporal descritas en
el historial inferior. Autorización: Carlos, 9/nov/2026.

- Campaña actual activa sin interrupción desde 9/nov 16:40 CDMX hasta el final
  del 17/nov (18/nov 00:00 exclusivo). La vista temporal ya no caduca a las 17:10.
- Misma oferta cada tres meses desde febrero de 2027: **9–15 de febrero,
  mayo, agosto y noviembre**, siete días completos, hora CDMX; se repite cada
  año hasta cambiar esta programación. Apertura 00:00 del 9, cierre exclusivo
  00:00 del 16. Anclaje trimestral al día 9 de la campaña actual.
- Campañas futuras se llaman **Promoción trimestral**, incluso en noviembre;
  no se atribuyen fechas oficiales de Buen Fin a años futuros. Encabezados,
  condiciones y mensajes WhatsApp se calculan para la campaña activa.
- Precios, libros y programas elegibles conservados; no se altera Stripe.
- Paleta tomada de tailwind.config.js: turquesa #0097B2, verde #7ED957,
  naranja #EC6A3D, texto #40424B y botones/precios #00758A (contraste sobre blanco).
- Se reutiliza el hook con reloj del servidor: sin nueva dependencia, cron ni
  estación de trabajo encendida. Calendario trimestral calculado para año actual
  y siguiente, por lo que cruza diciembre sin nuevo despliegue.

## Calendario de inscripciones 2027

Carlos corrigió expresamente el 27/enero al **sábado 30/enero**: último sábado
cada mes, enero a noviembre, sin omitir marzo ni julio. Fuente única:
`src/data/diplomadosCalendario.js`. Fechas históricas de 2026 conservadas.
Las nuevas fechas son apertura de inscripción a las 00:00 CDMX, no horario de
clase. En portada aparece el calendario desplegable completo; el contador y el
catálogo avanzan automáticamente y cambian la etiqueta a apertura de inscripción
para las fechas 2027. Traducciones en español, inglés y portugués.

| Mes 2027 | Sábado |
|---|---|
| Enero | 30 |
| Febrero | 27 |
| Marzo | 27 |
| Abril | 24 |
| Mayo | 29 |
| Junio | 26 |
| Julio | 31 |
| Agosto | 28 |
| Septiembre | 25 |
| Octubre | 30 |
| Noviembre | 27 |

Pruebas: `node scripts/test-buen-fin.js` y
`node scripts/test-diplomados-calendario.js`, además de build/SEO/programas y
QA navegador con reloj interceptado (solo en pruebas). El PDF se guarda en
`output/pdf/Calendario_Inscripciones_AMMAC_2027.pdf` y se entrega a Carlos.

---
# Historial anterior (vigencias sustituidas por la sección superior)

# Buen Fin 2026 — campaña web AMMAC

## Alcance autorizado

Tres promociones, gestionadas exclusivamente por el WhatsApp institucional existente:

- Guía individual: inscripción $3,900 MXN + dos libros (habitual $4,900).
- Dos personas: inscripción $3,500 MXN por persona + dos libros para cada una;
  ambas inscripciones y pagos deben completarse durante la vigencia.
- Neuroeducación: $4,500 MXN con inscripción incluida + dos libros.

Colegiaturas, Stripe, portal de alumnos y Educación Cósmica no se modifican.
Libros, formato y entrega se acuerdan por WhatsApp, sin inventar títulos ni envío
incluido. Los botones abren mensajes prellenados; el sitio no envía mensajes solo.

## Vigencia automática

13 de noviembre 2026 00:00 hasta 18 de noviembre 2026 00:00 **exclusivo**,
America/Mexico_City (UTC-06:00). Equivalente UTC: 13/11 06:00 a 18/11 06:00.
Fechas contrastadas el 9/11 en:
https://www.eleconomista.com.mx/empresas/buen-2026-fechas-duracion-sorteo-debes-20260831-831116.html

`src/data/buenFin2026.js` contiene el intervalo y las ofertas.
`useBuenFin` solicita HEAD de `/buen-fin-clock.txt` con caché deshabilitada y
parámetro único; toma Date + Age del hosting, no el reloj del visitante. Antes de
conocer la fecha, ante error o fuera de vigencia, no renderiza promociones. Se
revalida cada minuto y al recuperar foco/visibilidad. Un temporizador realiza
el cambio en los límites, incluida una pestaña que permanezca abierta.
No depende de cron, la computadora del operador ni un despliegue en la fecha.
El HTML estático nunca contiene la promoción visible; requiere JavaScript y la
respuesta de hora del hosting. No hay parámetro público que fuerce activación.
La vigencia de un pago se confirma por el equipo de WhatsApp, no por este banner.

Se muestra en portada, diplomados y las cuatro fichas elegibles (la de
Neuroeducación solo muestra su oferta; las de Guía muestran las dos de Guía).
En traducciones se conserva el bloque español con atributo `lang="es"` y MXN.

## Verificación y operación

- `node scripts/test-buen-fin.js`: límites exactos, año, zona, Date/Age, precios.
- `npm run test:foundation`, build, SEO construido, programas y publicaciones.
- QA Playwright CLI en `output/playwright/`: siete rutas, enlaces WhatsApp,
  móvil 390px, escritorio 1440px, apertura/cierre en pestaña abierta, error de reloj.
- Durante QA las fechas se simulan interceptando solo la respuesta HEAD en un
  navegador de pruebas. Esto no modifica la fecha ni la vigencia de producción.

Antes del deploy se clonó `certificacionmontessori:live` al canal
`certificacionmontessori:before-buen-fin-20261109`. Rollback mientras exista:

```sh
firebase hosting:clone certificacionmontessori:before-buen-fin-20261109 certificacionmontessori:live --project certificacionmontessori
```

Después de caducar ese canal, se puede revertir el commit de esta campaña,
reconstruir y desplegar **solo Hosting certificacionmontessori**. Conservar el
redirect `/contacto` de la rama SEO, ya publicado antes de esta campaña.

## Publicación verificada — 9 de noviembre de 2026

Firebase confirmó release de Hosting a las 22:24 UTC. El dominio público pasó
el contrato de 42 URLs canónicas (14 por idioma) y HEAD del reloj devolvió 200,
Date actual y contenido esperado. Playwright contra el dominio público confirmó
las siete rutas, tarjetas 3/3/2/2/2/1/0 respectivamente, enlaces institucionales,
comportamiento antes/durante/después de vigencia y fallo cerrado. Cero errores
JavaScript de página. El servicio preexistente de geolocalización `ipapi.co`
reportó un 429 durante QA, sin afectar la promoción en MXN.

Cambios propios respaldados en `release/buen-fin-2026` e integrados en main
local. No se publican los commits antiguos pendientes del portal de alumnos ni
se alteran los archivos de trabajo previos. Solo se desplegó el sitio público.

## Vista temporal autorizada — 9 de noviembre de 2026

A petición de Carlos, se añadió una ventana de visualización de una sola vez:
9/nov 16:40–17:10, hora de Ciudad de México (fin exclusivo, 23:10 UTC).
No cambia la vigencia comercial ni las condiciones publicadas del 13 al 17.
El hook contempla ambos intervalos y programa el siguiente límite; a las 17:10
oculta el bloque incluso si falla la siguiente consulta. La apertura oficial
sigue siendo el 13/nov a las 00:00. No requiere cron ni un segundo despliegue.

Respaldo inmediatamente previo: canal `before-preview-20261109`.
Rollback, si se desea quitar esta vista antes del cierre automático:

```sh
firebase hosting:clone certificacionmontessori:before-preview-20261109 certificacionmontessori:live --project certificacionmontessori
```

Verificados límites de ambos intervalos, build, contrato de 42 URLs y navegador
con móvil/escritorio y cierre de vista en pestaña abierta. Cambios acotados a
los datos de vigencia, hook, prueba de fechas y esta documentación.

## Respaldo previo al calendario y recurrencia

Canal Firebase creado 9/nov/2026: `before-calendar-20261109`.
Rollback de esta entrega mientras el canal exista:

```sh
firebase hosting:clone certificacionmontessori:before-calendar-20261109 certificacionmontessori:live --project certificacionmontessori
```

## Verificación de esta entrega — 9/nov/2026

- Firebase confirmó publicación solo de Hosting. Contrato de 42 URLs canónicas
  aprobado en el dominio real.
- QA local y público: siete rutas, cantidades correctas de ofertas, teléfono
  institucional, móvil sin desbordamiento, apertura/cierre en pestaña abierta,
  corte del 17/nov, promoción de febrero y fallo cerrado de reloj. Sin errores
  JavaScript. Relojes simulados únicamente en navegador QA.
- Calendario: 11 fechas, cambio noviembre 2026→enero 2027→febrero, calendario
  aún visible después de la última apertura y sin badge de escasez antes de
  abrir inscripciones. Unit tests adicionales cubren 2028 y 2030.
- Codex implementó y verificó; otro agente Codex hizo revisión independiente.
  Claude ACP no pudo revisar por requerir autenticación; no se cambiaron credenciales.
- PDF revisado visualmente, archivado también en `docs/` y enviado a WhatsApp
  personal de Carlos junto con las fechas en texto, ambos envíos confirmados.
  Generador reproducible: `scripts/create-inscripciones-calendar.py` (ReportLab).
