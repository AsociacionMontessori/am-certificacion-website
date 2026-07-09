Este archivo está **bien armado**, pero haría un ajuste editorial importante: en PT-BR **ninguna de las tres citas debe marcarse todavía como verificada**, ni siquiera la tercera, hasta cotejar redacción y página en una edición brasileña publicada. Tu propio archivo fija esa regla: versión canónica brasileña, no retraducción, con Kírion / Papirus / Montessori-Pierson Brasil como referencia. 

# Dictamen por cita

|  # | Estado actual                | Mi dictamen    | Acción                                                                                                                                                                          |
| -: | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1 | PENDENTE DE COTEJO           | Correcto       | Mantener pendiente. Mejorar la rendición provisional para que suene menos calcada.                                                                                              |
|  2 | PENDENTE DE COTEJO           | Correcto       | Mantener pendiente. La frase es defendible, pero debe cotejarse en *A Descoberta da Criança*.                                                                                   |
|  3 | SUSTITUIDA POR CITA CANÓNICA | Cambiar estado | Mejor: **CANDIDATA CANÔNICA; PÁGINA PT-BR PENDENTE**. En EN sí está bien anclada en *The Absorbent Mind*, p. 25, pero eso no cierra la edición brasileña. ([Montessori 150][1]) |

---

# 1. Cita 1: movimiento

Actual:

> “A criança cria os próprios movimentos e, uma vez criados, os aperfeiçoa”

No está mal, pero **suena un poquito calcada**. En PT-BR natural yo preferiría:

> **“A criança cria seus próprios movimentos e, depois de criá-los, os aperfeiçoa.”**

O, más sobria y un poco más literaria:

> **“A criança cria seus próprios movimentos e, tendo-os criado, os aperfeiçoa.”**

Para marquee web, me gusta más la primera: **después de criá-los**. Es clara, natural y no se siente española.

Pero ojo: sigue siendo **rendición provisional** hasta encontrar la frase en *A Mente Absorvente* edición brasileña.

---

# 2. Cita 2: libertad e independencia

Actual:

> “Ninguém pode ser livre a menos que seja independente”

Funciona. Pero para oído brasileño cotidiano, quizás suena más natural:

> **“Ninguém pode ser livre se não for independente.”**

La versión inglesa canónica está sólidamente documentada como:

> “No one can be free unless he is independent.”

Montessori 150 / AMI la atribuye a *The Discovery of the Child*, p. 118. ([Montessori 150][2])

Pero para PT-BR, no basta con traducir el EN. Yo la dejaría así:

| Uso                     | Frase                                                       |
| ----------------------- | ----------------------------------------------------------- |
| Provisional más natural | **“Ninguém pode ser livre se não for independente.”**       |
| Provisional más literal | **“Ninguém pode ser livre a menos que seja independente.”** |
| Estado                  | **PENDENTE DE COTEJO EM EDIÇÃO BRASILEIRA**                 |

Mi preferencia para sitio: **“Ninguém pode ser livre se não for independente.”**

---

# 3. Cita 3: manos e inteligencia

Actual:

> “As mãos são os instrumentos da inteligência do homem”

Conceptualmente está bien porque sustituye la fórmula circulante “Lo que la mano hace, la mente lo recuerda”. El EN canónico está bien documentado en AMI / Montessori 150:

> “The hands are the instruments of man's intelligence.”

Aparece atribuida a *The Absorbent Mind*, p. 25. ([Montessori 150][1])

Pero en PT-BR, hay que cuidar dos cosas:

1. **Redacción exacta brasileña**: puede ser “do homem”, “humana” o una formulación distinta según la edición.
2. **Estado documental**: todavía falta cotejar Kírion / Papirus / Montessori-Pierson Brasil.

Yo cambiaría el estado de la tercera cita. No la marcaría como “cita canónica” todavía. Mejor:

> **CANDIDATA CANÔNICA; COTEJAR REDAÇÃO E PÁGINA NA EDIÇÃO BRASILEIRA**

---

# Versión sugerida para actualizar el archivo

# Citas de Maria Montessori — estado PT-BR (sitio web)

Regra (glossário §9): usar a versão canônica brasileira publicada (Kírion / Papirus / Montessori-Pierson Brasil), não retradução do espanhol nem tradução livre do inglês. O ditame EN serve como espelho conceitual, mas não fecha automaticamente a redação PT-BR.

| # | Clave i18n             | Cita ES                                                                    | Rendição PT-BR provisória                                                       | Fonte canônica / candidata                                                                                                                                             | Estado                                    |
| - | ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1 | home:marquee.frases[0] | «El niño crea sus propios movimientos y, una vez creados, los perfecciona» | "A criança cria seus próprios movimentos e, depois de criá-los, os aperfeiçoa." | *A Mente Absorvente* (Kírion) — localizar passagem sobre coordenação do movimento.                                                                                     | PENDENTE DE COTEJO EM EDIÇÃO BRASILEIRA   |
| 2 | home:marquee.frases[1] | «No se puede ser libre, si no se es independiente»                         | "Ninguém pode ser livre se não for independente."                               | *A Descoberta da Criança* / edição brasileira correspondente — verificar redação exata publicada. EN confirmado em *The Discovery of the Child*, p. 118.               | PENDENTE DE COTEJO EM EDIÇÃO BRASILEIRA   |
| 3 | home:marquee.frases[2] | «Lo que la mano hace, la mente lo recuerda»                                | "As mãos são os instrumentos da inteligência do homem."                         | *A Mente Absorvente* — substitui a fórmula circulante não canônica. EN confirmado em *The Absorbent Mind*, p. 25; falta cotejar redação e página na edição brasileira. | CANDIDATA CANÔNICA; PÁGINA PT-BR PENDENTE |

---

# `pt-br/home.json` provisional

Yo lo dejaría así **solo como provisional**, no como cierre canónico:

```json
{
  "marquee": {
    "frases": [
      "A criança cria seus próprios movimentos e, depois de criá-los, os aperfeiçoa.",
      "Ninguém pode ser livre se não for independente.",
      "As mãos são os instrumentos da inteligência do homem."
    ]
  }
}
```

# Veredicto final

Tu archivo va bien, pero yo cambiaría la lógica de cierre:

> **EN confirmado no significa PT-BR confirmado.**

Para publicación web provisional, estas frases pueden usarse si internamente quedan marcadas como pendientes. Para cierre editorial serio, necesitas cotejar la edición brasileña real y registrar **obra, editorial, año y página**.

[1]: https://montessori150.org/maria-montessori/montessori-quotes/absorbent-mind-16?utm_source=chatgpt.com "Montessori Quote of the Day"
[2]: https://montessori150.org/maria-montessori/montessori-quotes/discovery-child-12?utm_source=chatgpt.com "Montessori Quote of the Day"
