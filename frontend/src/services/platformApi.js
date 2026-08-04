// Unifica sesiones, entornos y operaciones de MiaServicios.
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
  demoRestoreHistory,
  demoRunOperation,
  demoSession,
  demoSetHistoryFavorite,
  demoStats,
  demoUpdateProfile
} from './demoRepository.js';
import {
  canRefreshSession,
  isAccessExpired,
  isRefreshExpired,
  normalizeSession,
  readStoredJson
} from './session.js';

const settingsKey = 'mia_runtime_settings';
const sessionStorageKey = 'mia_remote_session_v3';
const legacySessionKeys = ['mia_remote_session', 'mia_remote_session_v2'];
const runtimeDefaults = window.MiaServiciosConfig || {};
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isViteDevelopment = isLocalHost && window.location.port === '5173';
const inferredApiUrl = isViteDevelopment ? 'http://localhost:4000/api' : `${window.location.origin}/api`;
const environmentApiUrl = import.meta.env.VITE_API_URL || '';
const isStaticHost = window.location.protocol === 'file:' || window.location.hostname.endsWith('github.io');

class PlatformError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', requestId = null } = {}) {
    super(message);
    this.name = 'PlatformError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const migrateSession = () => {
  if (!localStorage.getItem(sessionStorageKey)) {
    const legacyKey = legacySessionKeys.find((key) => localStorage.getItem(key));
    if (legacyKey) localStorage.setItem(sessionStorageKey, localStorage.getItem(legacyKey));
  }
  legacySessionKeys.forEach((key) => localStorage.removeItem(key));
};

migrateSession();

const savedSettings = readStoredJson(settingsKey, {});
let hasExplicitApiUrl = Boolean(savedSettings?.apiUrl || runtimeDefaults.apiUrl || environmentApiUrl);
let preferredMode = savedSettings.mode || runtimeDefaults.mode || 'auto';
let configuredApiUrl = savedSettings.apiUrl || runtimeDefaults.apiUrl || environmentApiUrl || inferredApiUrl;
let activeMode = 'browser';
let lastProbe = null;
let refreshPromise = null;

const normalizeApiUrl = (value) => String(value || '').trim().replace(/\/$/, '');
const client = axios.create({
  baseURL: normalizeApiUrl(configuredApiUrl),
  timeout: Number(runtimeDefaults.requestTimeout || 8000),
  headers: { 'Content-Type': 'application/json' }
});

const remoteSession = () => normalizeSession(readStoredJson(sessionStorageKey));
const saveRemoteSession = (session) => {
  const normalized = normalizeSession(session);
  if (normalized) localStorage.setItem(sessionStorageKey, JSON.stringify(normalized));
  else localStorage.removeItem(sessionStorageKey);
  return normalized;
};
const persistSettings = () => localStorage.setItem(settingsKey, JSON.stringify({ mode: preferredMode, apiUrl: configuredApiUrl }));
const requestId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const healthUrl = (apiUrl = configuredApiUrl) => normalizeApiUrl(apiUrl).replace(/\/api$/, '') + '/health';

const notifyRuntime = () => window.dispatchEvent(new CustomEvent('mia:runtime-change', { detail: platformApi.runtime() }));
const clearRemoteSession = (reason = 'expired') => {
  const existed = Boolean(remoteSession());
  localStorage.removeItem(sessionStorageKey);
  legacySessionKeys.forEach((key) => localStorage.removeItem(key));
  if (existed) window.dispatchEvent(new CustomEvent('mia:session-expired', { detail: { reason } }));
};

const errorFrom = (error) => {
  if (error instanceof PlatformError) return error;
  const payload = error.response?.data || {};
  const status = Number(error.response?.status || 0);
  const message = payload.message || (error.code === 'ECONNABORTED'
    ? 'La solicitud excedió el tiempo de espera.'
    : error.message || 'No fue posible completar la solicitud.');
  return new PlatformError(message, {
    status,
    code: payload.code || (error.response ? 'REMOTE_ERROR' : 'CONNECTION_ERROR'),
    requestId: payload.requestId || error.response?.headers?.['x-request-id'] || null
  });
};

const refreshRemoteSession = async () => {
  if (refreshPromise) return refreshPromise;
  const current = remoteSession();
  if (!canRefreshSession(current)) {
    clearRemoteSession('expired');
    throw new PlatformError('Tu sesión venció. Inicia sesión nuevamente.', { status: 401, code: 'SESSION_EXPIRED' });
  }

  refreshPromise = axios.post(`${normalizeApiUrl(configuredApiUrl)}/auth/refresh`, {
    refreshToken: current.refreshToken
  }, {
    timeout: Number(runtimeDefaults.requestTimeout || 8000),
    headers: { 'Content-Type': 'application/json', 'x-request-id': requestId() }
  }).then(({ data }) => {
    const next = saveRemoteSession(data);
    window.dispatchEvent(new CustomEvent('mia:session-refreshed', { detail: next }));
    return next;
  }).catch((error) => {
    const platformError = errorFrom(error);
    if (platformError.status === 401 || platformError.status === 403) {
      clearRemoteSession('expired');
      throw new PlatformError('Tu sesión venció. Inicia sesión nuevamente.', { status: 401, code: 'SESSION_EXPIRED' });
    }
    throw platformError;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

client.interceptors.request.use((config) => {
  const token = remoteSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-request-id'] = requestId();
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const path = String(config.url || '');
    const publicAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh'].some((value) => path.includes(value));

    if (status === 401 && !config.__miaRetried && !publicAuthRequest) {
      const current = remoteSession();
      if (canRefreshSession(current)) {
        config.__miaRetried = true;
        try {
          const next = await refreshRemoteSession();
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${next.token}`;
          return client(config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      clearRemoteSession('expired');
      return Promise.reject(new PlatformError('Tu sesión venció. Inicia sesión nuevamente.', { status: 401, code: 'SESSION_EXPIRED' }));
    }

    return Promise.reject(errorFrom(error));
  }
);

const remoteCall = async (action) => {
  try {
    return await action();
  } catch (error) {
    throw errorFrom(error);
  }
};

const probe = async (apiUrl = configuredApiUrl) => {
  const startedAt = performance.now();
  try {
    const response = await axios.get(healthUrl(apiUrl), {
      timeout: 3000,
      validateStatus: (status) => status >= 200 && status < 600
    });
    const data = response.data || {};
    lastProbe = {
      ok: ['ok', 'degraded'].includes(data.status),
      checkedAt: new Date().toISOString(),
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      data
    };
  } catch (error) {
    lastProbe = {
      ok: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      message: errorFrom(error).message
    };
  }
  notifyRuntime();
  return lastProbe;
};

const prepareRemoteSession = async () => {
  const current = remoteSession();
  if (!current) return null;
  if (isRefreshExpired(current)) {
    clearRemoteSession('expired');
    return null;
  }
  if (isAccessExpired(current)) {
    if (!canRefreshSession(current)) {
      clearRemoteSession('expired');
      return null;
    }
    try {
      return await refreshRemoteSession();
    } catch (error) {
      if (error.code === 'CONNECTION_ERROR') return current;
      return null;
    }
  }
  return current;
};

const initialize = async () => {
  client.defaults.baseURL = normalizeApiUrl(configuredApiUrl);
  if (preferredMode === 'browser') {
    activeMode = 'browser';
    notifyRuntime();
    return activeMode;
  }

  if (preferredMode === 'auto' && isStaticHost && !hasExplicitApiUrl) {
    activeMode = 'browser';
    notifyRuntime();
    return activeMode;
  }

  const result = await probe();
  if (result.ok) {
    activeMode = 'services';
    await prepareRemoteSession();
    notifyRuntime();
    return activeMode;
  }

  activeMode = preferredMode === 'services' ? 'services' : 'browser';
  notifyRuntime();
  return activeMode;
};

export const platformApi = {
  initialize,
  get isDemo() {
    return activeMode === 'browser';
  },
  session: () => activeMode === 'browser' ? demoSession() : remoteSession(),
  runtime: () => ({ preferredMode, activeMode, apiUrl: configuredApiUrl, lastProbe }),
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
    return saveRemoteSession(data);
  },
  register: async (payload) => {
    if (activeMode === 'browser') return demoRegister(payload);
    const { data } = await remoteCall(() => client.post('/auth/register', payload));
    return saveRemoteSession(data);
  },
  logout: async () => {
    if (activeMode === 'browser') return demoLogout();
    const current = remoteSession();
    localStorage.removeItem(sessionStorageKey);
    if (current?.refreshToken) {
      await axios.post(`${normalizeApiUrl(configuredApiUrl)}/auth/logout`, { refreshToken: current.refreshToken }, { timeout: 3000 }).catch(() => null);
    }
  },
  me: async () => {
    if (activeMode === 'browser') return demoMe();
    const { data } = await remoteCall(() => client.get('/auth/me'));
    return data;
  },
  updateProfile: async (payload) => {
    if (activeMode === 'browser') return demoUpdateProfile(payload);
    const { data } = await remoteCall(() => client.patch('/auth/profile', payload));
    const current = remoteSession();
    saveRemoteSession({ ...current, token: data.token || current?.token, expiresAt: data.expiresAt || current?.expiresAt, user: data.user });
    return data;
  },
  changePassword: async (payload) => {
    if (activeMode === 'browser') return demoChangePassword(payload);
    await remoteCall(() => client.post('/auth/change-password', payload));
    clearRemoteSession('password-changed');
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
  setHistoryFavorite: async (id, favorite) => {
    if (activeMode === 'browser') return demoSetHistoryFavorite(id, favorite);
    const { data } = await remoteCall(() => client.patch(`/history/${id}/favorite`, { favorite }));
    return data;
  },
  deleteHistory: async (id) => {
    if (activeMode === 'browser') return demoDeleteHistory(id);
    await remoteCall(() => client.delete(`/history/${id}`));
  },
  restoreHistory: async (id) => {
    if (activeMode === 'browser') return demoRestoreHistory(id);
    const { data } = await remoteCall(() => client.post(`/history/${id}/restore`));
    return data;
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
        release: '3.2.0',
        runtime: 'browser',
        services: {
          auth: { status: 'local', latencyMs: 0 },
          ai: { status: 'local', latencyMs: 0 },
          history: { status: 'local', latencyMs: 0 }
        }
      };
    }
    const response = await remoteCall(() => axios.get(healthUrl(), {
      timeout: 8000,
      validateStatus: (status) => status >= 200 && status < 600
    }));
    return { ...response.data, runtime: 'services' };
  },
  exportData: async () => {
    if (activeMode === 'browser') return demoExportData();
    const response = await platformApi.history({ limit: 500, offset: 0 });
    return { schema: 3.2, exportedAt: new Date().toISOString(), user: remoteSession()?.user, history: response.items };
  },
  importData: async (payload) => {
    if (activeMode !== 'browser') throw new PlatformError('La importación directa está disponible en el modo navegador.', { code: 'IMPORT_BROWSER_ONLY' });
    return demoImportData(payload);
  }
};
