import * as React from "react"
import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"

const Reembolsos = () => (
    <Layout>
        <Nav textColor="text-white" />
        <main>
            <div className="max-w-screen-xl px-10 md:px-20 pb-8 mx-auto my-0 md:my-20">
                <div className="text-white max-w-auto mx-auto mt-20 mb-10">
                    <h2 className="text-2xl md:text-3xl xl:text-4xl font-bold ">
                        <span className="text-red">¡</span>Política de reembolsos<span className="text-red">!</span>
                    </h2>
                    <p className="text-lg md:text-xl xl:text-2xl pt-3">
                        Asociación Montessori de México A.C. (AMMAC) ofrece pagos en línea
                        para inscripciones, colegiaturas, libros y materiales formativos.
                        A continuación se describen las condiciones bajo las cuales pueden
                        solicitarse reembolsos.
                    </p>
                </div>

                <div className="max-w-auto mx-auto mb-10 text-left text-white">

                    <h2 className="text-2xl text-white pt-6">1. Inscripciones a diplomados y formaciones</h2>
                    <p className="pt-2">
                        Si solicitas un reembolso dentro de los <strong>5 días naturales</strong>
                        siguientes al pago <strong>y antes de la fecha de inicio del programa</strong>,
                        se reembolsa el 100% del monto pagado por concepto de inscripción.
                        Después de ese periodo, la inscripción no es reembolsable pero
                        puede transferirse a una siguiente generación, sujeto a disponibilidad
                        y a la decisión de la coordinación académica.
                    </p>

                    <h2 className="text-2xl text-white pt-6">2. Colegiaturas mensuales</h2>
                    <p className="pt-2">
                        Las colegiaturas mensuales se cobran por adelantado por el periodo
                        en curso. Una vez iniciado el mes correspondiente, la colegiatura
                        no es reembolsable. Las suscripciones recurrentes pueden cancelarse
                        en cualquier momento desde el portal de alumnos; la cancelación
                        evita cargos futuros, no genera reembolso del mes vigente.
                    </p>

                    <h2 className="text-2xl text-white pt-6">3. Libros y materiales formativos</h2>
                    <p className="pt-2">
                        Para libros físicos, aplica un periodo de devolución de
                        <strong> 7 días naturales</strong> a partir de la recepción del producto,
                        siempre que se encuentre en condiciones originales (sin uso,
                        sin marcas, en su empaque original). Los costos de envío de
                        devolución corren por cuenta del comprador, salvo en casos de
                        producto dañado o error de envío imputable a AMMAC.
                    </p>
                    <p className="pt-2">
                        Los ebooks y materiales digitales descargables <strong>no son reembolsables</strong>
                        una vez que se ha completado la descarga, dado su carácter
                        intangible e inmediato.
                    </p>

                    <h2 className="text-2xl text-white pt-6">4. Cargos duplicados o errores técnicos</h2>
                    <p className="pt-2">
                        Si detectas un cargo duplicado o un error técnico que resultó en un
                        cobro indebido, escríbenos lo antes posible. Estos casos se resuelven
                        con reembolso íntegro en un plazo no mayor a <strong>5 días hábiles</strong>
                        a partir de la confirmación del error.
                    </p>

                    <h2 className="text-2xl text-white pt-6">5. ¿Cómo solicitar un reembolso?</h2>
                    <p className="pt-2">
                        Envía un correo a
                        {" "}<a className="underline decoration-red" href="mailto:admin@certificacionmontessori.com">admin@certificacionmontessori.com</a>{" "}
                        incluyendo:
                    </p>
                    <ul className="list-disc list-inside pt-2 pl-4">
                        <li>Nombre completo del alumno o comprador.</li>
                        <li>Número de orden o referencia del pago (lo encuentras en el correo de confirmación de Stripe o en tu expediente del portal).</li>
                        <li>Motivo de la solicitud.</li>
                    </ul>
                    <p className="pt-2">
                        También puedes contactarnos por WhatsApp al
                        {" "}<a className="underline decoration-red" href="https://api.whatsapp.com/send?phone=5215548885013" target="_blank" rel="noopener noreferrer">55 4888 5013</a>{" "}
                        de 9:00 a 18:00 horas (CDMX), o por teléfono al
                        {" "}<a className="underline decoration-red" href="tel:5555152701">55 5515 2701</a>.
                    </p>

                    <h2 className="text-2xl text-white pt-6">6. Tiempos de reembolso</h2>
                    <p className="pt-2">
                        Una vez aprobado el reembolso, el monto se devuelve al medio de pago
                        original. En tarjetas de crédito o débito, el reflejo en el estado
                        de cuenta del cliente depende del banco emisor y puede tardar entre
                        <strong> 5 y 15 días hábiles</strong>. AMMAC procesa el reembolso de
                        inmediato a través de Stripe; los tiempos de acreditación son
                        determinados por el banco.
                    </p>

                    <h2 className="text-2xl text-white pt-6">7. Procesamiento de pagos</h2>
                    <p className="pt-2">
                        Los pagos en línea son procesados por <strong>Stripe Payments Mexico</strong>,
                        cumpliendo con los estándares PCI-DSS de seguridad de datos. AMMAC no
                        almacena información de tarjetas en sus sistemas.
                    </p>

                    <h2 className="text-2xl text-white pt-6">8. Modificaciones a esta política</h2>
                    <p className="pt-2">
                        Esta política puede actualizarse en cualquier momento. Las
                        modificaciones se publican en esta misma página. La fecha de última
                        actualización aparece al pie del documento.
                    </p>

                    <p className="text-sm italic pt-6 opacity-80">
                        Última actualización: 25 de mayo de 2026.
                    </p>
                </div>
            </div>
        </main>
    </Layout>
)

export const Head = ({ location }) => (
    <Seo
        title="Política de reembolsos"
        description="Condiciones para solicitar reembolsos de inscripciones, colegiaturas, libros y materiales formativos en Asociación Montessori de México A.C."
        pathname={location.pathname}
    />
)

export default Reembolsos
