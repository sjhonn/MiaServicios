// Unifica el funcionamiento local, conectado y publicado de MiaServicios.
import axios from 'axios';
import {
  demoChangePassword,
  demoClearHistory,
  demoDeleteHistory,
  demoExportData,
  demoHistory,
  demoImportData,
  demoLogin,
  demoLogout,
  demoMe,
  demoRegister,
  demoRunOperation,
  demoSession,
  demoStats,
  demoUpdateProfile
} from './demoRepository.js';

const settingsKey = 'mia_runtime_settings';
const sessionStorageKey = 'mia_remote_session';
const runtimeDefaults = window.MiaServiciosConfig || {};
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const inferredApiUrl = isLocalHost ? 'http://localhost:4000/api' : `${window.location.origin}/api`;
const environmentApiUrl = import.meta.env.VITE_API_URL || '';
const isStaticHost = window.location.protocol === 'file:' || window.location.hostname.endsWith('github.io');

const readJson = (key, fallback = null) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const savedSettings = readJson(settingsKey, {});
let hasExplicitApiUrl = Boolean(savedSettings?.apiUrl || runtimeDefaults.apiUrl || environmentApiUrl);
let preferredMode = savedSettings.mode || runtimeDefaults.mode || 'auto';
let configuredApiUrl = savedSettings.apiUrl || runtimeDefaults.apiUrl || environmentApiUrl || inferredApiUrl;
let activeMode = 'browser';
let lastProbe = null;

const normalizeApiUrl = (value) => String(value || '').trim().replace(/\/$/, '');
const client = axios.create({
  baseURL: normalizeApiUrl(configuredApiUrl),
  timeout: Number(runtimeDefaults.requestTimeout || 8000),
  headers: { 'Content-Type': 'application/json' }
});

const remoteSession = () => readJson(sessionStorageKey);
const saveRemoteSession = (session) => localStorage.setItem(sessionStorageKey, JSON.stringify(session));
const persistSettings = () => localStorage.setItem(settingsKey, JSON.stringify({ mode: preferredMode, apiUrl: configuredApiUrl }));

client.interceptors.request.use((config) => {
  const token = remoteSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-request-id'] = crypto.randomUUID();
  return config;
});

const messageFrom = (error) => error.response?.data?.message || error.message || 'No fue posible completar la solicitud.';
const remoteCall = async (action) => {
  try {
    return await action();
  } catch (error) {
    throw new Error(messageFrom(error));
  }
};

const healthUrl = (apiUrl = configuredApiUrl) => normalizeApiUrl(apiUrl).replace(/\/api$/, '') + '/health';

const probe = async (apiUrl = configuredApiUrl) => {
  const startedAt = performance.now();
  try {
    const { data } = await axios.get(healthUrl(apiUrl), { timeout: 2500 });
    lastProbe = {
      ok: data?.status === 'ok' || data?.status === 'degraded',
      checkedAt: new Date().toISOString(),
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      data
    };
  } catch (error) {
    lastProbe = {
      ok: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      message: messageFrom(error)
    };
  }
  return lastProbe;
};

const initialize = async () => {
  client.defaults.baseURL = normalizeApiUrl(configuredApiUrl);
  if (preferredMode === 'browser') {
    activeMode = 'browser';
    return activeMode;
  }

  if (preferredMode === 'auto' && isStaticHost && !hasExplicitApiUrl) {
    activeMode = 'browser';
    return activeMode;
  }

  const result = await probe();
  if (result.ok) {
    activeMode = 'services';
    return activeMode;
  }

  if (preferredMode === 'services') {
    activeMode = 'services';
    return activeMode;
  }

  activeMode = 'browser';
  return activeMode;
};

export const platformApi = {
  initialize,
  get isDemo() {
    return activeMode === 'browser';
  },
  session: () => activeMode === 'browser' ? demoSession() : remoteSession(),
  runtime: () => ({
    preferredMode,
    activeMode,
    apiUrl: configuredApiUrl,
    lastProbe
  }),
  configure: async ({ mode, apiUrl }) => {
    preferredMode = ['auto', 'browser', 'services'].includes(mode) ? mode : 'auto';
    configuredApiUrl = normalizeApiUrl(apiUrl || inferredApiUrl);
    hasExplicitApiUrl = Boolean(String(apiUrl || '').trim());
    client.defaults.baseURL = configuredApiUrl;
    persistSettings();
    await initialize();
    return platformApi.runtime();
  },
  testConnection: async (apiUrl = configuredApiUrl) => probe(apiUrl),
  login: async (credentials) => {
    if (activeMode === 'browser') return demoLogin(credentials);
    const { data } = await remoteCall(() => client.post('/auth/login', credentials));
    saveRemoteSession(data);
    return data;
  },
  register: async (payload) => {
    if (activeMode === 'browser') return demoRegister(payload);
    const { data } = await remoteCall(() => client.post('/auth/register', payload));
    saveRemoteSession(data);
    return data;
  },
  logout: () => activeMode === 'browser' ? demoLogout() : localStorage.removeItem(sessionStorageKey),
  me: async () => {
    if (activeMode === 'browser') return demoMe();
    const { data } = await remoteCall(() => client.get('/auth/me'));
    return data;
  },
  updateProfile: async (payload) => {
    if (activeMode === 'browser') return demoUpdateProfile(payload);
    const { data } = await remoteCall(() => client.patch('/auth/profile', payload));
    const current = remoteSession();
    saveRemoteSession({ ...current, token: data.token || current.token, user: data.user });
    return data;
  },
  changePassword: async (payload) => {
    if (activeMode === 'browser') return demoChangePassword(payload);
    await remoteCall(() => client.post('/auth/change-password', payload));
  },
  runOperation: async (type, payload) => {
    if (activeMode === 'browser') return demoRunOperation(type, payload);
    const { data } = await remoteCall(() => client.post(`/ai/${type}`, payload));
    return data;
  },
  history: async (params = {}) => {
    if (activeMode === 'browser') return demoHistory(params);
    const { data } = await remoteCall(() => client.get('/history', { params }));
    return data;
  },
  stats: async () => {
    if (activeMode === 'browser') return demoStats();
    const { data } = await remoteCall(() => client.get('/history/stats'));
    return data;
  },
  deleteHistory: async (id) => {
    if (activeMode === 'browser') return demoDeleteHistory(id);
    await remoteCall(() => client.delete(`/history/${id}`));
  },
  clearHistory: async () => {
    if (activeMode === 'browser') return demoClearHistory();
    const { data } = await remoteCall(() => client.delete('/history'));
    return data;
  },
  health: async () => {
    if (activeMode === 'browser') {
      return {
        service: 'MiaServicios',
        status: 'ok',
        release: '3.0.0',
        runtime: 'browser',
        services: {
          auth: { status: 'local', latencyMs: 0 },
          ai: { status: 'local', latencyMs: 0 },
          history: { status: 'local', latencyMs: 0 }
        }
      };
    }
    const { data } = await remoteCall(() => axios.get(healthUrl(), { timeout: 8000 }));
    return { ...data, runtime: 'services' };
  },
  exportData: async () => {
    if (activeMode === 'browser') return demoExportData();
    const response = await platformApi.history({ limit: 500, offset: 0 });
    return { schema: 3, exportedAt: new Date().toISOString(), user: remoteSession()?.user, history: response.items };
  },
  importData: async (payload) => {
    if (activeMode !== 'browser') throw new Error('La importación directa está disponible en el modo navegador.');
    return demoImportData(payload);
  }
};
