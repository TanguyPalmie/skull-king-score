const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      // Retry original request
      const retryRes = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
      return retryRes.status === 204 ? null : retryRes.json();
    }
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// Auth
export const register = (email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logout = () =>
  request('/auth/logout', { method: 'POST' });

export const getMe = () =>
  request('/auth/me');

// Games
export const saveGame = (gameState) =>
  request('/games', { method: 'PUT', body: JSON.stringify({ state: gameState }) });

export const loadGame = () =>
  request('/games');

export const deleteGame = () =>
  request('/games', { method: 'DELETE' });

// Settings
export const loadSettings = () =>
  request('/settings');

export const saveSettings = (settings) =>
  request('/settings', { method: 'PUT', body: JSON.stringify(settings) });
