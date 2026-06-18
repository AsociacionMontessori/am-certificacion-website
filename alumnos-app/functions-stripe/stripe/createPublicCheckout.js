const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const Stripe = require("stripe");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {resolveSku, SITE_URL, CATALOG_META} = require("./catalog");
const {generateAccessToken, hashAccessToken, ACCESS_TOKEN_TTL_MS} = require("./accessToken");
const {rejectIfFlowDisabled} = require("./featureFlags");
const {
  buildCheckoutItemsFromRequest,
  resolveOrdenTipo,
  estimateTotalMxn,
  getProgramaCheckout,
} = require("./programasCheckout");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashDownloadToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

/**
 * @param {object} body
 * @return {{items: Array<{sku: string, quantity: number}>, tipo: string, requiresShipping: boolean, skus: string[], modoPago: string|null}}
 */
function resolveCheckoutFromBody(body) {
  const hasExplicitItems = Boolean(body.sku) || (Array.isArray(body.items) && body.items.length > 0);
  const programa = String(body.programa || "").trim();

  if (programa && !hasExplicitItems) {
    const built = buildCheckoutItemsFromRequest({
      programa,
      soloInscripcion: Boolean(body.soloInscripcion),
    });
    const parsed = parseLineItems({items: built.items});
    const tipo = resolveOrdenTipo(parsed.skus, built.programaLabel);
    return {
      ...parsed,
      tipo,
      modoPago: built.modo,
      programaLabel: built.programaLabel,
      promoInscripcionIncluida: Boolean(built.promoInscripcionIncluida),
    };
  }

  const items = [];
  if (body.sku) {
    items.push({sku: body.sku, quantity: body.quantity || 1});
  }
  if (Array.isArray(body.items)) {
    body.items.forEach((item) => {
      if (item?.sku) {
        items.push({sku: item.sku, quantity: item.quantity || 1});
      }
    });
  }
  if (items.length === 0) {
    throw new Error("Debes indicar al menos un producto (programa o sku)");
  }

  const parsed = parseLineItems({items});
  const tipo = resolveOrdenTipo(parsed.skus, programa);
  return {
    ...parsed,
    tipo,
    modoPago: null,
    programaLabel: programa || null,
    promoInscripcionIncluida: false,
  };
}

/**
 * @param {object} input
 * @return {{items: Array, tipo: string, requiresShipping: boolean, skus: string[]}}
 */
function parseLineItems(input) {
  const items = input.items || [];
  if (items.length === 0) {
    throw new Error("Debes indicar al menos un producto");
  }

  let requiresShipping = false;
  const skus = [];

  items.forEach(({sku, quantity}) => {
    const meta = CATALOG_META[sku];
    if (!meta) throw new Error(`Producto no válido: ${sku}`);
    skus.push(sku);
    if (meta.requiresShipping) requiresShipping = true;
    if (quantity < 1 || quantity > 10) throw new Error("Cantidad no válida");
  });

  return {items, requiresShipping, skus};
}

exports.createPublicCheckoutHandler = onRequest(
    {
      region: "us-central1",
      secrets: [stripeSecretKey],
      cors: false,
      invoker: "public",
    },
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;

      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }

      try {
        const db = admin.firestore();
        if (await enforceRateLimit(db, req, res, {
          key: "createPublicCheckout",
          limit: 20,
          windowSeconds: 600,
        })) return;

        const body = req.body || {};
        const cliente = body.cliente || {};
        const nombre = String(cliente.nombre || "").trim();
        const email = String(cliente.email || "").trim().toLowerCase();
        const telefono = String(cliente.telefono || "").trim();
        const programa = String(body.programa || "").trim();
        const requiereFacturaFiscal = Boolean(body.requiereFacturaFiscal);
        const cuentaContable = String(body.cuentaContable || (requiereFacturaFiscal ? "banorte" : "hsbc")).trim();

        if (!nombre || nombre.length < 2) {
          res.status(400).json({error: "Nombre requerido"});
          return;
        }
        if (!EMAIL_REGEX.test(email)) {
          res.status(400).json({error: "Correo electrónico no válido"});
          return;
        }

        const {
          items,
          tipo,
          requiresShipping,
          skus,
          modoPago,
          programaLabel,
          promoInscripcionIncluida,
        } = resolveCheckoutFromBody(body);

        const requestedTipos = skus
            .map((sku) => CATALOG_META[sku]?.tipo)
            .filter(Boolean);
        if (rejectIfFlowDisabled(res, requestedTipos)) return;

        // Códigos promocionales (incl. cupones 100% «descarga gratis») solo en
        // órdenes 100% digitales (ebooks). Así un cupón nunca puede regalar un
        // libro físico + envío. El alcance real del cupón se acota además a los
        // productos ebook en Stripe; este flag solo muestra el campo de código.
        const allowPromotionCodes = requestedTipos.length > 0 &&
            requestedTipos.every((tipo) => tipo === "ebook");

        const progConfig = programaLabel ? getProgramaCheckout(programaLabel) : null;
        const nivelFormulario = progConfig?.nivelFormulario || "";
        const promoQuery = promoInscripcionIncluida ? "&promo=1" : "";
        const ebookSkus = skus.filter((sku) => sku.startsWith("ebook_"));
        const digitalDownloadToken = ebookSkus.length ? crypto.randomBytes(32).toString("base64url") : "";
        const digitalQuery = digitalDownloadToken ?
          `&download=${encodeURIComponent(digitalDownloadToken)}&sku=${encodeURIComponent(ebookSkus[0])}` :
          "";
        const digitalDelivery = digitalDownloadToken ? {
          tokenHash: hashDownloadToken(digitalDownloadToken),
          tokenVersion: 1,
          skus: ebookSkus,
          maxDownloads: ebookSkus.includes("ebook_pack_ammac_4") ? 40 : 20,
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        } : null;

        const stripe = new Stripe(stripeSecretKey.value());

        const lineItems = [];
        const ordenLineItems = [];

        for (const {sku, quantity} of items) {
          const resolved = await resolveSku(db, sku);
          if (!resolved) {
            res.status(503).json({
              error: "Producto no configurado en Stripe. Contacta a administración.",
              sku,
            });
            return;
          }
          lineItems.push({price: resolved.priceId, quantity});
          ordenLineItems.push({
            sku,
            priceId: resolved.priceId,
            quantity,
            descripcion: resolved.meta.descripcion,
          });
        }

        const montoEstimadoMxn = estimateTotalMxn(items, CATALOG_META);
        const siteUrl = SITE_URL.value().replace(/\/$/, "");
        const ordenRef = db.collection("ordenes").doc();

        // F-02: token de acceso por orden. Se entrega solo en `success_url`
        // y los endpoints de inscripción lo exigirán para autorizar acceso
        // a PII / completar el expediente.
        const accessToken = generateAccessToken();
        const accessTokenHash = hashAccessToken(accessToken);
        const accessTokenExpiresAt = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
        );
        const accessTokenQuery = `&t=${encodeURIComponent(accessToken)}`;

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: email,
          line_items: lineItems,
          ...(allowPromotionCodes ? {allow_promotion_codes: true} : {}),
          success_url: `${siteUrl}/checkout/success?orden=${ordenRef.id}&tipo=${tipo}${promoQuery}${digitalQuery}${accessTokenQuery}`,
          cancel_url: `${siteUrl}/checkout/cancel?orden=${ordenRef.id}`,
          metadata: {
            ordenId: ordenRef.id,
            tipo,
            origen: "sitio_publico",
            skus: skus.join(","),
            programa: (programaLabel || programa).slice(0, 200),
            modoPago: (modoPago || "").slice(0, 40),
            nivelFormulario: nivelFormulario.slice(0, 200),
            requiereFacturaFiscal: requiereFacturaFiscal ? "1" : "0",
            cuentaContable: cuentaContable.slice(0, 32),
            promoInscripcionIncluida: promoInscripcionIncluida ? "1" : "0",
          },
          ...(requiresShipping ? {
            shipping_address_collection: {allowed_countries: ["MX", "US"]},
          } : {}),
        });

        await ordenRef.set({
          tipo,
          estado: "pendiente",
          stripeCheckoutSessionId: session.id,
          cliente: {nombre, email, telefono: telefono || null},
          lineItems: ordenLineItems,
          programa: programaLabel || programa || null,
          nivelFormulario: nivelFormulario || null,
          modoPago: modoPago || null,
          promoInscripcionIncluida: promoInscripcionIncluida || false,
          montoEstimadoMxn,
          requiereFacturaFiscal,
          cuentaContable,
          moneda: "mxn",
          monto: null,
          origen: "sitio_publico",
          accessTokenHash,
          accessTokenExpiresAt,
          ...(digitalDelivery ? {digitalDelivery} : {}),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({url: session.url, ordenId: ordenRef.id});
      } catch (error) {
        console.error("createPublicCheckout:", error);
        res.status(500).json({error: error.message || "Error al crear el pago"});
      }
    },
);
