import { accessToken, logout } from './auth.js';

const BASE = 'https://api.spotify.com/v1';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET only — this app never writes to the user's account.
export async function get(pathOrUrl, params, { forceRefresh = false, tries = 0 } = {}) {
  const url = new URL(pathOrUrl.startsWith('http') ? pathOrUrl : BASE + pathOrUrl);
  if (params) for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);

  const token = await accessToken({ force: forceRefresh });
  if (!token) throw new ApiError(401, '로그인이 필요합니다.');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 204) return null; // e.g. nothing currently playing
  if (res.status === 401 && !forceRefresh) return get(url.href, null, { forceRefresh: true, tries });
  if (res.status === 429 && tries < 3) {
    const wait = Number(res.headers.get('Retry-After')) || 2;
    await sleep(Math.min(wait, 30) * 1000);
    return get(url.href, null, { tries: tries + 1 });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) logout();
    throw new ApiError(res.status, body?.error?.message || `HTTP ${res.status}`);
  }
  return body;
}

// Some list endpoints have had their max `limit` lowered; retry with a smaller page on 400.
export async function getList(path, params = {}) {
  try {
    return await get(path, params);
  } catch (e) {
    if (e.status === 400 && params.limit > 10) return get(path, { ...params, limit: 10 });
    throw e;
  }
}

// Playlist objects: Feb 2026 renamed `tracks` → `items` and `track` → `item`. Accept both shapes.
export const playlistCount = (p) => (p.items ?? p.tracks)?.total;
export const entryOf = (row) => row?.item ?? row?.track ?? null;
