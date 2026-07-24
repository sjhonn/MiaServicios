// Gestiona la persistencia SQLite de usuarios.
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
    created_at TEXT NOT NULL
  );
`);

const seedDemoUser = () => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mia.local');

  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'Usuario Demo',
      'demo@mia.local',
      bcrypt.hashSync('demo12345', 12),
      'admin',
      new Date().toISOString()
    );
  }
};

seedDemoUser();

export const findUserByEmail = (email) => db.prepare(`
  SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt
  FROM users
  WHERE email = ?
`).get(email);

export const findUserById = (id) => db.prepare(`
  SELECT id, name, email, role, created_at AS createdAt
  FROM users
  WHERE id = ?
`).get(id);

export const createUser = ({ id, name, email, passwordHash, role = 'user', createdAt }) => {
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, passwordHash, role, createdAt);

  return findUserById(id);
};
