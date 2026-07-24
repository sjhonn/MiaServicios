// Centraliza autenticacion, IA e historial.
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
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

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
    headers: {
      'content-type': 'application/json',
      ...options.headers
    },
    signal: AbortSignal.timeout(7000)
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

const proxyAuth = (path) => asyncRoute(async (request, response) => {
  const payload = await requestJson(`${authServiceUrl}${path}`, {
    method: 'POST',
    body: JSON.stringify(request.body)
  });

  response.status(path === '/register' ? 201 : 200).json(payload);
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

  response.json({ ...aiResponse, operationId: operation.id });
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json({ limit: '64kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', asyncRoute(async (request, response) => {
  const services = await Promise.allSettled([
    requestJson(`${authServiceUrl}/health`),
    requestJson(`${aiServiceUrl}/health`),
    requestJson(`${historyServiceUrl}/health`)
  ]);

  const names = ['auth', 'ai', 'history'];
  const status = Object.fromEntries(services.map((result, index) => [
    names[index],
    result.status === 'fulfilled' ? 'ok' : 'error'
  ]));

  response.status(Object.values(status).every((value) => value === 'ok') ? 200 : 503).json({
    service: 'api-gateway',
    status: Object.values(status).every((value) => value === 'ok') ? 'ok' : 'degraded',
    services: status
  });
}));

app.post('/api/auth/register', proxyAuth('/register'));
app.post('/api/auth/login', proxyAuth('/login'));

app.get('/api/auth/me', authenticate, asyncRoute(async (request, response) => {
  const payload = await requestJson(`${authServiceUrl}/me`, {
    headers: { authorization: request.headers.authorization }
  });

  response.json(payload);
}));

app.post('/api/ai/summarize', authenticate, runAiOperation('summarize'));
app.post('/api/ai/sentiment', authenticate, runAiOperation('sentiment'));
app.post('/api/ai/keywords', authenticate, runAiOperation('keywords'));
app.post('/api/ai/classify', authenticate, runAiOperation('classify'));

app.get('/api/history', authenticate, asyncRoute(async (request, response) => {
  const query = new URLSearchParams({
    limit: String(request.query.limit || 25),
    offset: String(request.query.offset || 0)
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

app.delete('/api/history/:id', authenticate, asyncRoute(async (request, response) => {
  await requestJson(`${historyServiceUrl}/operations/${request.params.id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': request.user.sub }
  });

  response.status(204).send();
}));

app.use((error, request, response, next) => {
  if (error instanceof ServiceError) {
    return response.status(error.status).json(error.payload);
  }

  if (error?.name === 'TimeoutError') {
    return response.status(504).json({ message: 'Un servicio excedio el tiempo de respuesta.' });
  }

  return response.status(500).json({ message: 'No fue posible completar la solicitud.' });
});

app.listen(port, () => {
  console.log(`api-gateway activo en http://localhost:${port}`);
});
