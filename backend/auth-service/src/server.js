// Expone registro, acceso, renovación de sesión y perfil.
import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  createRefreshToken,
  createUser,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  findUserWithPassword,
  purgeExpiredRefreshTokens,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  updateUserName,
  updateUserPassword
} from './database.js';

const app = express();
const port = Number(process.env.PORT || 4001);
const host = process.env.HOST || '0.0.0.0';
const jwtSecret = process.env.JWT_SECRET || 'mia-local-development-secret-32-characters-minimum';
const accessTokenSeconds = Math.max(Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900), 60);
const refreshTokenDays = Math.max(Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7), 1);
const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72)
});
const registrationSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) });
const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });
const refreshSchema = z.object({ refreshToken: z.string().min(64).max(256) });
const passwordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72)
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: 'La nueva contrasena debe ser diferente.'
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt || user.createdAt
});

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const issueAccessToken = (user) => {
  const expiresAt = new Date(Date.now() + accessTokenSeconds * 1000).toISOString();
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    jwtSecret,
    { expiresIn: accessTokenSeconds, issuer: 'miaservicios-auth' }
  );
  return { token, expiresAt };
};

const issueSession = (user) => {
  purgeExpiredRefreshTokens();
  const refreshToken = randomBytes(48).toString('hex');
  const refreshTokenId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const refreshExpiresAt = new Date(Date.now() + refreshTokenDays * 86400000).toISOString();
  createRefreshToken({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
    createdAt
  });
  return {
    ...issueAccessToken(user),
    refreshToken,
    refreshExpiresAt,
    refreshTokenId,
    user: publicUser(user)
  };
};

const sessionResponse = (session) => {
  const { refreshTokenId, ...payload } = session;
  return payload;
};

const authenticate = (request, response, next) => {
  try {
    const authorization = request.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      return response.status(401).json({ code: 'ACCESS_TOKEN_REQUIRED', message: 'Token de acceso requerido.' });
    }

    request.auth = jwt.verify(token, jwtSecret, { issuer: 'miaservicios-auth' });
    return next();
  } catch (error) {
    const code = error?.name === 'TokenExpiredError' ? 'ACCESS_TOKEN_EXPIRED' : 'ACCESS_TOKEN_INVALID';
    return response.status(401).json({ code, message: 'La sesion necesita renovarse.' });
  }
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'auth-service', status: 'ok', release: '3.2.0' });
});

app.post('/register', async (request, response) => {
  const validation = registrationSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_REGISTRATION', message: 'Los datos de registro no son validos.' });
  }

  const { name, email, password } = validation.data;

  if (findUserByEmail(email)) {
    return response.status(409).json({ code: 'EMAIL_EXISTS', message: 'El correo ya se encuentra registrado.' });
  }

  const user = createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString()
  });

  return response.status(201).json(sessionResponse(issueSession(user)));
});

app.post('/login', async (request, response) => {
  const validation = credentialsSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_CREDENTIALS', message: 'Credenciales no validas.' });
  }

  const user = findUserByEmail(validation.data.email);
  const validPassword = user && await bcrypt.compare(validation.data.password, user.passwordHash);

  if (!validPassword) {
    return response.status(401).json({ code: 'LOGIN_FAILED', message: 'Correo o contrasena incorrectos.' });
  }

  revokeUserRefreshTokens(user.id);
  return response.json(sessionResponse(issueSession(user)));
});

app.post('/refresh', (request, response) => {
  const validation = refreshSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(401).json({ code: 'REFRESH_TOKEN_REQUIRED', message: 'La sesion no puede renovarse.' });
  }

  const record = findRefreshToken(hashToken(validation.data.refreshToken));
  const expired = !record || new Date(record.expiresAt).getTime() <= Date.now();

  if (!record || record.revokedAt || expired) {
    if (record && !record.revokedAt) revokeRefreshToken(record.id);
    return response.status(401).json({ code: 'REFRESH_TOKEN_INVALID', message: 'La sesion ha vencido. Inicie sesion nuevamente.' });
  }

  const user = findUserById(record.userId);
  if (!user) {
    revokeRefreshToken(record.id);
    return response.status(401).json({ code: 'USER_NOT_FOUND', message: 'La sesion ya no es valida.' });
  }

  const nextSession = issueSession(user);
  revokeRefreshToken(record.id, nextSession.refreshTokenId);
  return response.json(sessionResponse(nextSession));
});

app.post('/logout', (request, response) => {
  const validation = refreshSchema.safeParse(request.body);
  if (validation.success) {
    const record = findRefreshToken(hashToken(validation.data.refreshToken));
    if (record) revokeRefreshToken(record.id);
  }
  return response.status(204).send();
});

app.get('/me', authenticate, (request, response) => {
  const user = findUserById(request.auth.sub);

  if (!user) {
    return response.status(404).json({ code: 'USER_NOT_FOUND', message: 'Usuario no encontrado.' });
  }

  return response.json({ user: publicUser(user) });
});

app.patch('/profile', authenticate, (request, response) => {
  const validation = profileSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_PROFILE', message: 'El nombre no es valido.' });
  }

  const user = updateUserName(request.auth.sub, validation.data.name);
  return response.json({ user: publicUser(user), ...issueAccessToken(user) });
});

app.post('/change-password', authenticate, async (request, response) => {
  const validation = passwordSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ code: 'INVALID_PASSWORD', message: validation.error.issues[0]?.message || 'Datos no validos.' });
  }

  const user = findUserWithPassword(request.auth.sub);
  const validPassword = user && await bcrypt.compare(validation.data.currentPassword, user.passwordHash);

  if (!validPassword) {
    return response.status(401).json({ code: 'CURRENT_PASSWORD_INVALID', message: 'La contrasena actual no es correcta.' });
  }

  updateUserPassword(user.id, await bcrypt.hash(validation.data.newPassword, 12));
  revokeUserRefreshTokens(user.id);
  return response.status(204).send();
});

app.post('/internal/verify', authenticate, (request, response) => {
  response.json({ user: request.auth });
});

app.use((error, request, response, next) => {
  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return response.status(409).json({ code: 'EMAIL_EXISTS', message: 'El correo ya se encuentra registrado.' });
  }

  return response.status(500).json({ code: 'AUTH_ERROR', message: 'No fue posible procesar la solicitud.' });
});

const server = app.listen(port, host, () => {
  console.log(`auth-service activo en http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
