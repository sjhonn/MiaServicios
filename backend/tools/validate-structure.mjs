// Valida la estructura principal y que README.md sea el unico Markdown.
import { existsSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(
  fileURLToPath(new URL('../..', import.meta.url))
);

const requiredPaths = [
  'backend',
  'frontend',
  'docs',
  'backend/api-gateway/package.json',
  'backend/auth-service/package.json',
  'backend/ai-service/package.json',
  'backend/history-service/package.json',
  'frontend/package.json',
  'frontend/index.html',
  'docs/index.html',
  'compose.yaml',
  'package.json',
  'README.md'
];

const ignoredDirectories = new Set([
  '.git',
  'node_modules'
]);

const collectMarkdownFiles = (directory) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...collectMarkdownFiles(fullPath));
      }

      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
};

const missingPaths = requiredPaths.filter(
  (item) => !existsSync(resolve(rootDir, item))
);

if (missingPaths.length > 0) {
  console.error(
    `Faltan elementos obligatorios: ${missingPaths.join(', ')}`
  );
  process.exit(1);
}

const expectedReadme = resolve(rootDir, 'README.md');
const markdownFiles = collectMarkdownFiles(rootDir);
const extraMarkdownFiles = markdownFiles.filter(
  (file) => resolve(file) !== expectedReadme
);

if (!markdownFiles.includes(expectedReadme)) {
  console.error('No se encontro README.md en la raiz.');
  process.exit(1);
}

if (extraMarkdownFiles.length > 0) {
  console.error('README.md debe ser el unico archivo Markdown.');
  console.error(
    extraMarkdownFiles
      .map((file) => relative(rootDir, file))
      .join('\n')
  );
  process.exit(1);
}

console.log('Estructura validada correctamente.');
console.log('README.md es el unico archivo Markdown.');
