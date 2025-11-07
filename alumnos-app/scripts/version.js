#!/usr/bin/env node
/* eslint-env node */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const incrementVersion = (version, type) => {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Tipo de versión inválido: ${type}`);
  }
};

const updatePackageJson = (newVersion) => {
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ package.json actualizado a versión ${newVersion}`);
};

const updateVersionJs = (newVersion) => {
  const versionPath = join(rootDir, 'src/utils/version.js');
  const versionContent = `// Versión de la aplicación
export const VERSION = '${newVersion}';
export const VERSION_INFO = {
  version: '${newVersion}',
  buildDate: new Date().toISOString()
};
`;
  writeFileSync(versionPath, versionContent);
  console.log(`✅ src/utils/version.js actualizado a versión ${newVersion}`);
};

const updateChangelog = (newVersion, type) => {
  const changelogPath = join(rootDir, 'CHANGELOG.md');
  let changelog = '';
  
  try {
    changelog = readFileSync(changelogPath, 'utf8');
  } catch (e) {
    console.warn('⚠️  CHANGELOG.md no encontrado, se creará uno nuevo.', e?.message);
    // Si no existe, crear uno nuevo
    changelog = `# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

`;
  }

  const date = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const typeLabels = {
    major: '🚀 MAJOR',
    minor: '✨ MINOR',
    patch: '🔧 PATCH'
  };

  const typeLabel = typeLabels[type] || type.toUpperCase();

  const newEntry = `## [${newVersion}] - ${date}

### ${typeLabel}
- Cambios en esta versión

`;

  // Insertar la nueva entrada después del título
  const lines = changelog.split('\n');
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      insertIndex = i;
      break;
    }
  }
  
  lines.splice(insertIndex, 0, newEntry);
  changelog = lines.join('\n');
  
  writeFileSync(changelogPath, changelog);
  console.log(`✅ CHANGELOG.md actualizado con versión ${newVersion}`);
};

const showVersion = () => {
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  console.log(`📦 Versión actual: ${packageJson.version}`);
};

const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'show') {
    showVersion();
    return;
  }

  if (!['patch', 'minor', 'major'].includes(command)) {
    console.error('❌ Uso: node scripts/version.js [patch|minor|major|show]');
    process.exit(1);
  }

  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, command);

  console.log(`🔄 Actualizando versión: ${currentVersion} → ${newVersion}\n`);

  updatePackageJson(newVersion);
  updateVersionJs(newVersion);
  updateChangelog(newVersion, command);

  console.log(`\n✅ Versión actualizada exitosamente a ${newVersion}`);
  console.log(`\n💡 Próximos pasos:`);
  console.log(`   git add package.json CHANGELOG.md src/utils/version.js`);
  console.log(`   git commit -m "chore: Bump version to ${newVersion}"`);
};

main();

