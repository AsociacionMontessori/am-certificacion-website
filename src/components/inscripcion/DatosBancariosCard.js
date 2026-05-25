import * as React from "react"
import { useState } from "react"
import {
  CUENTAS_BANCARIAS,
  DATOS_BANCARIOS_INSCRIPCION,
  getCuentaBancaria,
} from "../../data/datosBancarios"
import {
  DATOS_FISCALES_FACTURA_MX,
  FACTURA_FISCAL_SOLO_MEXICO,
} from "../../data/datosFiscalesMexico"

const OpcionFiscal = ({ id, selected, onSelect, titulo, subtitulo }) => (
  <label
    className={`block rounded-xl border px-4 py-3 cursor-pointer min-h-[48px] transition-colors ${
      selected
        ? "border-blue bg-blue/5 ring-2 ring-blue/20"
        : "border-gray/25 bg-white hover:border-blue/30"
    }`}
  >
    <input
      type="radio"
      name="tipoComprobante"
      value={id}
      checked={selected}
      onChange={() => onSelect(id)}
      className="sr-only"
    />
    <span className="block text-sm font-semibold text-black">{titulo}</span>
    <span className="block text-xs text-gray mt-0.5 leading-relaxed">{subtitulo}</span>
  </label>
)

const DatosBancariosCard = ({ compact = false, value, onChange, esMexico = true }) => {
  const [interno, setInterno] = useState("recibo")
  const tipo = value ?? interno
  const setTipo = onChange ?? setInterno
  const cuenta = getCuentaBancaria(tipo === "factura")
  const datos = DATOS_BANCARIOS_INSCRIPCION

  return (
    <aside
      className={`rounded-2xl border border-gray/20 bg-gray/5 ${compact ? "px-4 py-4" : "px-5 py-5"} space-y-4`}
    >
      <div>
        <p className="text-sm font-semibold text-blue">Pago por transferencia bancaria</p>
        <p className="text-xs text-gray leading-relaxed mt-1">
          {esMexico
            ? "Elige el tipo de comprobante fiscal. La cuenta de depósito depende de si necesitas factura con RFC o solo recibo normal."
            : "Desde fuera de México solo aplica recibo normal (sin factura fiscal mexicana)."}
        </p>
      </div>

      {esMexico ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">Tipo de comprobante fiscal (México)</legend>
          <p className="text-xs text-gray leading-relaxed">{FACTURA_FISCAL_SOLO_MEXICO}</p>
          <OpcionFiscal
            id="recibo"
            selected={tipo === "recibo"}
            onSelect={setTipo}
            titulo={CUENTAS_BANCARIAS.recibo.label}
            subtitulo={CUENTAS_BANCARIAS.recibo.subtitulo}
          />
          <OpcionFiscal
            id="factura"
            selected={tipo === "factura"}
            onSelect={setTipo}
            titulo={CUENTAS_BANCARIAS.factura.label}
            subtitulo={CUENTAS_BANCARIAS.factura.subtitulo}
          />
        </fieldset>
      ) : (
        <p className="text-sm rounded-xl border border-gray/20 bg-white px-4 py-3 text-gray">
          <span className="font-semibold text-black">Recibo normal</span> — sin opción de factura
          fiscal (solo disponible en México).
        </p>
      )}

      <article className="rounded-xl border border-blue/20 bg-white px-4 py-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue">
          Cuenta para {cuenta.banco}
        </p>
        <ul className="text-sm text-black space-y-2">
          <li>
            <span className="text-gray">Titular: </span>
            {cuenta.titular}
          </li>
          <li>
            <span className="text-gray">Banco: </span>
            {cuenta.banco}
          </li>
          <li>
            <span className="text-gray">Cuenta: </span>
            <span className="font-mono">{cuenta.cuenta}</span>
          </li>
          <li>
            <span className="text-gray">CLABE: </span>
            <span className="font-mono break-all">{cuenta.clabe}</span>
          </li>
          <li>
            <span className="text-gray">Monto: </span>
            {datos.montoReferencia} {datos.moneda}
          </li>
          <li>
            <span className="text-gray">Concepto: </span>
            {datos.concepto}
          </li>
        </ul>
      </article>

      {esMexico && tipo === "factura" && (
        <div className="rounded-xl border border-yellow/30 bg-yellow/10 px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-black">
            Datos fiscales a enviar (exclusivo México)
          </p>
          <ul className="space-y-1.5">
            {DATOS_FISCALES_FACTURA_MX.map((item) => (
              <li key={item.campo} className="text-xs text-gray leading-relaxed">
                <span className="font-semibold text-black">{item.campo}:</span> {item.detalle}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray leading-relaxed pt-1 border-t border-yellow/25">
            Envía estos datos con tu comprobante de transferencia a{" "}
            <a href={`mailto:${datos.correoComprobante}`} className="text-blue underline">
              {datos.correoComprobante}
            </a>
            .
          </p>
        </div>
      )}

      <p className="text-xs text-gray leading-relaxed">
        Envía tu comprobante a{" "}
        <a href={`mailto:${datos.correoComprobante}`} className="text-blue underline font-medium">
          {datos.correoComprobante}
        </a>
        . Cuando confirmemos el depósito, podrás continuar con tu cuenta y expediente.
      </p>
    </aside>
  )
}

export default DatosBancariosCard
