/** Administrative read-only comparison with a recorded Sandbox reference, not a DB repair. */
const {validateCapture} = require("./sandbox");

async function reconcileSandboxOrder({client, expected, now = Date.now}) {
  if (expected?.environment !== "sandbox" || expected.currency !== "MXN" ||
      !/^[a-f0-9-]{36}$/.test(expected.ordenId || "") ||
      ![expected.paypalOrderId, expected.captureId, expected.merchantId].every(
        value => typeof value === "string" && /^[A-Z0-9]{1,40}$/.test(value)) ||
      typeof expected.eventId !== "string" || !/^[\w-]{1,100}$/.test(expected.eventId) ||
      !Number.isSafeInteger(expected.amountCentavos) || expected.amountCentavos <= 0) {
    throw new Error("Referencia Sandbox inválida");
  }
  // Only these GET capabilities are used: no capture, refund, resend or Firestore write.
  const remote = await client.getOrder(expected.paypalOrderId);
  const event = await client.getWebhookEvent(expected.eventId);
  const unit = remote?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const value = (expected.amountCentavos / 100).toFixed(2);
  let validated = false;
  try {validateCapture(remote, expected); validated = true;} catch (_) { /* report review */ }
  const checks = {
    orderIdentity: remote?.id === expected.paypalOrderId && remote.purchase_units?.length === 1 &&
      unit.custom_id === expected.ordenId,
    merchant: unit?.payee?.merchant_id === expected.merchantId,
    orderAmount: unit?.amount?.currency_code === "MXN" && unit.amount.value === value,
    captureIdentity: unit?.payments?.captures?.length === 1 && capture.id === expected.captureId,
    captureCompleted: validated,
    eventIdentity: event?.id === expected.eventId && event.event_type === "PAYMENT.CAPTURE.COMPLETED",
    eventCapture: event?.resource?.id === expected.captureId && event.resource.status === "COMPLETED",
    eventOrder: event?.resource?.supplementary_data?.related_ids?.order_id === expected.paypalOrderId,
    eventAmount: event?.resource?.amount?.currency_code === "MXN" && event.resource.amount.value === value,
  };
  const ok = Object.values(checks).every(Boolean);
  // Do not return provider bodies, payer data, access tokens or approval URLs.
  return {environment: "sandbox", readOnly: true, checkedAtMs: now(),
    comparison: "recorded_reference_not_current_firestore", ok,
    result: ok ? "coincide_referencia" : "requiere_revision", checks};
}
module.exports = {reconcileSandboxOrder};
