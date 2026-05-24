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
```
