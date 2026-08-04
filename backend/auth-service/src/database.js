// Gestiona la persistencia de usuarios y sesiones renovables.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDir, '../data/auth.db');
const databaseFile = path.resolve(process.cwd(), process.env.DATABASE_FILE || defaultFile);

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    revoked_at TEXT,
    replaced_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash
  ON refresh_tokens (token_hash);

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
  ON refresh_tokens (user_id, revoked_at, expires_at);
`);

const columns = db.prepare('PRAGMA table_info(users)').all();
if (!columns.some((column) => column.name === 'updated_at')) {
  db.exec('ALTER TABLE users ADD COLUMN updated_at TEXT');
}

const seedDemoUser = () => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mia.local');

  if (!existing) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'Usuario Demo',
      'demo@mia.local',
      bcrypt.hashSync('demo12345', 12),
      'admin',
      now,
      now
    );
  }
};

seedDemoUser();

export const findUserByEmail = (email) => db.prepare(`
  SELECT id, name, email, password_hash AS passwordHash, role,
         created_at AS createdAt, updated_at AS updatedAt
  FROM users
  WHERE email = ?
`).get(email);

export const findUserById = (id) => db.prepare(`
  SELECT id, name, email, role, created_at AS createdAt, updated_at AS updatedAt
  FROM users
  WHERE id = ?
`).get(id);

export const findUserWithPassword = (id) => db.prepare(`
  SELECT id, name, email, password_hash AS passwordHash, role,
         created_at AS createdAt, updated_at AS updatedAt
  FROM users
  WHERE id = ?
`).get(id);

export const createUser = ({ id, name, email, passwordHash, role = 'user', createdAt }) => {
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email, passwordHash, role, createdAt, createdAt);

  return findUserById(id);
};

export const updateUserName = (id, name) => {
  db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
    .run(name, new Date().toISOString(), id);
  return findUserById(id);
};

export const updateUserPassword = (id, passwordHash) => {
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, new Date().toISOString(), id);
};

export const createRefreshToken = ({ id, userId, tokenHash, expiresAt, createdAt }) => {
  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, tokenHash, expiresAt, createdAt);
};

export const findRefreshToken = (tokenHash) => db.prepare(`
  SELECT id, user_id AS userId, token_hash AS tokenHash,
         expires_at AS expiresAt, created_at AS createdAt,
         revoked_at AS revokedAt, replaced_by AS replacedBy
  FROM refresh_tokens
  WHERE token_hash = ?
`).get(tokenHash);

export const revokeRefreshToken = (id, replacedBy = null) => {
  db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = COALESCE(revoked_at, ?), replaced_by = COALESCE(replaced_by, ?)
    WHERE id = ?
  `).run(new Date().toISOString(), replacedBy, id);
};

export const revokeUserRefreshTokens = (userId) => {
  db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = COALESCE(revoked_at, ?)
    WHERE user_id = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), userId);
};

export const purgeExpiredRefreshTokens = () => {
  db.prepare(`
    DELETE FROM refresh_tokens
    WHERE datetime(expires_at) < datetime('now', '-1 day')
       OR (revoked_at IS NOT NULL AND datetime(revoked_at) < datetime('now', '-7 days'))
  `).run();
};
