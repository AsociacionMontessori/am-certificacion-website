# Optimización de la portada para la intención «Guía Montessori»

**Fecha:** 2026-07-14<br>
**Estado:** aprobado para planificación<br>
**Superficie:** `/`, `/en/`, `/pt-br/`

## Evidencia de partida

Google Search Console, búsqueda Web y últimos 28 días, con el filtro de
consulta que contiene `guia montessori`, muestra:

- 200 impresiones, 6 clics, CTR de 3 % y posición media de 6,3.
- La portada concentra 189 impresiones y los 6 clics.
- `/diplomados/` registra 21 impresiones y 0 clics para este clúster.
- La consulta exacta `guia montessori` aporta 153 impresiones y 2 clics.
- Variantes con clics: `certificacion guia montessori` (3),
  `guia montessori` (2) y `curso guia montessori` (1).

La suma de filas puede diferir del total del informe por los límites y la
agregación de Search Console. Estos datos demuestran qué URL está atendiendo
la intención; no garantizan una posición futura.

## Decisión

Se optimizará la portada que Google ya reconoce para el clúster. No se creará
`/guia-montessori/`, porque introduciría una segunda URL con la misma intención
y podría dividir señales, enlaces y clics. `/diplomados/` conservará su foco en
la consulta transaccional `diplomado montessori`, para la que Bing ya la muestra
en primera posición de su muestra competitiva.

## Alcance de contenido

### Metadatos

- Español: cambiar el título base de `Certificación Montessori Online` a
  `Certificación de Guía Montessori Online`. El componente SEO añadirá
  `| AMMAC`, con un título final de 47 caracteres.
- Inglés: conservar `Online Montessori Guide Certification`; ya expresa la
  intención de forma natural.
- Portugués brasileño: conservar
  `Certificação Montessori Online | Formação de Guias`; ya incorpora las
  palabras clave nativas definidas en el glosario y permanece dentro del límite.
- Conservar las tres descripciones actuales: son localizadas, comerciales,
  inferiores a 155 caracteres y no requieren una reescritura para este cambio.

### Contenido visible

Se reutilizará la franja actual `educacion`, situada después del hero. No se
creará un componente nuevo ni se alterará la jerarquía de la página. El H1 del
hero, los programas, precios, fechas y llamadas a la acción permanecerán
intactos.

La franja dejará de hablar de «Educación significativa» y responderá de forma
directa a la intención informativa sobre el rol profesional:

#### Español

- H2: `¿Qué hace una Guía Montessori?`
- Texto i18n: `Una Guía Montessori <destacado>observa el desarrollo de cada
  niña y niño, prepara el ambiente y presenta los materiales en el momento
  adecuado.</destacado> Acompaña la autonomía sin sustituir la iniciativa del
  estudiante y vincula la observación, la familia y la comunidad educativa. La
  formación de AMMAC desarrolla estas competencias en el nivel Montessori que
  elijas.`

#### Inglés

- H2: `What does a Montessori Guide do?`
- Texto i18n: `A Montessori Guide <destacado>observes each child's development,
  prepares the learning environment, and presents materials at the appropriate
  moment.</destacado> The Guide supports independence without replacing the
  learner's initiative and connects observation with families and the learning
  community. AMMAC training develops these competencies for the Montessori
  level you choose.`

#### Portugués brasileño

- H2: `O que faz uma Guia Montessori?`
- Texto i18n: `Uma Guia Montessori <destacado>observa o desenvolvimento de cada
  criança, prepara o ambiente e apresenta os materiais no momento
  adequado.</destacado> A Guia apoia a autonomia sem substituir a iniciativa do
  aluno e conecta a observação às famílias e à comunidade educativa. A formação
  da AMMAC desenvolve essas competências para o nível Montessori escolhido.`

La primera oración de cada idioma conservará el énfasis visual ya implementado
por la etiqueta de traducción `destacado`. Se respetarán los glosarios nativos:
`Montessori Guide` en inglés y `Guia Montessori` en portugués brasileño.

## Presentación y accesibilidad

- Se mantienen el contenedor, tipografía, contraste y comportamiento responsive
  actuales de la franja.
- El nuevo encabezado seguirá siendo H2; la portada conservará exactamente un
  H1.
- No se agregarán tarjetas, acordeones, imágenes, animaciones ni texto oculto.
- No se agregará un marcado FAQ sintético. El contenido visible y los esquemas
  existentes de organización, sitio y página seguirán siendo la fuente
  estructurada.

## Pruebas

La implementación seguirá TDD:

1. Añadir al contrato de SEO construido aserciones que fallen mientras las tres
   portadas no expongan el H2 localizado y mientras el título español no incluya
   `Guía Montessori`.
2. Ejecutar la prueba y confirmar el fallo esperado.
3. Modificar solo los valores necesarios de `home.json`.
4. Construir Gatsby y confirmar:
   - título final localizado y de 65 caracteres o menos;
   - exactamente un H1 por portada;
   - H2 y texto visibles en ES, EN y PT-BR;
   - canonicales, `hreflang`, robots y JSON-LD sin regresiones.
5. Ejecutar el conjunto de contratos base y el contrato SEO completo.

## Despliegue y descubrimiento

- Desplegar mediante el flujo de Firebase ya verificado.
- Ejecutar el contrato HTTP contra producción.
- Inspeccionar el HTML público de las tres portadas.
- Enviar por IndexNow una sola vez únicamente `/`, `/en/` y `/pt-br/`.
- No reenviar el sitemap ni repetir solicitudes manuales de indexación en
  Google Search Console.

## Medición

Se registrará una anotación con la fecha del despliegue y se comparará el
clúster que contiene `guia montessori` en ventanas equivalentes:

- a 7 días: rastreo, títulos observados y primeras variaciones, sin concluir
  causalidad con una muestra pequeña;
- a 28 días: impresiones, clics, CTR, posición y reparto por página;
- a 90 días: tendencia sostenida por idioma, consultas de formación y leads
  atribuidos en GA4.

El éxito significa mejorar cobertura y respuesta para la intención correcta
sin desplazar a `/diplomados/`, no alcanzar de forma garantizada una posición
específica.
