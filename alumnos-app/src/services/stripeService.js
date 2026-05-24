import { auth } from '../config/firebase';

const DEFAULT_ALUMNO_CHECKOUT =
  'https://us-central1-certificacionmontessori.cloudfunctions.net/createAlumnoCheckout';
const DEFAULT_SUBSCRIPTION =
  'https://us-central1-certificacionmontessori.cloudfunctions.net/createSubscriptionCheckout';
const DEFAULT_PORTAL =
  'https://us-central1-certificacionmontessori.cloudfunctions.net/createCustomerPortal';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Debes iniciar sesión para pagar en línea');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const postStripeEndpoint = async (url, body = {}) => {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo conectar con el servicio de pagos');
  }
  if (!data.url) {
    throw new Error('Respuesta de pago incompleta');
  }
  return data.url;
};

export const redirectToAlumnoCheckout = (pagoId) =>
  postStripeEndpoint(import.meta.env.VITE_CHECKOUT_API_URL || DEFAULT_ALUMNO_CHECKOUT, {
    pagoId,
  }).then((url) => {
    window.location.href = url;
  });

export const redirectToSubscriptionCheckout = () =>
  postStripeEndpoint(
    import.meta.env.VITE_SUBSCRIPTION_API_URL || DEFAULT_SUBSCRIPTION,
    {},
  ).then((url) => {
    window.location.href = url;
  });

export const redirectToCustomerPortal = () =>
  postStripeEndpoint(import.meta.env.VITE_STRIPE_PORTAL_URL || DEFAULT_PORTAL, {}).then(
    (url) => {
      window.location.href = url;
    },
  );
