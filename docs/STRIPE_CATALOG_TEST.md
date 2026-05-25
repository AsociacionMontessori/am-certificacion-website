# Catálogo Stripe — modo test

Cuenta: `acct_1T2HmnD6IQ4doPMo` (MX)

Generado con `npm run stripe:setup-catalog`. **No usar en producción (Live).**

| SKU | Precio ID | Monto |
|-----|-----------|-------|
| `inscripcion_diplomado` | `price_1Tai20D6IQ4doPMocr5W6Mw1` | $4,900 MXN |
| `libro_ammac_1` | `price_1Tai20D6IQ4doPMoy9v3DO2u` | $450 MXN |
| `libro_ammac_2` | `price_1Tai21D6IQ4doPMoiMq60tjV` | $450 MXN |
| `libro_ammac_3` | `price_1Tai22D6IQ4doPMoSt6KfQal` | $450 MXN |
| `libro_ammac_4` | `price_1Tai23D6IQ4doPMoQTENYBcx` | $450 MXN |
| `colegiatura_nido` | `price_1Tai23D6IQ4doPMoJAoTv7JW` | $3,100 MXN/mes |
| `colegiatura_casa` | `price_1Tai24D6IQ4doPMoXCZ2MosN` | $3,500 MXN/mes |
| `colegiatura_taller` | `price_1Tai25D6IQ4doPMoodDJeu3g` | $3,500 MXN/mes |
| `certificado_fisico` | `price_1Tai25D6IQ4doPMo6Ohuwmk5` | $2,700 MXN |
| `diplomado_neuroeducacion` | `price_1TamCfD6IQ4doPMo1J5MYRJa` | $4,500 MXN |
| `diplomado_educacion_cosmica` | `price_1TamCgD6IQ4doPMoepWngY71` | $2,800 MXN |
| `colegiatura_nido_inicio` | `price_1TamCgD6IQ4doPMofxhHCvUs` | $3,100 MXN |
| `colegiatura_casa_inicio` | `price_1TamChD6IQ4doPMoO5Q0nE72` | $3,500 MXN |
| `colegiatura_taller_inicio` | `price_1TamCiD6IQ4doPMo5zfqDDuZ` | $3,900 MXN |

Nota: `colegiatura_taller` recurrente actualizado a $3,900 → `price_1TamCkD6IQ4doPMol56y6TGF`.

## Firebase params (test)

```bash
cd alumnos-app
firebase functions:params:set STRIPE_PRICE_INSCRIPCION=price_1Tai20D6IQ4doPMocr5W6Mw1
firebase functions:params:set STRIPE_PRICE_LIBRO_1=price_1Tai20D6IQ4doPMoy9v3DO2u
firebase functions:params:set STRIPE_PRICE_LIBRO_2=price_1Tai21D6IQ4doPMoiMq60tjV
firebase functions:params:set STRIPE_PRICE_LIBRO_3=price_1Tai22D6IQ4doPMoSt6KfQal
firebase functions:params:set STRIPE_PRICE_LIBRO_4=price_1Tai23D6IQ4doPMoQTENYBcx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_NIDO=price_1Tai23D6IQ4doPMoJAoTv7JW
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_CASA=price_1Tai24D6IQ4doPMoXCZ2MosN
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_TALLER=price_1Tai25D6IQ4doPMoodDJeu3g
firebase functions:params:set STRIPE_PRICE_CERTIFICADO=price_1Tai25D6IQ4doPMo6Ohuwmk5
firebase functions:params:set STRIPE_PRICE_DIPLOMADO_NEURO=price_1TamCfD6IQ4doPMo1J5MYRJa
firebase functions:params:set STRIPE_PRICE_DIPLOMADO_COSMICA=price_1TamCgD6IQ4doPMoepWngY71
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_NIDO_INICIO=price_1TamCgD6IQ4doPMofxhHCvUs
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_CASA_INICIO=price_1TamChD6IQ4doPMoO5Q0nE72
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_TALLER_INICIO=price_1TamCiD6IQ4doPMo5zfqDDuZ
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_TALLER=price_1TamCkD6IQ4doPMol56y6TGF
```
