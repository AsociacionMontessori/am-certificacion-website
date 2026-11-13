/** Isolated Sandbox checkout. Never writes production orders or grants real access. */
const crypto = require("node:crypto");
const {validateCapture} = require("./sandbox");
const {CATALOG_META} = require("../stripe/catalog");
const {buildCheckoutItemsFromRequest} = require("../stripe/programasCheckout");

function fail(status, message) {throw Object.assign(new Error(message), {status});}
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const terminal = new Set(["revision", "reembolsado", "revertido", "denegado"]);

function quote(body) {
  if ((body.quantity !== undefined && (!Number.isSafeInteger(body.quantity) || body.quantity < 1 || body.quantity > 10)) ||
      (body.programa && body.sku) || (body.soloInscripcion !== undefined && typeof body.soloInscripcion !== "boolean")) {
    fail(400, "Solicitud de catálogo inválida");
  }
  if (body.codigo || body.items || body.amount || body.amountCentavos || body.currency) {
    fail(400, "Sandbox: usa el catálogo del servidor; cupones y carritos personalizados aún no disponibles.");
  }
  const result = buildCheckoutItemsFromRequest(body);
  let amountCentavos = 0;
  for (const item of result.items) {
    const meta = Object.hasOwn(CATALOG_META, item.sku) ? CATALOG_META[item.sku] : null;
    if (!meta || meta.requiresShipping || meta.tipo === "colegiatura" ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      fail(400, "Producto no disponible en esta prueba: sin envíos ni mensualidades.");
    }
    amountCentavos += Math.round(meta.amountMxn * 100) * item.quantity;
  }
  if (!Number.isSafeInteger(amountCentavos) || amountCentavos <= 0) fail(400, "Importe inválido");
  return {items: result.items, amountCentavos, currency: "MXN", programa: result.programaLabel};
}

function approvalUrl(order) {
  const link = order?.links?.find(l => ["payer-action", "approve"].includes(l.rel));
  try {
    const url = new URL(link?.href);
    if (url.origin === "https://www.sandbox.paypal.com" && !url.username && !url.password &&
        ["/checkoutnow", "/checkoutnow/"].includes(url.pathname) &&
        url.searchParams.get("token") === order.id) return url.href;
  } catch (_) { /* fail closed */ }
  fail(502, "PayPal no devolvió un enlace Sandbox válido");
}

function createCheckout({db, client, merchantId, returnUrl, now = Date.now}) {
  const orders = db.collection("paypalSandboxOrders");
  const events = db.collection("paypalSandboxEvents");
  const captures = db.collection("paypalSandboxCaptures");
  function identity(body) {
    if (!/^[a-f0-9-]{36}$/.test(body.requestId || "") ||
        !/^[A-Za-z0-9_-]{43}$/.test(body.accessToken || "")) fail(400, "Identidad de prueba inválida");
    return orders.doc(body.requestId);
  }
  function authorized(order, token) {
    if (!order || order.environment !== "sandbox" || order.expiresAtMs < now() ||
        typeof token !== "string" || hash(token) !== order.accessTokenHash) fail(403, "Acceso inválido o expirado");
  }
  async function read(body) {
    const ref = identity(body);
    const snap = await ref.get();
    const order = snap.exists ? snap.data() : null;
    authorized(order, body.accessToken);
    return {ref, order};
  }
  const state = order => ({environment: "sandbox", estado: order.estado,
    pagado: order.estado === "pagado", amountCentavos: order.amountCentavos, currency: "MXN"});
  function expected(ref, order) {
    return {paypalOrderId: order.paypalOrderId, ordenId: ref.id, amountCentavos: order.amountCentavos, merchantId};
  }
  async function applyRemote(ref, order, remote, event) {
    const capture = remote?.purchase_units?.[0]?.payments?.captures?.[0];
    const validated = remote.status === "COMPLETED" && capture?.status === "COMPLETED" ?
      validateCapture(remote, expected(ref, order)) : null;
    // Even non-completed snapshots must belong to our exact order and receiver.
    if (remote.id !== order.paypalOrderId || remote.purchase_units?.length !== 1 ||
        remote.purchase_units[0].custom_id !== ref.id ||
        remote.purchase_units[0].payee?.merchant_id !== merchantId) fail(502, "Orden o receptor no coincide");
    return db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const current = snap.data();
      const eventRef = event ? events.doc(event.id) : null;
      const receipt = eventRef ? await tx.get(eventRef) : null;
      if (receipt?.exists) return state(current);
      let estado = current.estado;
      const adverse = {"PAYMENT.CAPTURE.REFUNDED": "reembolsado", "PAYMENT.CAPTURE.REVERSED": "revertido",
        "PAYMENT.CAPTURE.DENIED": "denegado", "PAYMENT.CAPTURE.DECLINED": "denegado"};
      if (event && adverse[event.event_type]) {
        const captureId = event.resource?.supplementary_data?.related_ids?.capture_id || event.resource?.id;
        if (!captureId || ![current.captureId, capture?.id].includes(captureId)) fail(409, "Captura no vinculada");
        // Refund can be partial: block the simulated delivery pending reconciliation.
        estado = event.event_type === "PAYMENT.CAPTURE.REFUNDED" ? "revision" : adverse[event.event_type];
      } else if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(capture?.status)) {
        estado = "revision";
      } else if (!terminal.has(current.estado)) {
        if (validated) estado = "pagado";
        else if (capture?.status === "DECLINED" || capture?.status === "FAILED") estado = "denegado";
        else if (current.estado !== "pagado") estado = "pendiente_pago";
      }
      const updated = {...current, estado, updatedAtMs: now(),
        ...(validated ? {captureId: validated.captureId} : {}),
        entregaSimulada: estado === "pagado"};
      tx.set(ref, updated);
      if (validated) tx.set(captures.doc(validated.captureId), {ordenId: ref.id});
      if (eventRef) tx.set(eventRef, {processedAtMs: now(), ordenId: ref.id, type: event.event_type});
      return state(updated);
    });
  }
  return {
    async create(body) {
      const ref = identity(body);
      const priced = quote(body);
      let order = await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        if (snap.exists) {
          const saved = snap.data(); authorized(saved, body.accessToken);
          if (JSON.stringify(saved.items) !== JSON.stringify(priced.items)) fail(409, "Usa una nueva prueba al cambiar producto");
          return saved;
        }
        const saved = {...priced, environment: "sandbox", estado: "pendiente",
          accessTokenHash: hash(body.accessToken), expiresAtMs: now() + 86400000,
          createRequestId: `create-${ref.id}`, captureRequestId: `capture-${ref.id}`, createdAtMs: now()};
        tx.set(ref, saved);
        return saved;
      });
      if (!order.paypalOrderId) {
        if (now() - order.createdAtMs > 5 * 3600000) fail(409, "Creación incierta fuera de ventana idempotente; requiere conciliación manual");
        const remote = await client.createOrder({ordenId: ref.id, amountCentavos: order.amountCentavos,
          requestId: order.createRequestId, returnUrl, cancelUrl: `${returnUrl}?cancel=1`});
        if (!/^[A-Z0-9]{1,40}$/.test(remote.id || "")) fail(502, "Orden PayPal inválida");
        const url = approvalUrl(remote);
        order = await db.runTransaction(async tx => {
          const current = (await tx.get(ref)).data();
          if (current.paypalOrderId && current.paypalOrderId !== remote.id) fail(409, "Orden inconsistente");
          const updated = {...current, paypalOrderId: remote.id, approvalUrl: url};
          tx.set(ref, updated); return updated;
        });
      }
      return {...state(order), url: order.approvalUrl};
    },
    async status(body) {return state((await read(body)).order);},
    async capture(body) {
      const {ref, order} = await read(body);
      if (!order.paypalOrderId) fail(409, "Orden todavía no creada");
      if (terminal.has(order.estado)) return state(order);
      const remote = await client.getOrder(order.paypalOrderId);
      if (remote.status === "APPROVED") {
        const unit = remote.purchase_units?.[0];
        if (remote.id !== order.paypalOrderId || remote.purchase_units?.length !== 1 ||
            unit.custom_id !== ref.id || unit.payee?.merchant_id !== merchantId ||
            unit.amount?.currency_code !== "MXN" ||
            unit.amount?.value !== (order.amountCentavos / 100).toFixed(2)) fail(502, "Orden aprobada no coincide");
        const first = await db.runTransaction(async tx => {
          const current = (await tx.get(ref)).data();
          if (current.captureAttempted || terminal.has(current.estado)) return false;
          tx.set(ref, {...current, captureAttempted: true}); return true;
        });
        if (first) {
          // Persist intent first. A lost response is reconciled by GET, never recaptured blindly.
          await client.captureOrder({...expected(ref, order), requestId: order.captureRequestId});
          return applyRemote(ref, order, await client.getOrder(order.paypalOrderId));
        }
      }
      return applyRemote(ref, order, remote);
    },
    async webhook(event, headers, webhookId) {
      if (!/^[\w-]{1,100}$/.test(event?.id || "") || !await client.verifyWebhook(event, headers, webhookId)) {
        fail(400, "Firma PayPal inválida");
      }
      const accepted = ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.PENDING", "PAYMENT.CAPTURE.DENIED",
        "PAYMENT.CAPTURE.DECLINED", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"];
      if (!accepted.includes(event.event_type)) return {ignored: true};
      let paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
      let ref;
      if (paypalOrderId) {
        const found = await orders.where("paypalOrderId", "==", paypalOrderId).limit(1).get();
        if (!found.empty) ref = found.docs[0].ref;
      } else {
        const captureId = event.resource?.supplementary_data?.related_ids?.capture_id || event.resource?.id;
        if (!/^[A-Z0-9]{1,40}$/.test(captureId || "")) fail(400, "Captura inválida");
        const link = await captures.doc(captureId).get();
        if (link.exists) ref = orders.doc(link.data().ordenId);
      }
      if (!ref) fail(503, "Orden no vinculada todavía; reintentar");
      const order = (await ref.get()).data();
      paypalOrderId = order.paypalOrderId;
      return applyRemote(ref, order, await client.getOrder(paypalOrderId), event);
    },
  };
}
module.exports = {createCheckout, quote, approvalUrl};
