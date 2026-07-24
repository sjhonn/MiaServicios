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
db.pragma('foreign_keys = ON');

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
  CREATE INDEX IF NOT EXISTS idx_operations_user_type
  ON operations (user_id, type);
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

const buildFilters = ({ userId, type, search }) => {
  const clauses = ['user_id = @userId'];
  const params = { userId };

  if (type && type !== 'all') {
    clauses.push('type = @type');
    params.type = type;
  }

  if (search) {
    clauses.push('LOWER(input_preview) LIKE @search');
    params.search = `%${search.toLowerCase()}%`;
  }

  return { where: clauses.join(' AND '), params };
};

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

export const listOperations = ({ userId, limit, offset, type, search, sort }) => {
  const { where, params } = buildFilters({ userId, type, search });
  const direction = sort === 'oldest' ? 'ASC' : 'DESC';

  return db.prepare(`
    SELECT * FROM operations
    WHERE ${where}
    ORDER BY created_at ${direction}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset }).map(mapOperation);
};

export const countOperations = ({ userId, type, search }) => {
  const { where, params } = buildFilters({ userId, type, search });
  return db.prepare(`SELECT COUNT(*) AS total FROM operations WHERE ${where}`).get(params).total;
};

export const operationStats = (userId) => {
  const items = db.prepare(`
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

  const summary = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(input_length), 0) AS total_characters,
      COALESCE(AVG(processing_ms), 0) AS average_ms,
      MAX(created_at) AS last_operation_at
    FROM operations
    WHERE user_id = ?
  `).get(userId);

  const rows = db.prepare(`
    SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS total
    FROM operations
    WHERE user_id = ? AND datetime(created_at) >= datetime('now', '-6 days', 'start of day')
    GROUP BY substr(created_at, 1, 10)
    ORDER BY date ASC
  `).all(userId);
  const byDate = new Map(rows.map((row) => [row.date, row.total]));
  const daily = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    daily.push({ date: key, total: byDate.get(key) || 0 });
  }

  return {
    items,
    total: summary.total,
    totalCharacters: summary.total_characters,
    averageMs: Number(summary.average_ms.toFixed(2)),
    lastOperationAt: summary.last_operation_at,
    daily
  };
};

export const deleteOperation = (id, userId) => db.prepare(`
  DELETE FROM operations WHERE id = ? AND user_id = ?
`).run(id, userId).changes > 0;

export const clearOperations = (userId) => db.prepare(`
  DELETE FROM operations WHERE user_id = ?
`).run(userId).changes;
