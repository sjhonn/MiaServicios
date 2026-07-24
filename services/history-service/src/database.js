// Gestiona la persistencia SQLite del historial.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDir, '../data/history.db');
const databaseFile = path.resolve(process.cwd(), process.env.DATABASE_FILE || defaultFile);

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    input_preview TEXT NOT NULL,
    input_length INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    processing_ms REAL NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_operations_user_created
  ON operations (user_id, created_at DESC);
`);

const mapOperation = (row) => row ? ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  inputPreview: row.input_preview,
  inputLength: row.input_length,
  result: JSON.parse(row.result_json),
  processingMs: row.processing_ms,
  createdAt: row.created_at
}) : null;

export const insertOperation = (operation) => {
  db.prepare(`
    INSERT INTO operations (
      id, user_id, type, input_preview, input_length, result_json, processing_ms, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    operation.id,
    operation.userId,
    operation.type,
    operation.inputPreview,
    operation.inputLength,
    JSON.stringify(operation.result),
    operation.processingMs,
    operation.createdAt
  );

  return getOperation(operation.id, operation.userId);
};

export const getOperation = (id, userId) => mapOperation(db.prepare(`
  SELECT * FROM operations WHERE id = ? AND user_id = ?
`).get(id, userId));

export const listOperations = (userId, limit, offset) => db.prepare(`
  SELECT * FROM operations
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`).all(userId, limit, offset).map(mapOperation);

export const countOperations = (userId) => db.prepare(`
  SELECT COUNT(*) AS total FROM operations WHERE user_id = ?
`).get(userId).total;

export const operationStats = (userId) => db.prepare(`
  SELECT type, COUNT(*) AS total, AVG(processing_ms) AS average_ms
  FROM operations
  WHERE user_id = ?
  GROUP BY type
  ORDER BY total DESC
`).all(userId).map((row) => ({
  type: row.type,
  total: row.total,
  averageMs: Number(row.average_ms.toFixed(2))
}));

export const deleteOperation = (id, userId) => db.prepare(`
  DELETE FROM operations WHERE id = ? AND user_id = ?
`).run(id, userId).changes > 0;
