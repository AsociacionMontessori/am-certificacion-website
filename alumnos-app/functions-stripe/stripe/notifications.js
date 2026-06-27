const admin = require("firebase-admin");
const {escapeHtml} = require("./escape");

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} options
 */
async function notifyAdminPago(db, options) {
  const {subject, html, text, tipo} = options;
  const adminsSnap = await db.collection("admins").where("activo", "==", true).limit(3).get();
  if (adminsSnap.empty) {
    console.warn("No hay admins activos para notificar");
    return;
  }

  const batch = [];
  adminsSnap.forEach((doc) => {
    const email = doc.data()?.email;
    if (!email) return;
    batch.push(
        db.collection("emails_pendientes").add({
          to: email,
          subject,
          html,
          text,
          tipo: tipo || "stripe_pago",
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
          estado: "pendiente",
          intentos: 0,
        }),
    );
  });

  await Promise.all(batch);
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} orden
 */
async function notifyAdminOrdenPagada(db, orden) {
  const cliente = orden.cliente || {};
  const lineasEsc = (orden.lineItems || [])
      .map((l) => escapeHtml(l?.descripcion))
      .join(", ");
  const html = `
    <h2>Nuevo pago recibido (Stripe)</h2>
    <p><strong>Tipo:</strong> ${escapeHtml(orden.tipo)}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(cliente.nombre || "—")} (${escapeHtml(cliente.email || "—")})</p>
    <p><strong>Monto:</strong> ${escapeHtml(orden.monto)} ${escapeHtml(orden.moneda)}</p>
    <p><strong>Conceptos:</strong> ${lineasEsc}</p>
    <p><strong>Orden:</strong> ${escapeHtml(orden.id)}</p>
    ${orden.programa ? `<p><strong>Programa:</strong> ${escapeHtml(orden.programa)}</p>` : ""}
  `;
  const text = `Pago Stripe: ${orden.tipo} - ${cliente.nombre} - ${orden.monto} ${orden.moneda} - Orden ${orden.id}`;

  await notifyAdminPago(db, {
    subject: `Pago en línea: ${orden.tipo} — ${cliente.nombre || cliente.email}`,
    html,
    text,
    tipo: "stripe_orden_publica",
  });
}

/**
 * Email de bienvenida al alumno tras crear cuenta (cola emails_pendientes → Gmail).
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} data
 */
const ONBOARDING_PORTAL_URL = "https://alumnos.certificacionmontessori.com";
const ONBOARDING_VIDEO_URL = "https://youtu.be/utI1VBjNe1Y";
const ONBOARDING_BCC = "sociedadmontessori@gmail.com";
const ONBOARDING_SUBJECT = "Bienvenida a Certificación Montessori";

/**
 * Deriva el "track" de la guía a partir del nivel del portal (cola de la OU),
 * igual que workspace-directory-admin: corta en "&" y en " y ".
 * @param {string} nivelPortal
 * @return {string}
 */
function deriveGuiaTrack(nivelPortal) {
  let track = String(nivelPortal || "").trim().replace(/\/+$/, "");
  track = track.split("/").pop().trim();
  if (track.includes("&")) track = track.split("&")[0].trim();
  if (/ y /i.test(track)) {
    const left = track.split(/ y /i)[0].trim();
    if (left) track = left;
  }
  return track || "tu grupo";
}

async function notifyAlumnoCuentaCreada(db, data) {
  const {
    nombre,
    emailContacto,
    emailInstitucional,
    nivelPortal,
    passwordGenerada,
    passwordAcceso,
  } = data;

  if (!emailContacto) return;

  const guiaTrack = escapeHtml(deriveGuiaTrack(nivelPortal || data.nivelEspecializacion));
  const passwordTexto = passwordGenerada && passwordAcceso ?
    passwordAcceso : "(la que te indicó la asociación)";
  const password = escapeHtml(passwordTexto);
  const usuario = escapeHtml(emailInstitucional || "");
  const alumno = escapeHtml(nombre || "");
  const portalCorto = ONBOARDING_PORTAL_URL.replace("https://", "");

  // Plantilla de bienvenida (réplica de workspace-directory-admin).
  const html = `<html>
  <body>
    <p>¡Hola, <strong>${alumno}</strong>! 😊</p>
    <p>
      Bienvenida al <strong>Diplomado de Certificación para Guía en ${guiaTrack}</strong> 🎉<br>
      Aquí están tus accesos al <strong>Portal del Alumno</strong>:
    </p>
    <ul>
      <li>👤 <strong>Usuario:</strong> ${usuario}</li>
      <li>🔑 <strong>Contraseña:</strong> ${password}</li>
      <li>🌐 <strong>${portalCorto}</strong></li>
    </ul>
    <p>En el portal encontrarás:</p>
    <ul>
      <li><strong>Calendario de materias</strong>, <strong>calificaciones</strong>, <strong>expediente</strong> y <strong>constancias descargables</strong> 📆📈📁</li>
      <li><strong>Accesos directos</strong> a <strong>Gmail</strong>, <strong>Drive</strong>, <strong>Classroom</strong> y <strong>Calendar</strong> ✉️📂🏫</li>
      <li><strong>IA de apoyo académico</strong> con <strong>Gemini</strong>, <strong>Notebooks</strong> y <strong>Gems</strong> para <strong>resúmenes</strong> y <strong>estudio guiado</strong></li>
    </ul>
    <p>📺 <strong>Tutorial para entrar a Classroom:</strong><br>
    En este video puedes ver paso a paso cómo ingresar y usar <strong>Google Classroom</strong>:<br>
    <a href="${ONBOARDING_VIDEO_URL}">${ONBOARDING_VIDEO_URL}</a></p>
    <h3>Primer ingreso</h3>
    <ol>
      <li>Entra a <strong>${portalCorto}</strong> con tu <strong>usuario</strong> y <strong>contraseña</strong>.</li>
      <li>Desde el panel, abre <strong>Classroom</strong> para ver tus materias.</li>
      <li>Al abrir Classroom, <strong>asegúrate de iniciar sesión en Google con la cuenta que te estamos proporcionando</strong>:
        <ul>
          <li>Ve a tu <strong>perfil de Google</strong> (ícono de la esquina superior derecha).</li>
          <li>Elige <strong>"Añadir otra cuenta"</strong> (o <strong>"Agregar cuenta"</strong>).</li>
          <li>Ingresa el <strong>usuario</strong> y la <strong>contraseña</strong> que te compartimos arriba.</li>
          <li>Confirma que estás <strong>en esa cuenta</strong> antes de revisar tus <strong>materias activas</strong> en Classroom.</li>
        </ul>
      </li>
      <li>Usa <strong>Gmail</strong>, <strong>Drive</strong> y <strong>Calendar</strong> para organizar tus actividades.</li>
    </ol>
    <h3>Detalles importantes</h3>
    <ul>
      <li><strong>Sesiones todos los sábados</strong></li>
      <li>Puedes agendar <strong>videollamada con tu catedrático</strong> 💻</li>
      <li><strong>Dudas por Classroom o WhatsApp</strong></li>
      <li><strong>Libros disponibles en Amazon o directamente con nosotros</strong> 📚<br>
        <a href="https://certificacionmontessori.com/publicaciones/">https://certificacionmontessori.com/publicaciones/</a>
      </li>
    </ul>
  </body>
</html>`;

  const text = [
    `¡Hola, ${nombre || ""}!`,
    "",
    `Bienvenida al Diplomado de Certificación para Guía en ${deriveGuiaTrack(nivelPortal || data.nivelEspecializacion)}`,
    "",
    "Tus accesos al Portal del Alumno:",
    `- Usuario: ${emailInstitucional}`,
    `- Contraseña: ${passwordTexto}`,
    `- ${ONBOARDING_PORTAL_URL}`,
    "",
    `Tutorial para entrar a Classroom: ${ONBOARDING_VIDEO_URL}`,
  ].join("\n");

  await db.collection("emails_pendientes").add({
    to: emailContacto,
    bcc: ONBOARDING_BCC,
    subject: ONBOARDING_SUBJECT,
    html,
    text,
    tipo: "inscripcion_cuenta_creada",
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    estado: "pendiente",
    intentos: 0,
  });
}

module.exports = {notifyAdminPago, notifyAdminOrdenPagada, notifyAlumnoCuentaCreada};
