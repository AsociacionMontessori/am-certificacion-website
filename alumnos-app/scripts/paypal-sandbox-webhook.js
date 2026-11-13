#!/usr/bin/env node
// Reconcile one Sandbox-only webhook through protected Gateway HTTPS egress.
const BASE = 'https://api-m.sandbox.paypal.com';
const URL = 'https://us-central1-certificacionmontessori.cloudfunctions.net/paypalSandboxWebhook';
const EVENTS = ['PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.PENDING',
  'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED'];
async function main() {
  if (Number(process.versions.node.split('.')[0]) < 24 || process.env.NODE_USE_ENV_PROXY !== '1' ||
      !process.env.HTTPS_PROXY || !process.env.NODE_EXTRA_CA_CERTS) throw new Error('protected transport required');
  const id = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const secret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
  if (!id || !secret) throw new Error('credentials required');
  const auth = await fetch(`${BASE}/v1/oauth2/token`, {method: 'POST', redirect: 'error',
    signal: AbortSignal.timeout(20000), body: 'grant_type=client_credentials',
    headers: {'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`}});
  if (!auth.ok) throw new Error('OAuth failed');
  const token = (await auth.json()).access_token;
  if (!token) throw new Error('OAuth incomplete');
  async function request(path, body) {
    const response = await fetch(BASE + path, {method: body ? 'POST' : 'GET', redirect: 'error',
      signal: AbortSignal.timeout(20000), headers: {Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'}, ...(body ? {body: JSON.stringify(body)} : {})});
    if (!response.ok) throw new Error(`PayPal HTTP ${response.status}`);
    return response.json();
  }
  const hooks = (await request('/v1/notifications/webhooks')).webhooks || [];
  const existing = hooks.filter(h => h.url === URL);
  if (existing.length > 1) throw new Error('Duplicate hooks require review');
  let hook = existing[0];
  let created = false;
  if (!hook) {
    const supported = (await request('/v1/notifications/webhooks-event-types')).event_types || [];
    const names = supported.map(e => e.name);
    const events = EVENTS.filter(e => names.includes(e));
    if (!events.includes('PAYMENT.CAPTURE.COMPLETED') || !events.includes('PAYMENT.CAPTURE.REFUNDED')) {
      throw new Error('Required events unavailable');
    }
    hook = await request('/v1/notifications/webhooks', {url: URL, event_types: events.map(name => ({name}))});
    created = true;
  }
  const verified = await request(`/v1/notifications/webhooks/${encodeURIComponent(hook.id)}`);
  if (verified.url !== URL) throw new Error('Webhook URL mismatch');
  process.stdout.write(JSON.stringify({environment: 'sandbox', created, id: verified.id,
    url: verified.url, events: verified.event_types.map(e => e.name)}) + '\n');
}
main().catch(() => {process.stderr.write('Sandbox webhook reconciliation failed; list before retrying.\n'); process.exitCode = 1;});
