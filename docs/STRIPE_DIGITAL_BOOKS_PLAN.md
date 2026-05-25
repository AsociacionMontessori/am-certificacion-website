# Plan — venta de ebooks con Stripe

Objetivo: vender versiones digitales de los libros de Roxana Muñoz y entregar descarga segura en PDF/EPUB después de pago confirmado.

## Decisión recomendada

No publicar archivos PDF/EPUB en rutas públicas del sitio. La descarga debe pasar por Firebase Functions para validar una orden pagada y generar enlaces temporales.

## Flujo propuesto

1. Agregar SKUs digitales, por ejemplo `ebook_ammac_1_pdf`, `ebook_ammac_1_epub` o un SKU único `ebook_ammac_1` con ambos formatos incluidos.
2. Guardar los archivos en Firebase Storage en una ruta privada, por ejemplo `ebooks/ammac-libro-1/libro.pdf` y `ebooks/ammac-libro-1/libro.epub`.
3. Crear productos/precios Stripe para ebooks, sin envío físico.
4. En `roxanaBooks.js`, agregar metadata digital: disponibilidad, formatos y SKU Stripe.
5. En Checkout, crear orden tipo `ebook` o `libro_digital` y guardar `bookId`, formatos incluidos y email comprador.
6. En `stripeWebhook`, al recibir `checkout.session.completed`, marcar la orden como pagada y crear un entitlement de descarga.
7. Crear Function pública controlada `getDigitalBookDownloadUrl`: recibe `ordenId` + token corto, valida pago/entitlement/expiración e intenta generar una URL firmada de Storage.
8. En `/checkout/success`, si la orden es digital, mostrar botón `Descargar ebook` y enviar también el enlace por correo.

## Controles mínimos

- Los archivos digitales nunca deben quedar dentro de `public/` ni en una URL estable.
- Las URLs de descarga deben expirar, idealmente en 15-60 minutos.
- El token de descarga debe ser aleatorio y hasheado en Firestore, no derivado del `ordenId`.
- Limitar descargas por orden, por ejemplo 5 intentos o ventana de 7 días.
- Mantener rate limiting en la Function de descarga.
- Registrar auditoría básica: `ordenId`, `bookId`, formato, fecha, fingerprint hasheado.
- No adjuntar PDF/EPUB por correo; enviar enlace temporal.

## Cambios de datos sugeridos

```js
{
  id: "ammac-libro-1",
  stripeSku: "libro_ammac_1",
  digital: {
    enabled: true,
    stripeSku: "ebook_ammac_1",
    priceMx: "250",
    formats: ["pdf", "epub"],
    storagePaths: {
      pdf: "ebooks/ammac-libro-1/libro.pdf",
      epub: "ebooks/ammac-libro-1/libro.epub",
    },
  },
}
```

## Pendientes antes de implementar

- Confirmar si se venderá PDF, EPUB o ambos.
- Confirmar precio por ebook y si habrá paquete físico + digital.
- Subir archivos finales a Storage privado.
- Definir texto legal de uso personal/no redistribución.
- Probar compra test completa y expiración de enlaces antes de activar en producción.
