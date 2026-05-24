const admin = require("firebase-admin");

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
  const lineas = (orden.lineItems || []).map((l) => l.descripcion).join(", ");
  const html = `
    <h2>Nuevo pago recibido (Stripe)</h2>
    <p><strong>Tipo:</strong> ${orden.tipo}</p>
    <p><strong>Cliente:</strong> ${cliente.nombre || "—"} (${cliente.email || "—"})</p>
    <p><strong>Monto:</strong> ${orden.monto} ${orden.moneda}</p>
    <p><strong>Conceptos:</strong> ${lineas}</p>
    <p><strong>Orden:</strong> ${orden.id}</p>
    ${orden.programa ? `<p><strong>Programa:</strong> ${orden.programa}</p>` : ""}
  `;
  const text = `Pago Stripe: ${orden.tipo} - ${cliente.nombre} - ${orden.monto} ${orden.moneda} - Orden ${orden.id}`;

  await notifyAdminPago(db, {
    subject: `Pago en línea: ${orden.tipo} — ${cliente.nombre || cliente.email}`,
    html,
    text,
    tipo: "stripe_orden_publica",
  });
}

module.exports = {notifyAdminPago, notifyAdminOrdenPagada};
