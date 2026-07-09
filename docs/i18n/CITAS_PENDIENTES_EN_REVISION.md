# Dictamen para `CITAS_PENDIENTES_EN.md`

|  # | Clave                    | Veredicto                       | Acción                                                                                       |
| -: | ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------- |
|  1 | `home:marquee.frases[0]` | **Localizada, pero no cerrada** | Usar la redacción localizada en *The Absorbent Mind*, pero marcar página canónica pendiente. |
|  2 | `home:marquee.frases[1]` | **Confirmada**                  | Cerrar con *The Discovery of the Child*, p. 118.                                             |
|  3 | `home:marquee.frases[2]` | **No confirmada en esa forma**  | Reemplazar por una cita canónica sobre la mano.                                              |

---

## 1. Movimiento: conservar, pero con redacción exacta

La provisional actual dice:

> "The child creates his own movements and, once he has created them, perfects them"

Yo la cambiaría por la redacción localizada:

> **"In other words the child creates his own movements and, having done so, perfects them."**

Esta formulación aparece en *The Absorbent Mind* dentro del pasaje sobre la coordinación del movimiento: “the child creates his own movements and, having done so, perfects them.” La localicé en texto digitalizado y también en un PDF escaneado, pero todavía no la marcaría como **VERIFICADA** hasta cotejar la página exacta contra la edición Clio/Montessori-Pierson que usarás como canon del proyecto. ([Internet Archive][1])

**Estado recomendado:**

> LOCALIZADA; PÁGINA CANÓNICA PENDIENTE

---

## 2. Libertad e independencia: cerrar

La frase:

> **"No one can be free unless he is independent."**

Sí puede cerrarse. Montessori 150, de AMI, la da como parte de una cita de *The Discovery of the Child*, p. 118. ([Montessori 150][2])

Para el marquee puedes usar solo la primera oración porque es completa y funciona muy bien visualmente:

```json
"No one can be free unless he is independent."
```

**Estado recomendado:**

> VERIFICADA: *The Discovery of the Child*, p. 118, Montessori 150 / AMI

---

## 3. Mano y mente: no usar esa fórmula como cita literal

La frase:

> "What the hand does, the mind remembers"

suena preciosa y circula mucho, pero **no la publicaría como cita literal de Montessori** si no aparece en edición canónica. Para el sitio, yo la reemplazaría por una cita muy cercana, canónica y más fuerte:

> **"The hands are the instruments of man's intelligence."**

Montessori 150 / AMI la registra en *The Absorbent Mind*, p. 25, como parte de una cita más larga: “He does it with his hands…” ([Montessori 150][3])

Otra opción, si quieres una frase más explícita para el sitio:

> **"The hand is the instrument of the intelligence."**

Esa aparece en *The 1946 London Lectures*, p. 36, dentro de un pasaje sobre el movimiento de la mano y el desarrollo de la mente. ([Montessori 150][4])

Para marquee, yo elegiría la primera porque es más memorable:

```json
"The hands are the instruments of man's intelligence."
```

**Estado recomendado:**

> SUSTITUIDA POR CITA CANÓNICA: *The Absorbent Mind*, p. 25, Montessori 150 / AMI

---

# `en/home.json` recomendado

```json
{
  "marquee": {
    "frases": [
      "In other words the child creates his own movements and, having done so, perfects them.",
      "No one can be free unless he is independent.",
      "The hands are the instruments of man's intelligence."
    ]
  }
}
```

# Actualización sugerida para `CITAS_PENDIENTES_EN.md`

```md
| # | Clave i18n | Cita ES | Rendición EN final | Fuente canónica / candidata | Estado |
|---|---|---|---|---|---|
| 1 | home:marquee.frases[0] | «El niño crea sus propios movimientos y, una vez creados, los perfecciona» | "In other words the child creates his own movements and, having done so, perfects them." | *The Absorbent Mind*. Redacción localizada en texto EN; cotejar página exacta en edición Clio/Montessori-Pierson antes de cierre. | LOCALIZADA; PÁGINA CANÓNICA PENDIENTE |
| 2 | home:marquee.frases[1] | «No se puede ser libre, si no se es independiente» | "No one can be free unless he is independent." | *The Discovery of the Child*, p. 118, Montessori 150 / AMI. | VERIFICADA |
| 3 | home:marquee.frases[2] | «Lo que la mano hace, la mente lo recuerda» | "The hands are the instruments of man's intelligence." | *The Absorbent Mind*, p. 25, Montessori 150 / AMI. Sustituye fórmula circulante no localizada. | SUSTITUIDA POR CITA CANÓNICA |
```

Mi recomendación fina: **no uses “What the hand does, the mind remembers”** en el sitio, aunque suene mejor para marketing. Justo porque el sitio vende certificación Montessori, conviene que las citas sean blindadas. Ahí la autoridad editorial vale más que la frase bonita.

[1]: https://archive.org/stream/absorbentmind031961mbp/absorbentmind031961mbp_djvu.txt "Full text of \"The Absorbent Mind\""
[2]: https://montessori150.org/maria-montessori/montessori-quotes/discovery-child-12 "13 November 2019 | Montessori 150"
[3]: https://montessori150.org/maria-montessori/montessori-quotes/absorbent-mind-16 "1 November 2019 | Montessori 150"
[4]: https://montessori150.org/maria-montessori/montessori-quotes/1946-london-lectures-54 "20 October 2021 | Montessori 150"
