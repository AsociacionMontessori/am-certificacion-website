#!/usr/bin/env node
/**
 * Genera/expande static/schools.json con escuelas Montessori consultando la
 * Google Places API (v1 · Text Search). Cobertura: México + países donde
 * opera la AMMAC. Conserva el distintivo ammacCertified de las que ya estaban.
 *
 * Uso:
 *   GOOGLE_PLACES_API_KEY=xxxx node scripts/fetch-montessori-places.mjs
 *
 * Opcional:
 *   DRY_RUN=1   -> solo cuenta consultas, no escribe ni llama a la API
 *
 * Requiere: Node 18+ (fetch nativo). La API key necesita "Places API (New)"
 * habilitada y billing activo en el proyecto de Google Cloud.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "static", "schools.json");
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";

// Zonas a consultar. Cada entrada es una búsqueda de texto.
const MEXICO = [
  "Ciudad de México", "Estado de México", "Guadalajara, Jalisco", "Monterrey, Nuevo León",
  "Puebla", "Querétaro", "León, Guanajuato", "Mérida, Yucatán", "Cancún, Quintana Roo",
  "Tijuana, Baja California", "San Luis Potosí", "Aguascalientes", "Toluca, Estado de México",
  "Cuernavaca, Morelos", "Oaxaca", "Veracruz", "Chihuahua", "Hermosillo, Sonora",
  "Culiacán, Sinaloa", "Morelia, Michoacán", "Saltillo, Coahuila", "Villahermosa, Tabasco",
  "Tuxtla Gutiérrez, Chiapas", "Pachuca, Hidalgo", "Tepic, Nayarit", "Colima",
  "Durango", "Zacatecas", "Campeche", "Chetumal, Quintana Roo", "La Paz, Baja California Sur",
  "Tlaxcala", "Acapulco, Guerrero",
];
const INTERNACIONAL = [
  "Bogotá, Colombia", "Medellín, Colombia", "San Juan, Puerto Rico",
  "Madrid, España", "Barcelona, España", "San José, Costa Rica",
  "Miami, Estados Unidos", "Los Ángeles, Estados Unidos", "Houston, Estados Unidos",
  "Tel Aviv, Israel", "Jerusalén, Israel", "Zúrich, Suiza", "Ginebra, Suiza",
  "Nueva Delhi, India", "Bombay, India",
];
const REGIONS = [...MEXICO, ...INTERNACIONAL];

const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.internationalPhoneNumber",
  "places.websiteUri", "places.location", "places.addressComponents",
  "nextPageToken",
].join(",");

const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

function comp(place, type) {
  const c = (place.addressComponents || []).find((x) => (x.types || []).includes(type));
  return c ? c.longText || c.shortText || "" : "";
}

async function searchText(query, pageToken) {
  const body = { textQuery: `escuela Montessori en ${query}`, languageCode: "es" };
  if (pageToken) body.pageToken = pageToken;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  // Cargar lo existente para conservar ammacCertified y fusionar.
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(OUT, "utf-8")).schools || [];
  } catch { /* primera corrida */ }
  const byKey = new Map();
  const keyOf = (s) => (s.placeId ? `id:${s.placeId}` : `na:${(s.name || "").toLowerCase()}|${(s.address || "").toLowerCase()}`);
  for (const s of existing) byKey.set(keyOf(s), s);
  const certified = new Set(existing.filter((s) => s.ammacCertified).map((s) => `${(s.name || "").toLowerCase()}`));

  if (DRY_RUN) {
    console.log(`DRY_RUN: ${REGIONS.length} zonas, hasta 3 páginas c/u = ~${REGIONS.length * 3} llamadas máx.`);
    console.log("Zonas:", REGIONS.join(" · "));
    return;
  }
  if (!API_KEY) {
    console.error("Falta GOOGLE_PLACES_API_KEY. Crea la key (Places API New + billing) y reintenta.");
    process.exit(1);
  }

  let added = 0, calls = 0;
  for (const region of REGIONS) {
    let token = null, page = 0;
    do {
      const data = await searchText(region, token);
      calls++;
      for (const p of data.places || []) {
        const name = norm(p.displayName?.text);
        const address = norm(p.formattedAddress);
        if (!name) continue;
        const rec = {
          name,
          address,
          city: comp(p, "locality") || comp(p, "administrative_area_level_2"),
          state: comp(p, "administrative_area_level_1"),
          country: comp(p, "country") || "",
          phone: norm(p.nationalPhoneNumber || p.internationalPhoneNumber),
          website: norm(p.websiteUri),
          lat: p.location?.latitude,
          lng: p.location?.longitude,
          placeId: p.id,
          ammacCertified: certified.has(name.toLowerCase()) || /kalpilli/i.test(name),
          source: "google-places",
        };
        const k = keyOf(rec);
        if (!byKey.has(k)) added++;
        // conservar bandera AMMAC si ya existía
        const prev = byKey.get(k);
        if (prev?.ammacCertified) rec.ammacCertified = true;
        byKey.set(k, rec);
      }
      token = data.nextPageToken || null;
      page++;
      if (token) await new Promise((r) => setTimeout(r, 2000)); // el token tarda en activarse
    } while (token && page < 3);
    process.stdout.write(`  ${region}: ${(byKey.size)} acumuladas\r`);
  }

  const schools = [...byKey.values()].sort(
    (a, b) => Number(b.ammacCertified) - Number(a.ammacCertified)
      || (a.country || "").localeCompare(b.country || "")
      || (a.state || "").localeCompare(b.state || "")
      || (a.name || "").localeCompare(b.name || "")
  );
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: null, count: schools.length, schools }, null, 1));
  console.log(`\nListo: ${schools.length} escuelas (${added} nuevas) en ${calls} llamadas. AMMAC: ${schools.filter((s) => s.ammacCertified).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
