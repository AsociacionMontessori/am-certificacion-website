const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAlumnoRow,
  buildInscripcionRow,
  normalizeText,
  toSheetsDateSerial,
  upsertInscripcionWithClient,
} = require("../stripe/googleSheetsSync");

test("normaliza nombres para detectar filas existentes", () => {
  assert.equal(normalizeText("  María  José Ávila "), "maria jose avila");
});

test("convierte la fecha usando el día civil de Ciudad de México", () => {
  const value = toSheetsDateSerial(new Date("2026-09-19T02:00:00.000Z"));
  const expected = (Date.UTC(2026, 8, 18) - Date.UTC(1899, 11, 30)) /
    (24 * 60 * 60 * 1000);
  assert.equal(value, expected);
});

test("mapea un alumno sin copiar contraseñas ni datos documentales", () => {
  const row = buildAlumnoRow({
    nombre: "Alumno de prueba",
    emailContacto: "FAMILIA@EXAMPLE.COM",
    telefono: "5555555555",
    nivel: "Taller",
    passwordTemporal: "no-debe-salir",
    passwordClassroom: "tampoco-debe-salir",
  });

  assert.deepEqual(row, [
    "Alumno de prueba",
    "",
    "familia@example.com",
    "5555555555",
    "Taller",
    "",
    "",
    "",
    "",
    "",
    "",
    "✓",
  ]);
  assert.equal(row.includes("no-debe-salir"), false);
  assert.equal(row.includes("tampoco-debe-salir"), false);
});

test("mapea la inscripción y mantiene vacía la columna Contraseña", () => {
  const row = buildInscripcionRow({
    nombre: "Alumno de prueba",
    nivelEspecializacion: "Casa de Niños",
    modalidad: "En línea",
    fechaIngreso: new Date("2026-09-19T18:00:00.000Z"),
    emailInstitucional: "ALUMNO@CERTIFICACIONMONTESSORI.COM",
    passwordTemporal: "secreto",
  });

  assert.equal(row.length, 11);
  assert.equal(row[0], "Alumno de prueba");
  assert.equal(row[1], "Casa de Niños");
  assert.equal(row[2], "En línea");
  assert.equal(typeof row[3], "number");
  assert.equal(row[5], "alumno@certificacionmontessori.com");
  assert.equal(row[6], "");
  assert.equal(row.includes("secreto"), false);
});

test("actualiza una inscripción existente sin leer ni escribir la columna G", async () => {
  const calls = [];
  const sheets = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [{
            properties: {sheetId: 70940485, title: "🏫Inscripciones"},
            tables: [{
              tableId: "1818716126",
              name: "Inscripciones",
              range: {
                sheetId: 70940485,
                startRowIndex: 0,
                endRowIndex: 172,
                startColumnIndex: 0,
                endColumnIndex: 11,
              },
            }],
          }],
        },
      }),
      values: {
        get: async ({range}) => {
          calls.push({kind: "get", range});
          return {data: {values: [["alumno@certificacionmontessori.com"]]}};
        },
        batchUpdate: async ({requestBody}) => {
          calls.push({kind: "batchUpdate", data: requestBody.data});
          return {data: {}};
        },
      },
    },
  };

  const result = await upsertInscripcionWithClient(
      sheets,
      "spreadsheet-id",
      "inscripcion-id",
      {
        nombre: "Alumno de prueba",
        nivelEspecializacion: "Taller",
        modalidad: "En línea",
        fechaInscripcion: new Date("2026-09-19T18:00:00.000Z"),
        emailInstitucional: "alumno@certificacionmontessori.com",
        passwordTemporal: "no-se-copia",
      },
  );

  assert.equal(result.status, "updated");
  assert.deepEqual(calls[0], {
    kind: "get",
    range: "'🏫Inscripciones'!F2:F172",
  });
  const writtenRanges = calls[1].data.map((entry) => entry.range);
  assert.deepEqual(writtenRanges, [
    "'🏫Inscripciones'!A2",
    "'🏫Inscripciones'!B2",
    "'🏫Inscripciones'!C2",
    "'🏫Inscripciones'!D2",
    "'🏫Inscripciones'!F2",
  ]);
  assert.equal(writtenRanges.some((range) => range.includes("!G")), false);
  assert.equal(JSON.stringify(calls).includes("no-se-copia"), false);
});

test("añade una inscripción, restaura fórmulas y amplía la tabla", async () => {
  const calls = [];
  const table = {
    tableId: "1818716126",
    name: "Inscripciones",
    range: {
      sheetId: 70940485,
      startRowIndex: 0,
      endRowIndex: 172,
      startColumnIndex: 0,
      endColumnIndex: 11,
    },
  };
  const sheets = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [{
            properties: {sheetId: 70940485, title: "🏫Inscripciones"},
            tables: [table],
          }],
        },
      }),
      batchUpdate: async ({requestBody}) => {
        calls.push({kind: "sheetBatchUpdate", requests: requestBody.requests});
        return {data: {}};
      },
      values: {
        get: async () => ({data: {values: []}}),
        append: async ({requestBody}) => {
          calls.push({kind: "append", values: requestBody.values});
          return {data: {updates: {updatedRange: "'🏫Inscripciones'!A173:K173"}}};
        },
      },
    },
  };

  const result = await upsertInscripcionWithClient(
      sheets,
      "spreadsheet-id",
      "inscripcion-id",
      {
        nombre: "Alta nueva",
        nivelEspecializacion: "Taller",
        modalidad: "En línea",
        fechaInscripcion: new Date("2026-09-19T18:00:00.000Z"),
        emailInstitucional: "alta@certificacionmontessori.com",
        passwordClassroom: "no-se-copia",
      },
  );

  assert.equal(result.status, "appended");
  assert.equal(result.rowNumber, 173);
  assert.equal(calls[0].values[0][6], "");
  assert.equal(JSON.stringify(calls).includes("no-se-copia"), false);

  const requests = calls[1].requests;
  const formulaColumns = requests
      .filter((request) => request.updateCells)
      .map((request) => request.updateCells.range.startColumnIndex);
  assert.deepEqual(formulaColumns, [4, 9, 10]);
  assert.equal(requests.some((request) =>
    request.updateCells?.range?.startColumnIndex === 6), false);
  const updateTable = requests.find((request) => request.updateTable);
  assert.equal(updateTable.updateTable.table.range.endRowIndex, 173);
});
