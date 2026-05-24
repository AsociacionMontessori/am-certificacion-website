/**
 * Copia alumnos-app/functions/stripe → functions-stripe/stripe antes de deploy.
 * Uso: node scripts/sync-stripe-functions.js
 */

import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'functions/stripe');
const dest = join(root, 'functions-stripe/stripe');

mkdirSync(dest, { recursive: true });
for (const file of readdirSync(src)) {
  if (file.endsWith('.js')) {
    cpSync(join(src, file), join(dest, file));
  }
}
console.warn(`Sincronizado: ${src} → ${dest}`);
