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
