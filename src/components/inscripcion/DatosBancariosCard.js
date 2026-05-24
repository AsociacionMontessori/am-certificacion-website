import * as React from "react"
import { DATOS_BANCARIOS_INSCRIPCION, tieneDatosBancariosCompletos } from "../../data/datosBancarios"

const DatosBancariosCard = ({ compact = false }) => {
  const datos = DATOS_BANCARIOS_INSCRIPCION
  const completo = tieneDatosBancariosCompletos()

  return (
    <aside
      className={`rounded-2xl border border-gray/20 bg-gray/5 ${compact ? "px-4 py-4" : "px-5 py-5"} space-y-3`}
    >
      <p className="text-sm font-semibold text-blue">Pago por transferencia bancaria</p>
      <p className="text-xs text-gray leading-relaxed">
        Si prefieres no pagar con tarjeta, transfiere el monto de inscripción y conserva
        tu comprobante para el expediente.
      </p>

      <ul className="text-sm text-black space-y-2">
        <li>
          <span className="text-gray">Titular: </span>
          {datos.titular}
        </li>
        <li>
          <span className="text-gray">Banco: </span>
          {datos.banco}
        </li>
        {datos.cuenta && (
          <li>
            <span className="text-gray">Cuenta: </span>
            <span className="font-mono">{datos.cuenta}</span>
          </li>
        )}
        {datos.clabe && (
          <li>
            <span className="text-gray">CLABE: </span>
            <span className="font-mono break-all">{datos.clabe}</span>
          </li>
        )}
        <li>
          <span className="text-gray">Monto: </span>
          {datos.montoReferencia} {datos.moneda}
        </li>
        <li>
          <span className="text-gray">Concepto: </span>
          {datos.concepto}
        </li>
      </ul>

      {!completo && (
        <p className="text-xs text-yellow-800 bg-yellow/15 rounded-lg px-3 py-2">
          CLABE/cuenta pendiente de configurar en el sitio. Escríbenos a{" "}
          <a href={`mailto:${datos.correoComprobante}`} className="text-blue underline">
            {datos.correoComprobante}
          </a>{" "}
          para recibir los datos bancarios.
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
