/** PayPal Orders v2 preparation. Not exported as a Cloud Function; sandbox only. */
const BASE = "https://api-m.sandbox.paypal.com";

async function authenticateSandbox({clientId, clientSecret, fetchImpl = fetch}) {
  if (!clientId || !clientSecret) throw new Error("Falta configuración PayPal sandbox");
  const auth = await fetchImpl(`${BASE}/v1/oauth2/token`, {
    method: "POST", signal: AbortSignal.timeout(15000), redirect: "error",
    headers: {Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"},
    body: "grant_type=client_credentials",
  });
  if (!auth.ok) throw new Error(`No se pudo autenticar PayPal sandbox (HTTP ${auth.status})`);
  const data = await auth.json();
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Autenticación PayPal incompleta");
  }
  return data.access_token;
}

/** Connectivity probe: deliberately returns no credential, token or provider body. */
async function checkSandboxConnection(options) {
  await authenticateSandbox(options);
  return {ok: true, environment: "sandbox"};
}

function validateCapture(order, expected) {
  const units = order?.purchase_units;
  if (order?.id !== expected.paypalOrderId || order.status !== "COMPLETED" ||
      !Array.isArray(units) || units.length !== 1) throw new Error("Captura no confirmada");
  const unit = units[0];
  const captures = unit.payments?.captures;
  if (unit.custom_id !== expected.ordenId || unit.payee?.merchant_id !== expected.merchantId ||
      !Array.isArray(captures) || captures.length !== 1) throw new Error("Orden o beneficiario no coincide");
  const capture = captures[0];
  const value = (expected.amountCentavos / 100).toFixed(2);
  if (!Number.isSafeInteger(expected.amountCentavos) || expected.amountCentavos <= 0 ||
      capture.status !== "COMPLETED" || capture.amount?.currency_code !== "MXN" ||
      capture.amount?.value !== value || !capture.id) throw new Error("Importe o estado de captura inválido");
  return {captureId: capture.id, amountCentavos: expected.amountCentavos, currency: "MXN"};
}

function createSandboxClient({clientId, clientSecret, merchantId, fetchImpl = fetch}) {
  if (!clientId || !clientSecret || !merchantId) throw new Error("Falta configuración PayPal sandbox");
  async function request(path, {body, requestId, method = "POST"} = {}) {
    // Tokens stay in this call; never returned or logged. No automatic retry of captures.
    const token = await authenticateSandbox({clientId, clientSecret, fetchImpl});
    const response = await fetchImpl(`${BASE}${path}`, {
      method, signal: AbortSignal.timeout(20000), redirect: "error",
      headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        ...(requestId ? {"PayPal-Request-Id": requestId, Prefer: "return=representation"} : {})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    if (!response.ok) throw new Error(`PayPal sandbox respondió HTTP ${response.status}`);
    return response.json();
  }
  function idempotencyKey(key) {
    if (typeof key !== "string" || !/^[\w-]{1,108}$/.test(key)) throw new Error("Clave idempotente requerida");
    return key;
  }
  return {
    async createOrder({ordenId, amountCentavos, requestId, returnUrl, cancelUrl}) {
      // Parent must resolve amount from its server-side catalog, never from req.body.
      if (typeof ordenId !== "string" || !/^[\w-]{1,100}$/.test(ordenId) || !Number.isSafeInteger(amountCentavos) || amountCentavos <= 0) {
        throw new Error("Orden o monto inválido");
      }
      return request("/v2/checkout/orders", {
        requestId: idempotencyKey(requestId),
        body: {intent: "CAPTURE", ...(returnUrl && cancelUrl ? {payment_source: {paypal: {
          experience_context: {return_url: returnUrl, cancel_url: cancelUrl,
            user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING"},
        }}} : {}), purchase_units: [{custom_id: ordenId,
          payee: {merchant_id: merchantId},
          amount: {currency_code: "MXN", value: (amountCentavos / 100).toFixed(2)}}]},
      });
    },
    async getOrder(paypalOrderId) {
      if (!/^[A-Z0-9]{1,40}$/.test(paypalOrderId)) throw new Error("ID PayPal inválido");
      return request(`/v2/checkout/orders/${paypalOrderId}`, {method: "GET"});
    },
    async getWebhookEvent(eventId) {
      if (typeof eventId !== "string" || !/^[\w-]{1,100}$/.test(eventId)) throw new Error("ID de evento inválido");
      return request(`/v1/notifications/webhooks-events/${eventId}`, {method: "GET"});
    },
    async verifyWebhook(event, headers, webhookId) {
      if (!webhookId || !event?.id) return false;
      const fields = {auth_algo: headers["paypal-auth-algo"], cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"], transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"]};
      if (Object.values(fields).some(v => typeof v !== "string" || !v)) return false;
      const result = await request("/v1/notifications/verify-webhook-signature", {
        body: {...fields, webhook_id: webhookId, webhook_event: event},
      });
      return result.verification_status === "SUCCESS";
    },
    async captureOrder({paypalOrderId, ordenId, amountCentavos, requestId}) {
      if (!/^[A-Z0-9]{1,40}$/.test(paypalOrderId)) throw new Error("ID PayPal inválido");
      const order = await request(`/v2/checkout/orders/${paypalOrderId}/capture`, {
        requestId: idempotencyKey(requestId), body: {},
      });
      return validateCapture(order, {paypalOrderId, ordenId, amountCentavos, merchantId});
    },
  };
}
module.exports = {createSandboxClient, validateCapture, checkSandboxConnection};
