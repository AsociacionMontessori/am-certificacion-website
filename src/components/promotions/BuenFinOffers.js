import * as React from 'react'
import { BUEN_FIN_OFFERS } from '../../data/buenFin2026'
import { buildWhatsAppUrl } from '../../data/contactoWhatsApp'
import useBuenFin from '../../hooks/useBuenFin'
import '../../styles/buen-fin.css'

export default function BuenFinOffers({ programId }) {
  const active = useBuenFin()
  if (!active || programId === 'cosmica') return null
  const offers = programId === 'neuro'
    ? BUEN_FIN_OFFERS.filter(offer => offer.id === 'neuro')
    : programId ? BUEN_FIN_OFFERS.filter(offer => offer.id !== 'neuro') : BUEN_FIN_OFFERS

  return (
    <section id="buen-fin-2026" className="buen-fin" lang="es" aria-labelledby="buen-fin-title" data-testid="buen-fin">
      <div className="buen-fin__inner">
        <div className="buen-fin__heading">
          <p className="buen-fin__eyebrow">AMMAC · Buen Fin 2026</p>
          <h2 id="buen-fin-title">Tu formación empieza con una biblioteca.</h2>
          <p>Del 13 al 17 de noviembre · Hora de Ciudad de México</p>
          <p>Elige tu promoción y solicítala por WhatsApp. Te acompañamos con la inscripción, los libros y el pago.</p>
        </div>
        <div className="buen-fin__grid">
          {offers.map(offer => (
            <article key={offer.id} className="buen-fin__card" data-offer={offer.id}>
              <h3>{offer.title}</h3>
              <p className="buen-fin__price">{offer.price}</p>
              <p className="buen-fin__unit">{offer.unit}</p>
              <p className="buen-fin__benefit">{offer.benefit}</p>
              <p>{offer.details}</p>
              <a href={buildWhatsAppUrl(offer.message)} target="_blank" rel="noopener noreferrer">{offer.cta}<span aria-hidden="true"> ↗</span></a>
            </article>
          ))}
        </div>
        <div className="buen-fin__terms">
          <p><strong>Promociones exclusivamente por WhatsApp.</strong> Antes de pagar, confirma con nuestro equipo la oferta, los títulos, el formato de los dos libros y las condiciones de entrega. El costo de entrega, si corresponde, se confirma por WhatsApp. Los descuentos no se aplican automáticamente en el pago habitual del sitio.</p>
          <p>Vigencia: del 13 de noviembre de 2026 a las 00:00 al 17 de noviembre a las 23:59, hora de Ciudad de México. Requiere inscripción y pago dentro de este periodo. Las ofertas individual y de dos personas no son acumulables entre sí ni con otros descuentos. Educación Cósmica no participa.</p>
          <p>Las colegiaturas de las formaciones de Guía no cambian. El certificado físico, cuando corresponda, se paga aparte: $2,700 MXN más envío.</p>
        </div>
      </div>
    </section>
  )
}
