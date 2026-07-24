// Centraliza autenticacion, IA, historial y salud de servicios.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT || 4000);
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4002';
const historyServiceUrl = process.env.HISTORY_SERVICE_URL || 'http://localhost:4003';
const serviceKey = process.env.SERVICE_KEY || 'mia-internal-local-service-key';
const allowedOrigins = String(process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const operationTypes = ['summarize', 'sentiment', 'keywords', 'classify', 'statistics', 'normalize'];

class ServiceError extends Error {
  constructor(status, payload) {
    super(payload?.message || 'Servicio no disponible.');
    this.status = status;
    this.payload = payload;
  }
}

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(8000)
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ServiceError(response.status, payload);
  }

  return payload;
};

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const authenticate = asyncRoute(async (request, response, next) => {
  const authorization = request.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Token de acceso requerido.' });
  }

  const verification = await requestJson(`${authServiceUrl}/internal/verify`, {
    method: 'POST',
    headers: { authorization }
  });
  request.user = verification.user;
  return next();
});

const proxyAuth = (path, method = 'POST') => asyncRoute(async (request, response) => {
  const payload = await requestJson(`${authServiceUrl}${path}`, {
    method,
    headers: request.headers.authorization ? { authorization: request.headers.authorization } : {},
    body: method === 'GET' ? undefined : JSON.stringify(request.body)
  });
  const status = path === '/register' ? 201 : 200;
  return payload === null ? response.status(204).send() : response.status(status).json(payload);
});

const runAiOperation = (type) => asyncRoute(async (request, response) => {
  const aiResponse = await requestJson(`${aiServiceUrl}/${type}`, {
    method: 'POST',
    body: JSON.stringify(request.body)
  });
  const operation = {
    id: crypto.randomUUID(),
    userId: request.user.sub,
    type,
    inputPreview: String(request.body.text || '').replace(/\s+/g, ' ').slice(0, 240),
    inputLength: String(request.body.text || '').length,
    result: aiResponse.result,
    processingMs: aiResponse.processingMs,
    createdAt: new Date().toISOString()
  };

  await requestJson(`${historyServiceUrl}/internal/operations`, {
    method: 'POST',
    headers: { 'x-service-key': serviceKey },
    body: JSON.stringify(operation)
  });

  response.json({ ...aiResponse, operationId: operation.id, requestId: request.requestId });
});

const probe = async (name, url) => {
  const startedAt = performance.now();
  try {
    const payload = await requestJson(url);
    return { name, status: 'ok', latencyMs: Number((performance.now() - startedAt).toFixed(2)), detail: payload };
  } catch {
    return { name, status: 'error', latencyMs: Number((performance.now() - startedAt).toFixed(2)) };
  }
};

app.use((request, response, next) => {
  request.requestId = request.headers['x-request-id'] || crypto.randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
});
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido.'));
  }
}));
app.use(express.json({ limit: '64kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 150, standardHeaders: true, legacyHeaders: false }));

app.get('/health', asyncRoute(async (request, response) => {
  const checks = await Promise.all([
    probe('auth', `${authServiceUrl}/health`),
    probe('ai', `${aiServiceUrl}/health`),
    probe('history', `${historyServiceUrl}/health`)
  ]);
  const services = Object.fromEntries(checks.map((item) => [item.name, item]));
  const healthy = checks.every((item) => item.status === 'ok');

  response.status(healthy ? 200 : 503).json({
    service: 'api-gateway',
    status: healthy ? 'ok' : 'degraded',
    version: '2.0',
    requestId: request.requestId,
    services
  });
}));

app.post('/api/auth/register', proxyAuth('/register'));
app.post('/api/auth/login', proxyAuth('/login'));
app.get('/api/auth/me', authenticate, proxyAuth('/me', 'GET'));
app.patch('/api/auth/profile', authenticate, proxyAuth('/profile', 'PATCH'));
app.post('/api/auth/change-password', authenticate, proxyAuth('/change-password'));

operationTypes.forEach((type) => {
  app.post(`/api/ai/${type}`, authenticate, runAiOperation(type));
});

app.get('/api/history', authenticate, asyncRoute(async (request, response) => {
  const query = new URLSearchParams({
    limit: String(request.query.limit || 25),
    offset: String(request.query.offset || 0),
    type: String(request.query.type || 'all'),
    search: String(request.query.search || ''),
    sort: String(request.query.sort || 'newest')
  });
  const payload = await requestJson(`${historyServiceUrl}/operations?${query}`, {
    headers: { 'x-user-id': request.user.sub }
  });
  response.json(payload);
}));

app.get('/api/history/stats', authenticate, asyncRoute(async (request, response) => {
  const payload = await requestJson(`${historyServiceUrl}/stats`, {
    headers: { 'x-user-id': request.user.sub }
  });
  response.json(payload);
}));

app.delete('/api/history', authenticate, asyncRoute(async (request, response) => {
  const payload = await requestJson(`${historyServiceUrl}/operations`, {
    method: 'DELETE',
    headers: { 'x-user-id': request.user.sub }
  });
  response.json(payload);
}));

app.delete('/api/history/:id', authenticate, asyncRoute(async (request, response) => {
  await requestJson(`${historyServiceUrl}/operations/${request.params.id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': request.user.sub }
  });
  response.status(204).send();
}));

app.use((error, request, response, next) => {
  if (error instanceof ServiceError) {
    return response.status(error.status).json({ ...error.payload, requestId: request.requestId });
  }

  if (error?.name === 'TimeoutError') {
    return response.status(504).json({ message: 'Un servicio excedio el tiempo de respuesta.', requestId: request.requestId });
  }

  if (error?.message === 'Origen no permitido.') {
    return response.status(403).json({ message: error.message, requestId: request.requestId });
  }

  return response.status(500).json({ message: 'No fue posible completar la solicitud.', requestId: request.requestId });
});

app.listen(port, () => {
  console.log(`api-gateway activo en http://localhost:${port}`);
});
