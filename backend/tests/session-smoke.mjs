// Verifica vencimiento, renovacion y normalizacion de sesiones.
import assert from 'node:assert/strict';
import {
  canRefreshSession,
  decodeJwtPayload,
  isAccessExpired,
  isRefreshExpired,
  normalizeSession
} from '../../frontend/src/services/session.js';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const futureToken = `${encode({ alg: 'none' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 300 })}.signature`;
const expiredToken = `${encode({ alg: 'none' })}.${encode({ exp: Math.floor(Date.now() / 1000) - 30 })}.signature`;

assert.equal(decodeJwtPayload(futureToken).exp > 0, true);
assert.equal(isAccessExpired({ token: futureToken }), false);
assert.equal(isAccessExpired({ token: expiredToken }), true);
assert.equal(isRefreshExpired({ refreshToken: 'token', refreshExpiresAt: new Date(Date.now() + 60000).toISOString() }), false);
assert.equal(canRefreshSession({ refreshToken: 'token', refreshExpiresAt: new Date(Date.now() + 60000).toISOString() }), true);
assert.equal(normalizeSession({ token: futureToken, user: { id: '1' } }).user.id, '1');
assert.equal(normalizeSession({ token: '', user: null }), null);

console.log('Pruebas de sesion completadas correctamente.');
