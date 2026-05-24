import { CreditCardIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

/**
 * Acciones de pago: Stripe + comprobante manual (mobile-first).
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
      <button
        type="button"
        onClick={() => onPagarStripe(pago)}
        disabled={isLoading}
        className={`w-full inline-flex min-h-[44px] items-center justify-center px-4 py-2 ${primaryClass} text-white rounded-lg hover:opacity-90 transition-colors font-semibold text-sm disabled:opacity-60`}
      >
        <CreditCardIcon className="w-4 h-4 mr-2 shrink-0" />
        {isLoading ? 'Redirigiendo…' : 'Pagar con tarjeta'}
      </button>
      {!pago.comprobanteUrl && onSubirComprobante && (
        <button
          type="button"
          onClick={() => onSubirComprobante(pago)}
          className="w-full inline-flex min-h-[44px] items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
        >
          <DocumentArrowUpIcon className="w-4 h-4 mr-2 shrink-0" />
          Subir comprobante
        </button>
      )}
    </div>
  );
};

export default PagoStripeActions;
