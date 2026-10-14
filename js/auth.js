// Authorization Code + PKCE (no client secret; runs entirely in the browser).
// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Read-only scopes. Nothing here allows playback control or library changes.
export const SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-follow-read',
];

const K = {
  clientId: 'spv.clientId',
  verifier: 'spv.verifier',
  state: 'spv.state',
  token: 'spv.token',
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

export function redirectUri() {
  // The page itself handles the callback; register this exact URL in the Spotify dashboard.
  return location.origin + location.pathname;
}

export const getClientId = () => store.get(K.clientId) || '';
export const setClientId = (id) => store.set(K.clientId, id.trim());

function randomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function challengeFor(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function login() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Client ID가 설정되지 않았습니다.');
  const verifier = randomString(64);
  const state = randomString(16);
  store.set(K.verifier, verifier);
  store.set(K.state, state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: await challengeFor(verifier),
    redirect_uri: redirectUri(),
    state,
  });
  location.assign(`${AUTH_URL}?${params}`);
}

function saveToken(json, prev) {
  const tok = {
    access_token: json.access_token,
    // A refresh response may omit refresh_token; keep using the previous one then.
    refresh_token: json.refresh_token || prev?.refresh_token,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
    scope: json.scope,
  };
  store.set(K.token, JSON.stringify(tok));
  return tok;
}

function loadToken() {
  try { return JSON.parse(store.get(K.token)); } catch { return null; }
}

async function postToken(body) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error_description || json.error || `token ${res.status}`);
    err.code = json.error;
    throw err;
  }
  return json;
}

// Call once on page load. Returns true if a callback was handled.
export async function handleCallback() {
  const q = new URLSearchParams(location.search);
  if (!q.has('code') && !q.has('error')) return false;
  const clean = () => history.replaceState(null, '', redirectUri() + location.hash);
  try {
    if (q.get('error')) throw new Error(`로그인 취소/실패: ${q.get('error')}`);
    if (q.get('state') !== store.get(K.state)) throw new Error('state 값이 일치하지 않습니다. 다시 로그인해 주세요.');
    const verifier = store.get(K.verifier);
    if (!verifier) throw new Error('code_verifier를 찾을 수 없습니다. 같은 브라우저에서 다시 로그인해 주세요.');
    const json = await postToken({
      grant_type: 'authorization_code',
      code: q.get('code'),
      redirect_uri: redirectUri(),
      client_id: getClientId(),
      code_verifier: verifier,
    });
    saveToken(json);
    return true;
  } finally {
    store.del(K.verifier);
    store.del(K.state);
    clean();
  }
}

let refreshing = null;

export async function accessToken({ force = false } = {}) {
  const tok = loadToken();
  if (!tok) return null;
  if (!force && Date.now() < tok.expires_at) return tok.access_token;
  if (!tok.refresh_token) { logout(); return null; }
  refreshing ??= postToken({
    grant_type: 'refresh_token',
    refresh_token: tok.refresh_token,
    client_id: getClientId(),
  }).then((json) => saveToken(json, tok).access_token)
    .catch((e) => {
      // invalid_grant = refresh token revoked or expired (Spotify expires them after 6 months).
      if (e.code === 'invalid_grant') { logout(); return null; }
      throw e;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export const isLoggedIn = () => !!loadToken();
export const grantedScopes = () => (loadToken()?.scope || '').split(' ').filter(Boolean);
export function logout() { store.del(K.token); }
