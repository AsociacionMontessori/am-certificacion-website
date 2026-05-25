# Plan - venta de ebooks con Stripe

Objetivo: vender versiones digitales de los libros de Roxana Muñoz y entregar descarga segura en PDF/EPUB después de pago confirmado.

## Decisiones actuales

- Los archivos digitales viven en Firebase Storage privado, bajo `ebooks/ammac-libro-*/`.
- Los libros impresos mantienen sus SKUs `libro_ammac_*` y requieren envío.
- Los ebooks usan SKUs separados `ebook_ammac_*` y no requieren envío.
- El paquete digital usa SKU `ebook_pack_ammac_4`.
- Los precios mostrados al usuario son finales e incluyen la comisión estimada de pago.

## Precios digitales

| Producto | Neto objetivo | Precio final |
| --- | ---: | ---: |
| Ebook 1 - Pedagogía científica | $200 MXN | $213 MXN |
| Ebook 2 - Secreto de la infancia | $200 MXN | $213 MXN |
| Ebook 3 - Educación cósmica | $300 MXN | $317 MXN |
| Ebook 4 - Guiones cósmicos | $300 MXN | $317 MXN |
| Paquete 4 ebooks | $800 MXN | $839 MXN |

El paquete descuenta el libro de menor precio como "uno gratis". Si se decide una promoción más agresiva, el precio alternativo sería cobrar el equivalente a $700 netos.

## Archivos subidos a Storage

- `ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.pdf`
- `ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.epub`
- `ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.pdf`
- `ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.epub`
- `ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.pdf`
- `ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.epub`
- `ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.pdf`
- `ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.epub`

## Flujo de descarga

1. El comprador elige ebook individual o paquete digital.
2. `createPublicCheckout` crea la orden con token aleatorio de descarga y guarda solo el hash en Firestore.
3. Stripe redirige a `/checkout/success` con `orden`, `tipo=ebook`, `sku` y `download`.
4. Después del webhook `checkout.session.completed`, la orden pasa a `pagado`.
5. `getDigitalBookDownloadUrl` valida orden pagada, token, SKU comprado y formato solicitado.
6. La función genera una URL firmada temporal de Storage y registra auditoría de descarga.

## Controles mínimos

- Los PDF/EPUB no quedan en `public/` ni tienen URL estable.
- El token se guarda hasheado; el token real solo viaja en la URL de éxito de Stripe.
- Las URLs firmadas expiran en 60 minutos.
- La orden permite descarga durante 30 días.
- Límite por orden: 20 descargas individuales o 40 para paquete.
- La función de descarga tiene rate limit.
- Se registra auditoría básica por orden en subcolección `descargas`.

## Pendientes para producción

- Crear precios equivalentes en Stripe live.
- Configurar `stripeCatalog/default` o params Firebase live con los price IDs finales.
- Probar compra live de bajo monto antes de publicar masivamente.
- Definir texto legal visible de uso personal/no redistribución.
