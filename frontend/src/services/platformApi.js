// Unifica el backend remoto y el modo estatico local.
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

const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
const sessionStorageKey = 'mia_remote_session_v2';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const remoteSession = () => {
  try {
    return JSON.parse(localStorage.getItem(sessionStorageKey));
  } catch {
    return null;
  }
};

const saveRemoteSession = (session) => localStorage.setItem(sessionStorageKey, JSON.stringify(session));

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

export const platformApi = {
  isDemo: demoMode,
  session: () => demoMode ? demoSession() : remoteSession(),
  login: async (credentials) => {
    if (demoMode) return demoLogin(credentials);
    const { data } = await remoteCall(() => client.post('/auth/login', credentials));
    saveRemoteSession(data);
    return data;
  },
  register: async (payload) => {
    if (demoMode) return demoRegister(payload);
    const { data } = await remoteCall(() => client.post('/auth/register', payload));
    saveRemoteSession(data);
    return data;
  },
  logout: () => demoMode ? demoLogout() : localStorage.removeItem(sessionStorageKey),
  me: async () => {
    if (demoMode) return demoMe();
    const { data } = await remoteCall(() => client.get('/auth/me'));
    return data;
  },
  updateProfile: async (payload) => {
    if (demoMode) return demoUpdateProfile(payload);
    const { data } = await remoteCall(() => client.patch('/auth/profile', payload));
    const current = remoteSession();
    saveRemoteSession({ ...current, token: data.token || current.token, user: data.user });
    return data;
  },
  changePassword: async (payload) => {
    if (demoMode) return demoChangePassword(payload);
    await remoteCall(() => client.post('/auth/change-password', payload));
  },
  runOperation: async (type, payload) => {
    if (demoMode) return demoRunOperation(type, payload);
    const { data } = await remoteCall(() => client.post(`/ai/${type}`, payload));
    return data;
  },
  history: async (params = {}) => {
    if (demoMode) return demoHistory(params);
    const { data } = await remoteCall(() => client.get('/history', { params }));
    return data;
  },
  stats: async () => {
    if (demoMode) return demoStats();
    const { data } = await remoteCall(() => client.get('/history/stats'));
    return data;
  },
  deleteHistory: async (id) => {
    if (demoMode) return demoDeleteHistory(id);
    await remoteCall(() => client.delete(`/history/${id}`));
  },
  clearHistory: async () => {
    if (demoMode) return demoClearHistory();
    const { data } = await remoteCall(() => client.delete('/history'));
    return data;
  },
  health: async () => {
    if (demoMode) {
      return {
        service: 'frontend-static',
        status: 'ok',
        version: '2.0',
        services: {
          auth: { status: 'local', latencyMs: 0 },
          ai: { status: 'local', latencyMs: 0 },
          history: { status: 'local', latencyMs: 0 }
        }
      };
    }
    const baseUrl = client.defaults.baseURL.replace(/\/api\/?$/, '');
    const { data } = await remoteCall(() => axios.get(`${baseUrl}/health`, { timeout: 8000 }));
    return data;
  },
  exportData: async () => {
    if (demoMode) return demoExportData();
    const response = await platformApi.history({ limit: 500, offset: 0 });
    return { version: 2, exportedAt: new Date().toISOString(), user: remoteSession()?.user, history: response.items };
  },
  importData: async (payload) => {
    if (!demoMode) throw new Error('La importacion directa solo esta disponible en el modo GitHub Pages.');
    return demoImportData(payload);
  }
};
