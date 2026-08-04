// Gestiona la persistencia, favoritos y recuperacion del historial.
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
    created_at TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_operations_user_created
  ON operations (user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_operations_user_type
  ON operations (user_id, type);
  CREATE INDEX IF NOT EXISTS idx_operations_user_favorite
  ON operations (user_id, is_favorite, deleted_at);
`);

const columns = db.prepare('PRAGMA table_info(operations)').all();
if (!columns.some((column) => column.name === 'is_favorite')) {
  db.exec('ALTER TABLE operations ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0');
}
if (!columns.some((column) => column.name === 'deleted_at')) {
  db.exec('ALTER TABLE operations ADD COLUMN deleted_at TEXT');
}

const mapOperation = (row) => row ? ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  inputPreview: row.input_preview,
  inputLength: row.input_length,
  result: JSON.parse(row.result_json),
  processingMs: row.processing_ms,
  createdAt: row.created_at,
  favorite: Boolean(row.is_favorite),
  deletedAt: row.deleted_at || null
}) : null;

const buildFilters = ({ userId, type, search, favorite }) => {
  const clauses = ['user_id = @userId', 'deleted_at IS NULL'];
  const params = { userId };

  if (type && type !== 'all') {
    clauses.push('type = @type');
    params.type = type;
  }

  if (search) {
    clauses.push('(LOWER(input_preview) LIKE @search OR LOWER(result_json) LIKE @search)');
    params.search = `%${search.toLowerCase()}%`;
  }

  if (favorite) clauses.push('is_favorite = 1');

  return { where: clauses.join(' AND '), params };
};

export const insertOperation = (operation) => {
  db.prepare(`
    INSERT INTO operations (
      id, user_id, type, input_preview, input_length, result_json,
      processing_ms, created_at, is_favorite, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(
    operation.id,
    operation.userId,
    operation.type,
    operation.inputPreview,
    operation.inputLength,
    JSON.stringify(operation.result),
    operation.processingMs,
    operation.createdAt,
    operation.favorite ? 1 : 0
  );

  return getOperation(operation.id, operation.userId);
};

export const getOperation = (id, userId, includeDeleted = false) => mapOperation(db.prepare(`
  SELECT * FROM operations
  WHERE id = ? AND user_id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
`).get(id, userId));

export const listOperations = ({ userId, limit, offset, type, search, sort, favorite }) => {
  const { where, params } = buildFilters({ userId, type, search, favorite });
  const direction = sort === 'oldest' ? 'ASC' : 'DESC';

  return db.prepare(`
    SELECT * FROM operations
    WHERE ${where}
    ORDER BY is_favorite DESC, created_at ${direction}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset }).map(mapOperation);
};

export const countOperations = ({ userId, type, search, favorite }) => {
  const { where, params } = buildFilters({ userId, type, search, favorite });
  return db.prepare(`SELECT COUNT(*) AS total FROM operations WHERE ${where}`).get(params).total;
};

export const operationStats = (userId) => {
  const items = db.prepare(`
    SELECT type, COUNT(*) AS total, AVG(processing_ms) AS average_ms
    FROM operations
    WHERE user_id = ? AND deleted_at IS NULL
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
      COALESCE(SUM(is_favorite), 0) AS favorite_total,
      MAX(created_at) AS last_operation_at
    FROM operations
    WHERE user_id = ? AND deleted_at IS NULL
  `).get(userId);

  const rows = db.prepare(`
    SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS total
    FROM operations
    WHERE user_id = ?
      AND deleted_at IS NULL
      AND datetime(created_at) >= datetime('now', '-6 days', 'start of day')
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
    favoriteTotal: summary.favorite_total,
    lastOperationAt: summary.last_operation_at,
    daily
  };
};

export const setOperationFavorite = (id, userId, favorite) => {
  const result = db.prepare(`
    UPDATE operations
    SET is_favorite = ?
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).run(favorite ? 1 : 0, id, userId);
  return result.changes ? getOperation(id, userId) : null;
};

export const deleteOperation = (id, userId) => db.prepare(`
  UPDATE operations SET deleted_at = ?
  WHERE id = ? AND user_id = ? AND deleted_at IS NULL
`).run(new Date().toISOString(), id, userId).changes > 0;

export const restoreOperation = (id, userId) => {
  const result = db.prepare(`
    UPDATE operations SET deleted_at = NULL
    WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
  `).run(id, userId);
  return result.changes ? getOperation(id, userId) : null;
};

export const clearOperations = (userId) => db.prepare(`
  UPDATE operations SET deleted_at = ?
  WHERE user_id = ? AND deleted_at IS NULL
`).run(new Date().toISOString(), userId).changes;
