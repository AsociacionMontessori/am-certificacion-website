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
async function notifyAlumnoCuentaCreada(db, data) {
  const {
    nombre,
    emailContacto,
    emailInstitucional,
    portalUrl,
    nivelEspecializacion,
    passwordGenerada,
    passwordAcceso,
  } = data;

  if (!emailContacto) return;

  const incluyePassword = passwordGenerada && passwordAcceso;
  const accesoHtml = incluyePassword
    ? `<p><strong>Contraseña inicial</strong> (misma para el portal y Google Classroom): <code>${escapeHtml(passwordAcceso)}</code></p>
       <p>Te recomendamos guardarla en un lugar seguro. También queda registrada en tu expediente del portal.</p>`
    : "<p>Usa la contraseña que te indicó la asociación para el portal y Classroom.</p>";

  const html = `
    <h2>Bienvenido/a a Certificación Montessori</h2>
    <p>Hola ${escapeHtml(nombre || "")},</p>
    <p>Tu pago de inscripción fue registrado. Ya creamos tu usuario institucional y tu acceso al portal.</p>
    <ul>
      <li><strong>Usuario:</strong> ${escapeHtml(emailInstitucional)}</li>
      <li><strong>Portal:</strong> <a href="${escapeHtml(portalUrl)}">${escapeHtml(portalUrl)}</a></li>
      <li><strong>Programa:</strong> ${escapeHtml(nivelEspecializacion || "—")}</li>
      <li><strong>Modalidad:</strong> En línea</li>
    </ul>
    ${accesoHtml}
    <p>En los próximos pasos completa tu expediente administrativo (documentos y reglamento firmado).</p>
    <p>Asociación Montessori de México A.C.</p>
  `;
  const text = incluyePassword
    ? `Cuenta: ${emailInstitucional} — Portal: ${portalUrl} — Contraseña enviada en este correo.`
    : `Cuenta creada: ${emailInstitucional} — Portal: ${portalUrl}`;

  await db.collection("emails_pendientes").add({
    to: emailContacto,
    cc: "sociedadmontessori@gmail.com",
    subject: "Tu cuenta en Certificación Montessori está lista",
    html,
    text,
    tipo: "inscripcion_cuenta_creada",
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    estado: "pendiente",
    intentos: 0,
  });
}

module.exports = {notifyAdminPago, notifyAdminOrdenPagada, notifyAlumnoCuentaCreada};
