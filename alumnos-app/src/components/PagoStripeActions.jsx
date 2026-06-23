import { CreditCardIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { stripeCheckoutEnabled } from '../utils/featureFlags';

/**
 * Acciones de pago: Stripe + comprobante manual (mobile-first).
 *
 * Cuando `stripeCheckoutEnabled` es false (default mientras Stripe Live se
 * activa), se oculta el botón "Pagar con tarjeta" y se promueve "Subir
 * comprobante" como acción primaria.
 */
const PagoStripeActions = ({
  pago,
  stripeLoadingId,
  onPagarStripe,
  onSubirComprobante,
  primaryClass = 'bg-blue',
}) => {
  const isLoading = stripeLoadingId === pago.id;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {stripeCheckoutEnabled && (
        <button
          type="button"
          onClick={() => onPagarStripe(pago)}
          disabled={isLoading}
          className={`w-full inline-flex min-h-[44px] items-center justify-center px-4 py-2 ${primaryClass} text-white rounded-lg hover:opacity-90 transition-colors font-semibold text-sm disabled:opacity-60`}
        >
          <CreditCardIcon className="w-4 h-4 mr-2 shrink-0" />
          {isLoading ? 'Redirigiendo…' : 'Pagar con tarjeta'}
        </button>
      )}
      {!pago.comprobanteUrl && onSubirComprobante && (
        <button
          type="button"
          onClick={() => onSubirComprobante(pago)}
          className={`w-full inline-flex min-h-[44px] items-center justify-center px-4 py-2 rounded-lg hover:opacity-90 transition-colors font-semibold text-sm ${stripeCheckoutEnabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium' : `${primaryClass} text-white`}`}
        >
          <DocumentArrowUpIcon className="w-4 h-4 mr-2 shrink-0" />
          Subir comprobante de transferencia
        </button>
      )}
    </div>
  );
};

export default PagoStripeActions;
