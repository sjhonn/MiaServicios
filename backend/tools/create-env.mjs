// Crea variables locales seguras sin depender de comandos específicos del sistema.
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve(process.cwd(), '.env');
const force = process.argv.includes('--force');

if (existsSync(target) && !force) {
  console.log('El archivo .env ya existe. Use npm run env:init -- --force para reemplazarlo.');
  process.exit(0);
}

const content = [
  `JWT_SECRET=${randomBytes(48).toString('hex')}`,
  `SERVICE_KEY=${randomBytes(48).toString('hex')}`,
  'CORS_ORIGIN=http://localhost:5173,http://localhost:8080',
  'ACCESS_TOKEN_TTL_SECONDS=900',
  'REFRESH_TOKEN_TTL_DAYS=7',
  'WEB_PORT=8080',
  'HOST=0.0.0.0',
  'TRUST_PROXY=false',
  ''
].join('\n');

writeFileSync(target, content, { mode: 0o600 });
console.log('Archivo .env creado correctamente.');
