// Sirve la carpeta docs para validar localmente la publicación.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../docs', import.meta.url)));
const port = Number(process.env.DOCS_PORT || 8080);
const host = process.env.HOST || '127.0.0.1';
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp'
};

const safePath = (requestPath) => {
  const clean = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  const candidate = resolve(join(root, normalized === '/' ? 'index.html' : normalized));
  return candidate.startsWith(root) ? candidate : join(root, 'index.html');
};

const server = createServer((request, response) => {
  let filePath = safePath(request.url || '/');
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(root, 'index.html');

  response.setHeader('Content-Type', mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream');
  response.setHeader('Cache-Control', extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600');
  createReadStream(filePath).on('error', () => {
    response.statusCode = 500;
    response.end('No fue posible leer el recurso.');
  }).pipe(response);
});

server.listen(port, host, () => {
  console.log(`MiaServicios disponible en http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
