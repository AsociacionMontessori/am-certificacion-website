/**
 * Escape HTML para interpolación segura en cuerpos de correo y plantillas.
 * Cubre los caracteres mínimos para evitar inyección de markup/atributos
 * cuando se construye HTML con template strings.
 * @param {*} value
 * @return {string}
 */
function escapeHtml(value) {
  return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

module.exports = {escapeHtml};
