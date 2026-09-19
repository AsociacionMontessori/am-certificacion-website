const {google} = require("googleapis");
const {defineString} = require("firebase-functions/params");
const {
  parseServiceAccountJson,
} = require("./googleWorkspaceClient");

const GOOGLE_SHEETS_SYNC_ENABLED = defineString(
    "GOOGLE_SHEETS_SYNC_ENABLED",
    {default: "false"},
);

const GOOGLE_SHEETS_DIPLOMADO_ID = defineString(
    "GOOGLE_SHEETS_DIPLOMADO_ID",
    {default: ""},
);

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const ALUMNOS_SHEET = "👤Alumnos";
const INSCRIPCIONES_SHEET = "🏫Inscripciones";
const ALUMNOS_TABLE = "Alumnos";
const INSCRIPCIONES_TABLE = "Inscripciones";
const SHEET_TIME_ZONE = "America/Mexico_City";
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const SHEETS_EPOCH_UTC = Date.UTC(1899, 11, 30);

/**
 * Devuelve si la sincronización está habilitada para este proyecto.
 * @return {boolean}
 */
function isSheetsSyncEnabled() {
  const flag = String(GOOGLE_SHEETS_SYNC_ENABLED.value() || "")
      .trim()
      .toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

/**
 * Normaliza texto para comparaciones idempotentes.
 * @param {*} value
 * @return {string}
 */
function normalizeText(value) {
  return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
}

/**
 * Convierte valores Timestamp/Date/string en Date válida.
 * @param {*} value
 * @return {Date|null}
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value.toMillis === "function") {
    const date = new Date(value.toMillis());
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object" && Number.isFinite(value._seconds)) {
    return new Date(value._seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Obtiene las partes de una fecha en la zona horaria operativa.
 * @param {Date} date
 * @param {string} timeZone
 * @return {{year: number, month: number, day: number}}
 */
function datePartsInTimeZone(date, timeZone = SHEET_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
  };
}

/**
 * Convierte una fecha al número serial que usa Google Sheets.
 * @param {*} value
 * @return {number|null}
 */
function toSheetsDateSerial(value) {
  const date = toDate(value);
  if (!date) return null;
  const {year, month, day} = datePartsInTimeZone(date);
  return (Date.UTC(year, month - 1, day) - SHEETS_EPOCH_UTC) / MILLIS_PER_DAY;
}

/**
 * Construye la fila de la pestaña Alumnos sin credenciales.
 * @param {object} data
 * @return {Array<*>}
 */
function buildAlumnoRow(data) {
  const nombre = String(data.nombre || "").trim();
  const email = String(
      data.emailContacto || data.email || data.mailClassroom || "",
  ).trim().toLowerCase();
  const telefono = String(data.telefono || data.telefonoMovil || "").trim();
  const nivel = String(data.nivel || data.nivelEspecializacion || "").trim();

  // La contraseña no se sincroniza. La columna correspondiente sólo existe
  // en Inscripciones y se conserva vacía para las altas automáticas.
  return [nombre, "", email, telefono, nivel, "", "", "", "", "", "", "✓"];
}

/**
 * Construye la fila de Inscripciones y deja vacía la contraseña.
 * @param {object} data
 * @return {Array<*>}
 */
function buildInscripcionRow(data) {
  const nombre = String(data.nombre || "").trim();
  const nivel = String(data.nivelEspecializacion || data.nivel || "").trim();
  const modalidad = String(data.modalidad || "En línea").trim();
  const fechaIngreso = toSheetsDateSerial(
      data.fechaInscripcion || data.fechaIngreso || data.parte1CompletadaAt,
  );
  const emailInstitucional = String(
      data.emailInstitucional || data.mailClassroom || "",
  ).trim().toLowerCase();

  return [
    nombre,
    nivel,
    modalidad,
    fechaIngreso === null ? "" : fechaIngreso,
    "",
    emailInstitucional,
    "", // Contraseña: nunca duplicarla en Sheets.
    "",
    "",
    "",
    "",
  ];
}

/**
 * Crea un cliente Sheets autenticado como la cuenta de servicio.
 * @return {object}
 */
function buildSheetsClient() {
  const serviceAccount = parseServiceAccountJson();
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    throw new Error("Credenciales de Google Sheets no configuradas");
  }
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [SHEETS_SCOPE],
  });
  return google.sheets({version: "v4", auth});
}

/**
 * Lee el identificador y rango actual de una tabla nativa.
 * @param {object} sheets
 * @param {string} spreadsheetId
 * @param {string} sheetTitle
 * @param {string} tableName
 * @return {Promise<object>}
 */
async function getTableContext(sheets, spreadsheetId, sheetTitle, tableName) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
    fields: "sheets(properties(sheetId,title,gridProperties(rowCount))," +
      "tables(tableId,name,range))",
  });
  const sheet = (response.data.sheets || [])
      .find((item) => item.properties?.title === sheetTitle);
  const table = (sheet?.tables || []).find((item) => item.name === tableName);
  if (sheet?.properties?.sheetId == null || !table?.tableId || !table?.range) {
    throw new Error(`No se encontró la tabla ${tableName} en ${sheetTitle}`);
  }
  return {
    sheetId: sheet.properties.sheetId,
    rowCount: sheet.properties.gridProperties?.rowCount || 0,
    table,
  };
}

/**
 * Extrae el número de fila desde la respuesta de values.append.
 * @param {string} updatedRange
 * @return {number}
 */
function parseUpdatedRow(updatedRange) {
  const match = String(updatedRange || "").match(/![A-Z]+(\d+)(?::[A-Z]+\d+)?$/i);
  if (!match) throw new Error("Google Sheets no devolvió la fila actualizada");
  return Number(match[1]);
}

/**
 * Construye una solicitud updateCells para una fórmula.
 * @param {number} sheetId
 * @param {number} rowNumber
 * @param {number} columnIndex
 * @param {string} formulaValue
 * @return {object}
 */
function formulaRequest(sheetId, rowNumber, columnIndex, formulaValue) {
  return {
    updateCells: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: columnIndex,
        endColumnIndex: columnIndex + 1,
      },
      rows: [{values: [{userEnteredValue: {formulaValue}}]}],
      fields: "userEnteredValue",
    },
  };
}

/** Copia formato/validación, restaura fórmulas y amplía la tabla. */
async function styleAndExtendTable({
  sheets,
  spreadsheetId,
  sheetTitle,
  tableName,
  rowNumber,
  columnCount,
  formulaRequests,
}) {
  const current = await getTableContext(
      sheets,
      spreadsheetId,
      sheetTitle,
      tableName,
  );
  const requests = [];

  if (rowNumber > 2) {
    const source = {
      sheetId: current.sheetId,
      startRowIndex: rowNumber - 2,
      endRowIndex: rowNumber - 1,
      startColumnIndex: 0,
      endColumnIndex: columnCount,
    };
    const destination = {
      sheetId: current.sheetId,
      startRowIndex: rowNumber - 1,
      endRowIndex: rowNumber,
      startColumnIndex: 0,
      endColumnIndex: columnCount,
    };
    requests.push(
        {copyPaste: {source, destination, pasteType: "PASTE_FORMAT"}},
        {copyPaste: {source, destination, pasteType: "PASTE_DATA_VALIDATION"}},
    );
  }

  requests.push(...formulaRequests(current.sheetId, rowNumber));

  const currentEndRow = current.table.range.endRowIndex || 0;
  if (currentEndRow < rowNumber) {
    requests.push({
      updateTable: {
        table: {
          tableId: current.table.tableId,
          range: {
            ...current.table.range,
            endRowIndex: rowNumber,
          },
        },
        fields: "range",
      },
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {requests},
    });
  }
}

/** Añade una fila literal y termina de integrarla en la tabla nativa. */
async function appendRow({
  sheets,
  spreadsheetId,
  sheetTitle,
  tableName,
  columnRange,
  columnCount,
  row,
  formulaRequests,
}) {
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!${columnRange}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {majorDimension: "ROWS", values: [row]},
  });
  const rowNumber = parseUpdatedRow(response.data.updates?.updatedRange);
  await styleAndExtendTable({
    sheets,
    spreadsheetId,
    sheetTitle,
    tableName,
    rowNumber,
    columnCount,
    formulaRequests,
  });
  return rowNumber;
}

/**
 * Agrega una actualización de celda sólo cuando existe un valor.
 * @param {Array<object>} data
 * @param {string} range
 * @param {*} value
 */
function addUpdate(data, range, value) {
  if (value === "" || value === null || value === undefined) return;
  data.push({range, majorDimension: "ROWS", values: [[value]]});
}

/**
 * Envía actualizaciones puntuales sin tocar columnas administradas a mano.
 * @param {object} sheets
 * @param {string} spreadsheetId
 * @param {Array<object>} data
 */
async function updateCells(sheets, spreadsheetId, data) {
  if (data.length === 0) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });
}

/**
 * Inserta o actualiza un alumno usando nombre y correo como clave legacy.
 * @param {object} sheets
 * @param {string} spreadsheetId
 * @param {string} alumnoId
 * @param {object} data
 * @return {Promise<object>}
 */
async function upsertAlumnoWithClient(sheets, spreadsheetId, alumnoId, data) {
  const row = buildAlumnoRow(data);
  const [nombre, , email, telefono, nivel] = row;
  if (!nombre || !email) {
    return {status: "skipped", reason: "Faltan nombre o correo", alumnoId};
  }

  const context = await getTableContext(
      sheets,
      spreadsheetId,
      ALUMNOS_SHEET,
      ALUMNOS_TABLE,
  );
  const lastRow = Math.max(context.table.range.endRowIndex || 1, 1);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${ALUMNOS_SHEET}'!A2:C${lastRow}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = response.data.values || [];
  const targetIndex = rows.findIndex((candidate) =>
    normalizeText(candidate[0]) === normalizeText(nombre) &&
    normalizeText(candidate[2]) === normalizeText(email));

  if (targetIndex >= 0) {
    const rowNumber = targetIndex + 2;
    const updates = [];
    addUpdate(updates, `'${ALUMNOS_SHEET}'!A${rowNumber}`, nombre);
    addUpdate(updates, `'${ALUMNOS_SHEET}'!C${rowNumber}`, email);
    addUpdate(updates, `'${ALUMNOS_SHEET}'!D${rowNumber}`, telefono);
    addUpdate(updates, `'${ALUMNOS_SHEET}'!E${rowNumber}`, nivel);
    addUpdate(updates, `'${ALUMNOS_SHEET}'!L${rowNumber}`, "✓");
    await updateCells(sheets, spreadsheetId, updates);
    return {status: "updated", rowNumber, alumnoId};
  }

  const rowNumber = await appendRow({
    sheets,
    spreadsheetId,
    sheetTitle: ALUMNOS_SHEET,
    tableName: ALUMNOS_TABLE,
    columnRange: "A:L",
    columnCount: 12,
    row,
    formulaRequests: (sheetId, targetRow) => [
      formulaRequest(
          sheetId,
          targetRow,
          1,
          "=\"A\"&TEXT(ROW()*1;\"0\")",
      ),
    ],
  });
  return {status: "appended", rowNumber, alumnoId};
}

/**
 * Inserta o actualiza una inscripción por correo institucional.
 * @param {object} sheets
 * @param {string} spreadsheetId
 * @param {string} inscripcionId
 * @param {object} data
 * @return {Promise<object>}
 */
async function upsertInscripcionWithClient(
    sheets,
    spreadsheetId,
    inscripcionId,
    data,
) {
  const row = buildInscripcionRow(data);
  const [nombre, nivel, modalidad, fechaIngreso, , emailInstitucional] = row;
  if (!nombre || !emailInstitucional) {
    return {
      status: "skipped",
      reason: "Faltan nombre o correo institucional",
      inscripcionId,
    };
  }

  const context = await getTableContext(
      sheets,
      spreadsheetId,
      INSCRIPCIONES_SHEET,
      INSCRIPCIONES_TABLE,
  );
  const lastRow = Math.max(context.table.range.endRowIndex || 1, 1);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${INSCRIPCIONES_SHEET}'!F2:F${lastRow}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = response.data.values || [];
  const targetIndex = rows.findIndex((candidate) =>
    normalizeText(candidate[0]) === normalizeText(emailInstitucional));

  if (targetIndex >= 0) {
    const rowNumber = targetIndex + 2;
    const updates = [];
    addUpdate(updates, `'${INSCRIPCIONES_SHEET}'!A${rowNumber}`, nombre);
    addUpdate(updates, `'${INSCRIPCIONES_SHEET}'!B${rowNumber}`, nivel);
    addUpdate(updates, `'${INSCRIPCIONES_SHEET}'!C${rowNumber}`, modalidad);
    addUpdate(updates, `'${INSCRIPCIONES_SHEET}'!D${rowNumber}`, fechaIngreso);
    addUpdate(
        updates,
        `'${INSCRIPCIONES_SHEET}'!F${rowNumber}`,
        emailInstitucional,
    );
    await updateCells(sheets, spreadsheetId, updates);
    return {status: "updated", rowNumber, inscripcionId};
  }

  const rowNumber = await appendRow({
    sheets,
    spreadsheetId,
    sheetTitle: INSCRIPCIONES_SHEET,
    tableName: INSCRIPCIONES_TABLE,
    columnRange: "A:K",
    columnCount: 11,
    row,
    formulaRequests: (sheetId, targetRow) => [
      formulaRequest(
          sheetId,
          targetRow,
          4,
          `=EDATE('${INSCRIPCIONES_SHEET}'!$D${targetRow}; ` +
            `INDEX('🚫Validación de Datos'!$J$3:$J$8; ` +
            `MATCH('${INSCRIPCIONES_SHEET}'!$B${targetRow}; ` +
            `'🚫Validación de Datos'!$I$3:$I$8; 0)))`,
      ),
      formulaRequest(
          sheetId,
          targetRow,
          9,
          `=INDEX('${ALUMNOS_SHEET}'!B:B; ` +
            `MATCH('${INSCRIPCIONES_SHEET}'!$A${targetRow}; ` +
            `'${ALUMNOS_SHEET}'!A:A; 0))`,
      ),
      formulaRequest(
          sheetId,
          targetRow,
          10,
          "=\"I\"&TEXT(ROW()*1;\"0\")",
      ),
    ],
  });
  return {status: "appended", rowNumber, inscripcionId};
}

/**
 * Lee el ID de la hoja configurada para producción.
 * @return {string}
 */
function getConfiguredSpreadsheetId() {
  return String(GOOGLE_SHEETS_DIPLOMADO_ID.value() || "").trim();
}

/**
 * Sincroniza un documento alumno cuando la integración está habilitada.
 * @param {string} alumnoId
 * @param {object} data
 * @return {Promise<object>}
 */
async function syncAlumnoToSheets(alumnoId, data) {
  if (!isSheetsSyncEnabled()) {
    return {status: "skipped", reason: "GOOGLE_SHEETS_SYNC_ENABLED no activo"};
  }
  const spreadsheetId = getConfiguredSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error("Falta GOOGLE_SHEETS_DIPLOMADO_ID");
  }
  return upsertAlumnoWithClient(
      buildSheetsClient(),
      spreadsheetId,
      alumnoId,
      data,
  );
}

/**
 * Sincroniza una inscripción completada cuando la integración está activa.
 * @param {string} inscripcionId
 * @param {object} data
 * @return {Promise<object>}
 */
async function syncInscripcionToSheets(inscripcionId, data) {
  if (!isSheetsSyncEnabled()) {
    return {status: "skipped", reason: "GOOGLE_SHEETS_SYNC_ENABLED no activo"};
  }
  const spreadsheetId = getConfiguredSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error("Falta GOOGLE_SHEETS_DIPLOMADO_ID");
  }
  return upsertInscripcionWithClient(
      buildSheetsClient(),
      spreadsheetId,
      inscripcionId,
      data,
  );
}

module.exports = {
  GOOGLE_SHEETS_SYNC_ENABLED,
  GOOGLE_SHEETS_DIPLOMADO_ID,
  buildAlumnoRow,
  buildInscripcionRow,
  isSheetsSyncEnabled,
  normalizeText,
  syncAlumnoToSheets,
  syncInscripcionToSheets,
  toSheetsDateSerial,
  upsertAlumnoWithClient,
  upsertInscripcionWithClient,
};
