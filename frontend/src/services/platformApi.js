// Unifica el acceso al backend y al modo demostracion.
import axios from 'axios';
import {
  demoDeleteHistory,
  demoHistory,
  demoLogin,
  demoLogout,
  demoRegister,
  demoRunOperation,
  demoSession,
  demoStats
} from './demoRepository.js';

const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
const sessionStorageKey = 'mia_remote_session';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
});

const remoteSession = () => {
  try {
    return JSON.parse(localStorage.getItem(sessionStorageKey));
  } catch {
    return null;
  }
};

client.interceptors.request.use((config) => {
  const token = remoteSession()?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
    localStorage.setItem(sessionStorageKey, JSON.stringify(data));
    return data;
  },
  register: async (payload) => {
    if (demoMode) return demoRegister(payload);
    const { data } = await remoteCall(() => client.post('/auth/register', payload));
    localStorage.setItem(sessionStorageKey, JSON.stringify(data));
    return data;
  },
  logout: () => {
    demoMode ? demoLogout() : localStorage.removeItem(sessionStorageKey);
  },
  runOperation: async (type, payload) => {
    if (demoMode) return demoRunOperation(type, payload);
    const { data } = await remoteCall(() => client.post(`/ai/${type}`, payload));
    return data;
  },
  history: async () => {
    if (demoMode) return demoHistory();
    const { data } = await remoteCall(() => client.get('/history'));
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
  health: async () => {
    if (demoMode) {
      return { service: 'frontend-static', status: 'ok', services: { auth: 'local', ai: 'local', history: 'local' } };
    }

    const baseUrl = client.defaults.baseURL.replace(/\/api\/?$/, '');
    const { data } = await remoteCall(() => axios.get(`${baseUrl}/health`, { timeout: 5000 }));
    return data;
  }
};
