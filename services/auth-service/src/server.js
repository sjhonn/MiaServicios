// Expone registro, login y validacion JWT.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createUser, findUserByEmail, findUserById } from './database.js';

const app = express();
const port = Number(process.env.PORT || 4001);
const jwtSecret = process.env.JWT_SECRET || 'mia-local-development-secret-32-characters-minimum';

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72)
});

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80)
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const issueToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role, name: user.name },
  jwtSecret,
  { expiresIn: '8h', issuer: 'miaservicios-auth' }
);

const readBearerToken = (request) => {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
};

const authenticate = (request, response, next) => {
  try {
    const token = readBearerToken(request);

    if (!token) {
      return response.status(401).json({ message: 'Token de acceso requerido.' });
    }

    request.auth = jwt.verify(token, jwtSecret, { issuer: 'miaservicios-auth' });
    return next();
  } catch {
    return response.status(401).json({ message: 'Token de acceso invalido o vencido.' });
  }
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'auth-service', status: 'ok' });
});

app.post('/register', async (request, response) => {
  const validation = registrationSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'Los datos de registro no son validos.' });
  }

  const { name, email, password } = validation.data;

  if (findUserByEmail(email)) {
    return response.status(409).json({ message: 'El correo ya se encuentra registrado.' });
  }

  const user = createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString()
  });

  return response.status(201).json({ token: issueToken(user), user: publicUser(user) });
});

app.post('/login', async (request, response) => {
  const validation = credentialsSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'Credenciales no validas.' });
  }

  const user = findUserByEmail(validation.data.email);
  const validPassword = user && await bcrypt.compare(validation.data.password, user.passwordHash);

  if (!validPassword) {
    return response.status(401).json({ message: 'Correo o contrasena incorrectos.' });
  }

  return response.json({ token: issueToken(user), user: publicUser(user) });
});

app.get('/me', authenticate, (request, response) => {
  const user = findUserById(request.auth.sub);

  if (!user) {
    return response.status(404).json({ message: 'Usuario no encontrado.' });
  }

  return response.json({ user: publicUser(user) });
});

app.post('/internal/verify', authenticate, (request, response) => {
  response.json({ user: request.auth });
});

app.use((error, request, response, next) => {
  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return response.status(409).json({ message: 'El correo ya se encuentra registrado.' });
  }

  return response.status(500).json({ message: 'No fue posible procesar la solicitud.' });
});

app.listen(port, () => {
  console.log(`auth-service activo en http://localhost:${port}`);
});
