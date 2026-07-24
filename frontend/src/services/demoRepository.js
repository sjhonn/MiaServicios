// Simula autenticacion e historial para GitHub Pages.
import { executeLocalAi } from './localAi.js';

const usersKey = 'mia_demo_users';
const sessionKey = 'mia_demo_session';
const historyKey = 'mia_demo_history';

const defaultUser = {
  id: 'demo-user',
  name: 'Usuario Demo',
  email: 'demo@mia.local',
  password: 'demo12345',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const users = () => {
  const current = read(usersKey, []);
  return current.some((user) => user.email === defaultUser.email) ? current : [defaultUser, ...current];
};

const publicUser = ({ password, ...user }) => user;

export const demoLogin = async ({ email, password }) => {
  const user = users().find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);

  if (!user) {
    throw new Error('Correo o contrasena incorrectos.');
  }

  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoRegister = async ({ name, email, password }) => {
  const current = users();

  if (current.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('El correo ya se encuentra registrado.');
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  write(usersKey, [...current.filter((item) => item.email !== defaultUser.email), user]);
  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoSession = () => read(sessionKey, null);
export const demoLogout = () => localStorage.removeItem(sessionKey);

export const demoRunOperation = async (type, payload) => {
  const session = demoSession();

  if (!session) {
    throw new Error('La sesion no se encuentra activa.');
  }

  const response = executeLocalAi(type, payload);
  const operation = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    type,
    inputPreview: payload.text.replace(/\s+/g, ' ').slice(0, 240),
    inputLength: payload.text.length,
    result: response.result,
    processingMs: response.processingMs,
    createdAt: new Date().toISOString()
  };
  const history = read(historyKey, []);
  write(historyKey, [operation, ...history]);

  return { ...response, operationId: operation.id };
};

export const demoHistory = async () => {
  const session = demoSession();
  const items = read(historyKey, []).filter((item) => item.userId === session?.user.id);
  return { items, total: items.length, limit: items.length, offset: 0 };
};

export const demoStats = async () => {
  const { items } = await demoHistory();
  const grouped = items.reduce((map, item) => {
    const current = map.get(item.type) || { type: item.type, total: 0, processing: 0 };
    current.total += 1;
    current.processing += item.processingMs;
    map.set(item.type, current);
    return map;
  }, new Map());

  return {
    total: items.length,
    items: [...grouped.values()].map((item) => ({
      type: item.type,
      total: item.total,
      averageMs: Number((item.processing / item.total).toFixed(2))
    }))
  };
};

export const demoDeleteHistory = async (id) => {
  const session = demoSession();
  const history = read(historyKey, []);
  write(historyKey, history.filter((item) => item.id !== id || item.userId !== session?.user.id));
};
