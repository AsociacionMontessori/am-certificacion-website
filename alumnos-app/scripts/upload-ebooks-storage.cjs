/**
 * Sube/actualiza los archivos digitales (EPUB + PDF) de los libros de Roxana
 * a Firebase Storage, en las rutas que espera el backend
 * (functions-stripe/stripe/digitalBooks.js).
 *
 * Uso:
 *   # Con service account del proyecto certificacionmontessori:
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/sa-certificacionmontessori.json \
 *     node scripts/upload-ebooks-storage.js
 *
 *   # Vista previa sin subir nada:
 *   node scripts/upload-ebooks-storage.js --dry-run
 *
 * Requiere credenciales con permiso de escritura en el bucket
 * certificacionmontessori.firebasestorage.app (Storage Admin / Editor).
 */

const fs = require("fs");
const path = require("path");

// firebase-admin vive en functions-stripe/node_modules; se carga perezosamente
// solo cuando se va a subir de verdad (así --dry-run no requiere la dependencia).
function loadAdmin() {
  const adminPath = require.resolve("firebase-admin", {
    paths: [path.join(__dirname, "../functions-stripe/node_modules")],
  });
  return require(adminPath);
}

const BUCKET = "certificacionmontessori.firebasestorage.app";
const KDP_ROOT = "/home/carlos/Documentos/KDP_Roxana";
const DRY_RUN = process.argv.includes("--dry-run");

// origen local (relativo a KDP_ROOT) → ruta destino en Storage.
// Nota: libros 1 y 2 usan el interior de tapa blanda como PDF legible
// (no existe variante interactiva en su build); 3 y 4 usan *_digital.pdf;
// 5 («La mente absorbente») usa la variante interactiva (_interactivo.pdf).
const MANIFEST = [
  {
    src: "libro1_pedagogia_cientifica/build/libro1_pedagogia_cientifica.epub",
    dest: "ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.epub",
    contentType: "application/epub+zip",
  },
  {
    src: "libro1_pedagogia_cientifica/build/libro1_pedagogia_cientifica_paperback_interior.pdf",
    dest: "ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.pdf",
    contentType: "application/pdf",
  },
  {
    src: "libro2_secreto_infancia/build/libro2_secreto_infancia.epub",
    dest: "ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.epub",
    contentType: "application/epub+zip",
  },
  {
    src: "libro2_secreto_infancia/build/libro2_secreto_infancia_paperback_interior.pdf",
    dest: "ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.pdf",
    contentType: "application/pdf",
  },
  {
    src: "KDP_Edu_Cosmica/edu_cosmica/build/edu_cosmica.epub",
    dest: "ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.epub",
    contentType: "application/epub+zip",
  },
  {
    src: "KDP_Edu_Cosmica/edu_cosmica/build/edu_cosmica_digital.pdf",
    dest: "ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.pdf",
    contentType: "application/pdf",
  },
  {
    src: "KDP_guines_cosmica/guiones_cosmica/build/guiones_cosmica.epub",
    dest: "ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.epub",
    contentType: "application/epub+zip",
  },
  {
    src: "KDP_guines_cosmica/guiones_cosmica/build/guiones_cosmica_digital.pdf",
    dest: "ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.pdf",
    contentType: "application/pdf",
  },
  {
    src: "kdp_mente_absorbente/build/kdp_mente_absorbente.epub",
    dest: "ebooks/ammac-libro-5/la-mente-absorbente-roxana-munoz.epub",
    contentType: "application/epub+zip",
  },
  {
    src: "kdp_mente_absorbente/build/kdp_mente_absorbente_interactivo.pdf",
    dest: "ebooks/ammac-libro-5/la-mente-absorbente-roxana-munoz.pdf",
    contentType: "application/pdf",
  },
];

async function main() {
  // --only <substr>: filtra el manifiesto a las entradas cuyo destino contenga
  // <substr> (p. ej. "ammac-libro-5" para subir solo «La mente absorbente»).
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
  const manifest = only ? MANIFEST.filter((m) => m.dest.includes(only)) : MANIFEST;
  if (only && manifest.length === 0) {
    console.error(`❌ --only "${only}" no coincide con ninguna entrada del manifiesto.`);
    process.exit(1);
  }
  if (only) console.log(`Filtro --only "${only}": ${manifest.length} archivo(s).`);

  // Verifica que todos los archivos fuente existan antes de tocar nada.
  const missing = manifest.filter((m) => !fs.existsSync(path.join(KDP_ROOT, m.src)));
  if (missing.length) {
    console.error("❌ Faltan archivos fuente:");
    missing.forEach((m) => console.error("   " + m.src));
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("DRY RUN — no se sube nada. Mapeo:");
    manifest.forEach((m) => console.log(`  ${m.src}\n    → gs://${BUCKET}/${m.dest}`));
    return;
  }

  const admin = loadAdmin();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: BUCKET,
    });
  }
  const bucket = admin.storage().bucket();

  for (const m of manifest) {
    const local = path.join(KDP_ROOT, m.src);
    process.stdout.write(`Subiendo ${m.dest} ... `);
    await bucket.upload(local, {
      destination: m.dest,
      metadata: {contentType: m.contentType, cacheControl: "private, max-age=0, no-store"},
    });
    console.log("ok");
  }
  console.log(`\n✔ ${manifest.length} archivos actualizados en gs://${BUCKET}/ebooks/`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
