// Expone historial, favoritos y recuperacion de operaciones.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import {
  clearOperations,
  countOperations,
  deleteOperation,
  insertOperation,
  listOperations,
  operationStats,
  restoreOperation,
  setOperationFavorite
} from './database.js';

const app = express();
const port = Number(process.env.PORT || 4003);
const host = process.env.HOST || '0.0.0.0';
const serviceKey = process.env.SERVICE_KEY || 'mia-internal-local-service-key';
const operationTypes = ['summarize', 'sentiment', 'keywords', 'classify', 'statistics', 'normalize'];
const operationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1).max(120),
  type: z.enum(operationTypes),
  inputPreview: z.string().max(240),
  inputLength: z.number().int().nonnegative(),
  result: z.unknown(),
  processingMs: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  favorite: z.boolean().optional()
});
const favoriteSchema = z.object({ favorite: z.boolean() });

const requireUser = (request, response, next) => {
  const userId = request.headers['x-user-id'];

  if (!userId || typeof userId !== 'string') {
    return response.status(401).json({ code: 'USER_REQUIRED', message: 'Identidad de usuario requerida.' });
  }

  request.userId = userId;
  return next();
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '128kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'history-service', status: 'ok', release: '3.2.0' });
});

app.post('/internal/operations', (request, response) => {
  if (request.headers['x-service-key'] !== serviceKey) {
    return response.status(403).json({ code: 'INTERNAL_ACCESS_DENIED', message: 'Acceso interno denegado.' });
  }

  const validation = operationSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_OPERATION', message: 'Operacion no valida.' });
  }

  return response.status(201).json({ operation: insertOperation(validation.data) });
});

app.get('/operations', requireUser, (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 25, 1), 500);
  const offset = Math.max(Number(request.query.offset) || 0, 0);
  const type = operationTypes.includes(request.query.type) ? request.query.type : 'all';
  const search = String(request.query.search || '').trim().slice(0, 120);
  const sort = request.query.sort === 'oldest' ? 'oldest' : 'newest';
  const favorite = request.query.favorite === 'true';
  const query = { userId: request.userId, limit, offset, type, search, sort, favorite };

  response.json({
    items: listOperations(query),
    total: countOperations(query),
    limit,
    offset
  });
});

app.get('/stats', requireUser, (request, response) => {
  response.json(operationStats(request.userId));
});

app.patch('/operations/:id/favorite', requireUser, (request, response) => {
  const validation = favoriteSchema.safeParse(request.body);
  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_FAVORITE', message: 'Estado de favorito no valido.' });
  }

  const operation = setOperationFavorite(request.params.id, request.userId, validation.data.favorite);
  if (!operation) {
    return response.status(404).json({ code: 'HISTORY_NOT_FOUND', message: 'Registro no encontrado.' });
  }

  return response.json({ operation });
});

app.post('/operations/:id/restore', requireUser, (request, response) => {
  const operation = restoreOperation(request.params.id, request.userId);
  if (!operation) {
    return response.status(404).json({ code: 'HISTORY_NOT_FOUND', message: 'Registro no encontrado o ya recuperado.' });
  }
  return response.json({ operation });
});

app.delete('/operations', requireUser, (request, response) => {
  response.json({ deleted: clearOperations(request.userId) });
});

app.delete('/operations/:id', requireUser, (request, response) => {
  const deleted = deleteOperation(request.params.id, request.userId);

  if (!deleted) {
    return response.status(404).json({ code: 'HISTORY_NOT_FOUND', message: 'Registro no encontrado.' });
  }

  return response.status(204).send();
});

app.use((error, request, response, next) => {
  response.status(500).json({ code: 'HISTORY_ERROR', message: 'No fue posible procesar el historial.' });
});

const server = app.listen(port, host, () => {
  console.log(`history-service activo en http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
