# Linea base de Google Search Console - 2026-07-13

## Alcance y fuente

- Propiedad: `https://certificacionmontessori.com/`
- Tipo de busqueda: Web
- Periodo medido: `2026-06-14` a `2026-07-11` (28 dias)
- Exportacion: `https___certificacionmontessori.com_-Performance-on-Search-2026-07-13.zip`
- Fecha de analisis: `2026-07-13`
- Responsable: AMMAC / Codex

Esta linea base corresponde principalmente a la version anterior al despliegue
multilingue del `2026-07-13`. Sirve para comparar el efecto posterior, no para
evaluar de inmediato las nueve URLs nuevas o actualizadas de cada idioma.

Search Console aplica proteccion de privacidad y distintos metodos de
agregacion. La tabla de consultas solo expone `75` de los `288` clics y `1,674`
de las `5,417` impresiones. Ademas, las tablas agrupadas por URL pueden sumar
mas que el total de la propiedad cuando un resultado contiene varias URLs. Por
ello, las tablas de paginas, consultas y paises se interpretan dentro de su
propia dimension y no se cruzan como si fueran una base de eventos.

## Resultado general

| Metrica | Resultado |
| --- | ---: |
| Clics | 288 |
| Impresiones | 5,417 |
| CTR | 5.32 % |
| Posicion media | 7.39 |
| Consultas visibles | 221 |

La segunda mitad del periodo mejoro respecto de la primera: los clics pasaron
de `140` a `148`, el CTR de `5.00 %` a `5.65 %` y la posicion ponderada de
`7.61` a `7.15`, aunque las impresiones bajaron de `2,798` a `2,619`. Es una
senal favorable, pero todavia no atribuible al release del `2026-07-13`.

## Cobertura por idioma y mercado

La dimension de paginas muestra lo siguiente:

| Locale de la URL | Paginas visibles | Clics | Impresiones | CTR | Posicion ponderada |
| --- | ---: | ---: | ---: | ---: | ---: |
| Espanol | 8 | 287 | 5,822 | 4.93 % | 8.13 |
| Ingles | 7 | 3 | 56 | 5.36 % | 13.48 |
| Portugues de Brasil | 2 | 0 | 7 | 0.00 % | 12.43 |

El inventario nuevo de produccion contiene nueve URLs canonicas por idioma,
pero esta exportacion todavia no puede reflejarlo. La prioridad es observar si
Google descubre y empieza a mostrar las nuevas URLs inglesas y portuguesas, sin
reenviar el sitemap ni reiniciar validaciones activas.

Los mercados anglofonos prioritarios (Estados Unidos, Reino Unido, Canada,
Irlanda y Australia) acumularon `822` impresiones, `11` clics, CTR `1.34 %` y
posicion ponderada `7.83`. Brasil y Portugal acumularon `22` impresiones, cero
clics y posicion `9.23`. El pais no identifica el idioma de la consulta; estas
cifras expresan oportunidad geografica, no trafico confirmado en ingles o
portugues.

Solo cuatro consultas visibles contienen senales inequivocas de ingles y suman
seis impresiones: `montessori certification`, `montessori training institute`,
`montessori certified schools` y `lev montessori school of excellence`. No hay
una consulta inequivocamente portuguesa en la tabla exportada. Este es el cero
operativo contra el cual se medira el crecimiento internacional.

## Paginas con mayor visibilidad

| Pagina | Clics | Impresiones | CTR | Posicion |
| --- | ---: | ---: | ---: | ---: |
| `/` | 183 | 2,721 | 6.73 % | 6.64 |
| `/buscador/` (ruta heredada) | 31 | 1,235 | 2.51 % | 8.71 |
| `/publicaciones/` | 13 | 816 | 1.59 % | 8.75 |
| `/diplomados/` | 46 | 690 | 6.67 % | 11.38 |
| `/contact/` | 2 | 196 | 1.02 % | 9.17 |
| `/directorio/` | 12 | 141 | 8.51 % | 7.08 |

La ruta antigua `/buscador/` no debe recuperarse como pagina competidora: se
renombro deliberadamente a `/directorio/`. Sus `31` clics justifican preservar
la senal mediante un `301` directo, sin cadenas intermedias. El contrato local
ya exige ese unico salto y debe comprobarse de nuevo en produccion despues del
despliegue.

## Demanda visible y oportunidades

La clasificacion conservadora de las 221 consultas visibles arroja:

| Intencion aproximada | Consultas | Clics | Impresiones | CTR |
| --- | ---: | ---: | ---: | ---: |
| Formacion/certificacion | 57 | 66 | 807 | 8.18 % |
| Libros/publicaciones | 21 | 3 | 438 | 0.68 % |
| Directorio/escuelas | 44 | 0 | 100 | 0.00 % |
| Otras | 99 | 6 | 329 | 1.82 % |

La clasificacion usa palabras de la consulta y solo sirve para priorizar. No
reemplaza una segmentacion query-pagina, que esta exportacion no contiene.

Consultas no de marca con posicion igual o mejor que 10 y CTR menor de 3 %:

| Consulta | Clics | Impresiones | CTR | Posicion |
| --- | ---: | ---: | ---: | ---: |
| `libro montessori` | 0 | 247 | 0.00 % | 9.36 |
| `guia montessori` | 2 | 153 | 1.31 % | 6.94 |
| `libros montessori` | 1 | 70 | 1.43 % | 9.41 |
| `montessori cursos` | 0 | 45 | 0.00 % | 9.98 |
| `instituto de formacion de guias montessori` | 0 | 39 | 0.00 % | 5.15 |
| `escuelas montessori` | 0 | 35 | 0.00 % | 9.09 |
| `libro montesori` | 0 | 25 | 0.00 % | 8.96 |
| `montessori libros` | 0 | 22 | 0.00 % | 8.68 |
| `certificacion ami` | 0 | 16 | 0.00 % | 8.31 |

Solo una consulta visible cumple la definicion estricta de marca adoptada
(`AMMAC`, nombre completo de la asociacion o dominio): `asociacion montessori
de mexico`, con `2` clics y `11` impresiones. Las otras `220` consultas
visibles suman `73` clics y `1,663` impresiones. Debido a las consultas ocultas
por privacidad, no se presenta esto como porcentaje total de marca/no marca.

## Dispositivos

| Dispositivo | Clics | Impresiones | CTR | Posicion |
| --- | ---: | ---: | ---: | ---: |
| Movil | 210 | 3,263 | 6.44 % | 6.30 |
| Ordenador | 74 | 2,123 | 3.49 % | 9.10 |
| Tablet | 4 | 31 | 12.90 % | 4.10 |

Movil ya concentra el `72.9 %` de los clics. Ordenador tiene casi dos tercios
de las impresiones moviles, pero un CTR `2.95` puntos menor; se revisaran sus
snippets y resultados despues de acumular datos posteriores al release.

## Prioridades derivadas

1. Conservar en un solo `301` toda la autoridad y los clics de `/buscador/`
   hacia `/directorio/` y no volver a publicar la ruta antigua.
2. Medir primero descubrimiento, indexacion e impresiones de las nueve URLs en
   ingles y nueve en portugues antes de reescribir contenido sin evidencia.
3. Mejorar el CTR internacional: el rango geografico ya esta cerca de primera
   pagina, pero todavia recibe pocos clics.
4. Atender la intencion de libros con un futuro hub especifico, manteniendo los
   articulos recientes como contenido principal y primero de
   `/publicaciones/`. Los libros no deben ocupar el primer bloque ni opacar el
   acceso al contenido editorial.
5. Revisar despues del periodo de observacion titulos, descripciones y encaje
   de intencion para formacion de guias, escuelas/directorio y libros. Evitar
   canibalizar `/diplomados/`, `/directorio/` y `/publicaciones/`.
6. Usar esta exportacion como cero operativo; no comparar el release contra
   datos que terminan dos dias antes de su publicacion.

## Proximos cortes

- `2026-07-15` (48 horas): procesamiento del sitemap, Page Indexing y smoke
  HTTP. No reenviar ni reiniciar validaciones.
- `2026-07-20` (7 dias): muestras de indexacion y primeras impresiones por URL
  inglesa y portuguesa.
- `2026-08-10` (28 dias completos): comparar contra esta linea base por pagina,
  pais, dispositivo, locale y consulta de marca/no marca visible.

