/**
 * Cloud Functions para Firebase
 * Función para enviar emails de notificaciones sobre materias próximas
 *
 * INSTALACIÓN:
 * 1. cd alumnos-app
 * 2. npm install -g firebase-tools
 * 3. firebase login
 * 4. firebase init functions
 * 5. npm install --prefix functions nodemailer
 * 6. firebase deploy --only functions
 */

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Definir secretos de Firebase (más seguro que config)
// Estos se configuran con: firebase functions:secrets:set EMAIL_USER
const emailUser = defineSecret("EMAIL_USER");
const emailPass = defineSecret("EMAIL_PASS");

// Configurar transporter de email
// Puedes usar Gmail, SendGrid, o cualquier otro servicio SMTP
const getTransporter = (user, pass) => {
  return nodemailer.createTransport({
    service: "gmail", // o 'sendgrid', etc.
    auth: {
      user: user,
      pass: pass,
    },
  });
};

/**
 * Cloud Function que escucha nuevos documentos en 'emails_pendientes'
 * y envía el email correspondiente
 */
exports.enviarEmailNotificacion = onDocumentCreated(
    {
      document: "emails_pendientes/{emailId}",
      region: "us-central1",
      secrets: [emailUser, emailPass],
    },
    async (event) => {
      const snap = event.data;
      if (!snap) {
        console.log("No data in event");
        return null;
      }

      const emailData = snap.data();

      // Solo procesar si está pendiente
      if (emailData.estado !== "pendiente") {
        return null;
      }

      const user = emailUser.value();
      const pass = emailPass.value();
      const transporter = getTransporter(user, pass);

      try {
      // Configurar opciones del email
        const mailOptions = {
          from: user,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        };

        // Enviar email
        await transporter.sendMail(mailOptions);

        // Actualizar estado a 'enviado'
        await snap.ref.update({
          estado: "enviado",
          fechaEnvio: admin.firestore.FieldValue.serverTimestamp(),
          intentos: admin.firestore.FieldValue.increment(1),
        });

        console.log("Email enviado exitosamente a:", emailData.to);
        return {success: true};
      } catch (error) {
        console.error("Error al enviar email:", error);

        // Actualizar intentos
        const intentos = (emailData.intentos || 0) + 1;

        // Si hay más de 3 intentos, marcar como fallido
        if (intentos >= 3) {
          await snap.ref.update({
            estado: "fallido",
            error: error.message,
            intentos: intentos,
          });
        } else {
          await snap.ref.update({
            estado: "reintentando",
            error: error.message,
            intentos: intentos,
          });
        }

        throw error;
      }
    },

);

/**
 * Cloud Function programada que verifica materias próximas diariamente
 * y envía notificaciones si es necesario
 */
exports.verificarMateriasProximas = onSchedule(
    {
      schedule: "0 9 * * *", // Ejecutar diariamente a las 9 AM
      timeZone: "America/Mexico_City",
      region: "us-central1",
      secrets: [emailUser, emailPass],
    },
    async () => {
      const db = admin.firestore();
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const fechaLimite = new Date(hoy);
      fechaLimite.setDate(fechaLimite.getDate() + 7);
      fechaLimite.setHours(23, 59, 59, 999);

      try {
      // Obtener todas las materias con fechaInicio
        const materiasSnapshot = await db.collection("materias")
            .where("fechaInicio", "!=", null)
            .get();

        const materiasProximas = [];

        for (const materiaDoc of materiasSnapshot.docs) {
          const materiaData = materiaDoc.data();
          let fechaInicio = null;

          if (materiaData.fechaInicio) {
            if (materiaData.fechaInicio.toDate) {
              fechaInicio = materiaData.fechaInicio.toDate();
            } else if (materiaData.fechaInicio instanceof Date) {
              fechaInicio = materiaData.fechaInicio;
            }
          }

          if (fechaInicio && fechaInicio >= hoy && fechaInicio <= fechaLimite) {
          // Obtener información del alumno
            let alumnoData = null;
            if (materiaData.alumnoId) {
              const alumnoDoc = await db.collection("alumnos").doc(materiaData.alumnoId).get();
              if (alumnoDoc.exists) {
                alumnoData = {id: alumnoDoc.id, ...alumnoDoc.data()};
              }
            }

            const diasRestantes = Math.ceil((fechaInicio - hoy) / (1000 * 60 * 60 * 24));

            materiasProximas.push({
              materia: {id: materiaDoc.id, ...materiaData},
              alumno: alumnoData,
              fechaInicio: fechaInicio,
              diasRestantes: diasRestantes,
            });
          }
        }

        if (materiasProximas.length === 0) {
          console.log("No hay materias próximas a iniciar");
          return null;
        }

        // Obtener email del administrador (primer admin activo)
        const adminsSnapshot = await db.collection("admins")
            .where("activo", "==", true)
            .limit(1)
            .get();

        if (adminsSnapshot.empty) {
          console.log("No se encontró administrador activo");
          return null;
        }

        const adminData = adminsSnapshot.docs[0].data();
        const adminEmail = adminData.email;

        if (!adminEmail) {
          console.log("El administrador no tiene email configurado");
          return null;
        }

        // Formatear contenido del email
        const htmlContent = formatearMateriasParaEmail(materiasProximas);
        const textContent = formatearMateriasParaEmailTexto(materiasProximas);

        // Crear registro para enviar email
        await db.collection("emails_pendientes").add({
          to: adminEmail,
          subject: `⚠️ Materias Próximas a Iniciar - ${materiasProximas.length} materia(s) requieren atención`,
          html: htmlContent,
          text: textContent,
          tipo: "materias_proximas",
          materiasCount: materiasProximas.length,
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
          estado: "pendiente",
          intentos: 0,
        });

        console.log(`Notificación de ${materiasProximas.length} materias próximas registrada para ${adminEmail}`);
        return {success: true, materiasCount: materiasProximas.length};
      } catch (error) {
        console.error("Error al verificar materias próximas:", error);
        throw error;
      }
    },
);

// Funciones auxiliares para formatear emails (simplificadas)
/**
 * Genera la versión HTML del resumen de materias próximas.
 * @param {Array<Object>} materiasProximas
 * @return {string}
 */
function formatearMateriasParaEmail(materiasProximas) {
  let html = `
    <h2>Materias Próximas a Iniciar (7 días o menos)</h2>
    <p>Se encontraron ${materiasProximas.length} materia(s) que requieren atención:</p>
    <table
      border="1"
      cellpadding="10"
      cellspacing="0"
      style="border-collapse: collapse; width: 100%; margin-top: 20px;"
    >
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th>Alumno</th>
          <th>Materia</th>
          <th>Fecha de Inicio</th>
          <th>Días Restantes</th>
          <th>Nivel</th>
        </tr>
      </thead>
      <tbody>
  `;

  materiasProximas.forEach((item) => {
    const nombreAlumno = item.alumno?.nombre || "N/A";
    const nombreMateria = item.materia?.nombre || "N/A";
    const fechaFormateada = item.fechaInicio.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const nivel = item.alumno?.nivel || item.materia?.nivel || "N/A";
    const diasRestantes = item.diasRestantes;
    const colorFila = diasRestantes <= 3 ? "#fee2e2" : diasRestantes <= 5 ? "#fef3c7" : "#dbeafe";

    html += `
      <tr style="background-color: ${colorFila};">
        <td>${nombreAlumno}</td>
        <td>${nombreMateria}</td>
        <td>${fechaFormateada}</td>
        <td><strong>${diasRestantes} día(s)</strong></td>
        <td>${nivel}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px;">
      <strong>Acción requerida:</strong> Por favor, sube las clases nuevas al Classroom para estos alumnos.
    </p>
  `;

  return html;
}

/**
 * Genera la versión de texto plano del resumen de materias próximas.
 * @param {Array<Object>} materiasProximas
 * @return {string}
 */
function formatearMateriasParaEmailTexto(materiasProximas) {
  let texto = `MATERIAS PRÓXIMAS A INICIAR (7 DÍAS O MENOS)\n\n`;
  texto += `Se encontraron ${materiasProximas.length} materia(s) que requieren atención:\n\n`;

  materiasProximas.forEach((item, index) => {
    const nombreAlumno = item.alumno?.nombre || "N/A";
    const nombreMateria = item.materia?.nombre || "N/A";
    const fechaFormateada = item.fechaInicio.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const nivel = item.alumno?.nivel || item.materia?.nivel || "N/A";
    const diasRestantes = item.diasRestantes;

    texto += `${index + 1}. ${nombreMateria}\n`;
    texto += `   Alumno: ${nombreAlumno}\n`;
    texto += `   Fecha de inicio: ${fechaFormateada}\n`;
    texto += `   Días restantes: ${diasRestantes} día(s)\n`;
    texto += `   Nivel: ${nivel}\n\n`;
  });

  texto += `ACCIÓN REQUERIDA: Por favor, sube las clases nuevas al Classroom para estos alumnos.\n`;

  return texto;
}
