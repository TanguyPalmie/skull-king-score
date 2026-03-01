const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401 && !path.includes('/auth/')) {
    // Try refresh
    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const retryRes = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${retryRes.status}`);
      }
      return retryRes.status === 204 ? null : retryRes.json();
    }
    throw new Error('Session expiree');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────
export const register = (email, pseudo, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, pseudo, password }) });

export const verify = (email, code) =>
  request('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) });

export const resendCode = (email) =>
  request('/auth/resend', { method: 'POST', body: JSON.stringify({ email }) });

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logout = () => request('/auth/logout', { method: 'POST' });

export const getMe = () => request('/auth/me');

// ── Games (legacy state) ─────────────────────────────────────────────
export const saveGame = (gameState) =>
  request('/games', { method: 'PUT', body: JSON.stringify({ state: gameState }) });

export const loadGame = () => request('/games');

export const deleteGame = () => request('/games', { method: 'DELETE' });

// ── Settings ──────────────────────────────────────────────────────────
export const loadSettings = () => request('/settings');

export const saveSettings = (settings) =>
  request('/settings', { method: 'PUT', body: JSON.stringify(settings) });

// ── Game Definitions (public) ─────────────────────────────────────────
export const getGameDefinitions = () => request('/game-definitions');

export const getGameDefinition = (slug) => request(`/game-definitions/${slug}`);

// ── Admin ─────────────────────────────────────────────────────────────
export const adminGetUsers = () => request('/admin/users');

export const adminGetGames = () => request('/admin/games');

export const adminCreateGame = (data) =>
  request('/admin/games', { method: 'POST', body: JSON.stringify(data) });

export const adminUpdateGame = (slug, data) =>
  request(`/admin/games/${slug}`, { method: 'PUT', body: JSON.stringify(data) });

export const adminDeleteGame = (slug) => request(`/admin/games/${slug}`, { method: 'DELETE' });

// ── Friends ───────────────────────────────────────────────────────────
export const getFriends = () => request('/friends');

export const getPendingRequests = () => request('/friends/pending');

export const getSentRequests = () => request('/friends/sent');

export const searchUsers = (q) => request(`/friends/search?q=${encodeURIComponent(q)}`);

export const sendFriendRequest = (pseudo) =>
  request('/friends/request', { method: 'POST', body: JSON.stringify({ pseudo }) });

export const acceptFriend = (requestId) => request(`/friends/accept/${requestId}`, { method: 'POST' });

export const rejectFriend = (requestId) => request(`/friends/reject/${requestId}`, { method: 'POST' });

export const removeFriend = (friendId) => request(`/friends/${friendId}`, { method: 'DELETE' });

// ── Scores ────────────────────────────────────────────────────────────
export const saveScore = (data) => request('/scores', { method: 'POST', body: JSON.stringify(data) });

export const getMyScores = (gameSlug) =>
  request(`/scores/me${gameSlug ? `?game_slug=${encodeURIComponent(gameSlug)}` : ''}`);

export const getFriendsScores = (gameSlug) =>
  request(`/scores/friends${gameSlug ? `?game_slug=${encodeURIComponent(gameSlug)}` : ''}`);

// ── Live Games ───────────────────────────────────────────────────────
export const saveLiveGame = (data) =>
  request('/live-games', { method: 'POST', body: JSON.stringify(data) });

export const getMyLiveGames = () => request('/live-games/mine');

export const getLiveGame = (code) => request(`/live-games/${code}`);

export const endLiveGame = (code) => request(`/live-games/${code}/end`, { method: 'PATCH' });
