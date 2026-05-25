import * as React from "react"
import { useState } from "react"
import {
  CUENTAS_BANCARIAS,
  DATOS_BANCARIOS_INSCRIPCION,
  getCuentaBancaria,
} from "../../data/datosBancarios"

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

const DatosBancariosCard = ({ compact = false, value, onChange }) => {
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
          Elige el tipo de comprobante fiscal. La cuenta de depósito depende de si
          necesitas factura con RFC o solo recibo normal.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Tipo de comprobante fiscal</legend>
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

      {tipo === "factura" && (
        <p className="text-xs text-gray bg-yellow/10 border border-yellow/30 rounded-lg px-3 py-2 leading-relaxed">
          Para factura fiscal, envía también tu RFC, razón social, régimen fiscal, uso de
          CFDI y correo para facturación junto con tu comprobante.
        </p>
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
