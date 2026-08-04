// Valida y normaliza la informacion de sesion del navegador.
export const readStoredJson = (key, fallback = null) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export const decodeJwtPayload = (token) => {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(decodeURIComponent(atob(padded).split('').map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
  } catch {
    return null;
  }
};

const timeFrom = (value) => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const accessExpiresAt = (session) => {
  const explicit = timeFrom(session?.expiresAt);
  if (explicit) return explicit;
  const payload = decodeJwtPayload(session?.token);
  return payload?.exp ? payload.exp * 1000 : null;
};

export const isAccessExpired = (session, skewSeconds = 20) => {
  if (!session?.token) return true;
  const expiresAt = accessExpiresAt(session);
  return expiresAt ? expiresAt <= Date.now() + skewSeconds * 1000 : false;
};

export const isRefreshExpired = (session) => {
  if (!session?.refreshToken) return true;
  const expiresAt = timeFrom(session.refreshExpiresAt);
  return expiresAt ? expiresAt <= Date.now() : false;
};

export const canRefreshSession = (session) => Boolean(session?.refreshToken && !isRefreshExpired(session));

export const normalizeSession = (session) => {
  if (!session?.user) return null;
  if (!session.token && !session.refreshToken) return null;
  return {
    token: session.token || '',
    refreshToken: session.refreshToken || '',
    expiresAt: session.expiresAt || null,
    refreshExpiresAt: session.refreshExpiresAt || null,
    user: session.user
  };
};
