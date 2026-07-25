// Simula autenticacion, perfil e historial para GitHub Pages.
import { executeLocalAi } from './localAi.js';

const usersKey = 'mia_demo_users_v2';
const sessionKey = 'mia_demo_session_v2';
const historyKey = 'mia_demo_history_v2';
const defaultEmail = 'demo@mia.local';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const publicUser = ({ passwordHash, salt, ...user }) => user;
const bytesToHex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const randomSalt = () => bytesToHex(crypto.getRandomValues(new Uint8Array(16)));

const hashPassword = async (password, salt) => {
  const value = new TextEncoder().encode(`${salt}:${password}`);
  if (crypto.subtle) return bytesToHex(await crypto.subtle.digest('SHA-256', value));
  return bytesToHex(value);
};

const ensureUsers = async () => {
  const current = read(usersKey, []);
  if (current.some((user) => user.email === defaultEmail)) return current;
  const salt = randomSalt();
  const demo = {
    id: 'demo-user',
    name: 'Usuario Demo',
    email: defaultEmail,
    passwordHash: await hashPassword('demo12345', salt),
    salt,
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };
  const updated = [demo, ...current];
  write(usersKey, updated);
  return updated;
};

const updateSessionUser = (user) => {
  const session = demoSession();
  const updated = { ...session, user: publicUser(user) };
  write(sessionKey, updated);
  return updated;
};

export const demoSession = () => read(sessionKey, null);
export const demoLogout = () => localStorage.removeItem(sessionKey);

export const demoLogin = async ({ email, password }) => {
  const users = await ensureUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  const valid = user && await hashPassword(password, user.salt) === user.passwordHash;

  if (!valid) throw new Error('Correo o contrasena incorrectos.');

  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoRegister = async ({ name, email, password }) => {
  const users = await ensureUsers();
  const normalizedEmail = email.toLowerCase();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('El correo ya se encuentra registrado.');
  }
  const salt = randomSalt();
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash: await hashPassword(password, salt),
    salt,
    role: 'user',
    createdAt: now,
    updatedAt: now
  };
  write(usersKey, [...users, user]);
  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoMe = async () => {
  const session = demoSession();
  if (!session) throw new Error('La sesion no se encuentra activa.');
  return { user: session.user };
};

export const demoUpdateProfile = async ({ name }) => {
  const session = demoSession();
  if (!session) throw new Error('La sesion no se encuentra activa.');
  const users = await ensureUsers();
  const now = new Date().toISOString();
  let updatedUser;
  const updated = users.map((user) => {
    if (user.id !== session.user.id) return user;
    updatedUser = { ...user, name, updatedAt: now };
    return updatedUser;
  });
  write(usersKey, updated);
  const nextSession = updateSessionUser(updatedUser);
  return { user: nextSession.user, token: nextSession.token };
};

export const demoChangePassword = async ({ currentPassword, newPassword }) => {
  const session = demoSession();
  if (!session) throw new Error('La sesion no se encuentra activa.');
  const users = await ensureUsers();
  const user = users.find((item) => item.id === session.user.id);
  const valid = user && await hashPassword(currentPassword, user.salt) === user.passwordHash;
  if (!valid) throw new Error('La contrasena actual no es correcta.');
  const salt = randomSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  const updated = users.map((item) => item.id === user.id ? {
    ...item,
    salt,
    passwordHash,
    updatedAt: new Date().toISOString()
  } : item);
  write(usersKey, updated);
};

export const demoRunOperation = async (type, payload) => {
  const session = demoSession();
  if (!session) throw new Error('La sesion no se encuentra activa.');
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
  write(historyKey, [operation, ...read(historyKey, [])]);
  return { ...response, operationId: operation.id };
};

export const demoHistory = async ({ limit = 25, offset = 0, type = 'all', search = '', sort = 'newest' } = {}) => {
  const session = demoSession();
  const term = search.trim().toLowerCase();
  let items = read(historyKey, []).filter((item) => item.userId === session?.user.id);
  if (type !== 'all') items = items.filter((item) => item.type === type);
  if (term) items = items.filter((item) => item.inputPreview.toLowerCase().includes(term));
  items.sort((left, right) => sort === 'oldest'
    ? new Date(left.createdAt) - new Date(right.createdAt)
    : new Date(right.createdAt) - new Date(left.createdAt));
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
};

export const demoStats = async () => {
  const { items } = await demoHistory({ limit: 100000 });
  const grouped = items.reduce((map, item) => {
    const current = map.get(item.type) || { type: item.type, total: 0, processing: 0 };
    current.total += 1;
    current.processing += item.processingMs;
    map.set(item.type, current);
    return map;
  }, new Map());
  const dailyMap = items.reduce((map, item) => {
    const key = item.createdAt.slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
  const daily = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    daily.push({ date: key, total: dailyMap.get(key) || 0 });
  }
  const processing = items.reduce((sum, item) => sum + item.processingMs, 0);
  return {
    total: items.length,
    totalCharacters: items.reduce((sum, item) => sum + item.inputLength, 0),
    averageMs: items.length ? Number((processing / items.length).toFixed(2)) : 0,
    lastOperationAt: items[0]?.createdAt || null,
    items: [...grouped.values()].map((item) => ({
      type: item.type,
      total: item.total,
      averageMs: Number((item.processing / item.total).toFixed(2))
    })),
    daily
  };
};

export const demoDeleteHistory = async (id) => {
  const session = demoSession();
  write(historyKey, read(historyKey, []).filter((item) => item.id !== id || item.userId !== session?.user.id));
};

export const demoClearHistory = async () => {
  const session = demoSession();
  const history = read(historyKey, []);
  const deleted = history.filter((item) => item.userId === session?.user.id).length;
  write(historyKey, history.filter((item) => item.userId !== session?.user.id));
  return { deleted };
};

export const demoExportData = async () => {
  const session = demoSession();
  const history = read(historyKey, []).filter((item) => item.userId === session?.user.id);
  return { version: 3, exportedAt: new Date().toISOString(), user: session?.user, history };
};

export const demoImportData = async (payload) => {
  const session = demoSession();
  if (!session || !Array.isArray(payload?.history)) throw new Error('El archivo de respaldo no es valido.');
  const existing = read(historyKey, []).filter((item) => item.userId !== session.user.id);
  const imported = payload.history.filter((item) => item?.type && item?.result).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    userId: session.user.id,
    createdAt: item.createdAt || new Date().toISOString()
  }));
  write(historyKey, [...imported, ...existing]);
  return { imported: imported.length };
};
