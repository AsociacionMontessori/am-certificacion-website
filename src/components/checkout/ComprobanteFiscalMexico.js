import * as React from "react"
import {
  DATOS_FISCALES_FACTURA_MX,
  FACTURA_FISCAL_SOLO_MEXICO,
  NOTA_FACTURA_POST_PAGO,
} from "../../data/datosFiscalesMexico"

/**
 * Selector de comprobante fiscal (solo visitantes desde México).
 */
const ComprobanteFiscalMexico = ({ requiereFacturaFiscal, onChange }) => (
  <fieldset className="space-y-3 rounded-xl border border-gray/20 bg-gray/5 px-4 py-4">
    <legend className="text-sm font-medium text-black px-1">
      Comprobante fiscal (solo México)
    </legend>
    <p className="text-xs text-gray leading-relaxed">{FACTURA_FISCAL_SOLO_MEXICO}</p>

    <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
      <input
        type="radio"
        name="facturaFiscal"
        checked={!requiereFacturaFiscal}
        onChange={() => onChange(false)}
        className="mt-1"
      />
      <span className="text-sm text-black">
        <span className="font-medium">Recibo normal</span>
        <span className="block text-xs text-gray">Sin factura fiscal (público en general)</span>
      </span>
    </label>

    <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
      <input
        type="radio"
        name="facturaFiscal"
        checked={requiereFacturaFiscal}
        onChange={() => onChange(true)}
        className="mt-1"
      />
      <span className="text-sm text-black">
        <span className="font-medium">Factura fiscal con RFC</span>
        <span className="block text-xs text-gray">Para deducciones en México (CFDI)</span>
      </span>
    </label>

    {requiereFacturaFiscal && (
      <div className="rounded-xl border border-blue/25 bg-white px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-blue">
          Datos fiscales que deberás proporcionar (México)
        </p>
        <ul className="space-y-2">
          {DATOS_FISCALES_FACTURA_MX.map((item) => (
            <li key={item.campo} className="text-xs text-gray leading-relaxed">
              <span className="font-semibold text-black">{item.campo}:</span> {item.detalle}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray leading-relaxed pt-1 border-t border-gray/15">
          {NOTA_FACTURA_POST_PAGO}
        </p>
      </div>
    )}
  </fieldset>
)

export default ComprobanteFiscalMexico
