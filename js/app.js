import * as auth from './auth.js';
import { get, getList, ApiError } from './api.js';

const $view = document.getElementById('view');
const $chrome = document.getElementById('chrome');
const $layers = document.querySelectorAll('#bg .layer');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (images, min = 300) => {
  if (!images?.length) return '';
  const s = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  return (s.find((i) => (i.width || 0) >= min) || s.at(-1)).url;
};
const artOf = (item, min) => pick(item?.album?.images || item?.images || item?.show?.images, min);
const artistsOf = (x) => (x?.artists || []).map((a) => a.name).join(', ') || x?.show?.name || '';
const fmt = (ms) => { const s = Math.max(0, Math.floor((ms || 0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const timeStr = (d = new Date()) => d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
const dateStr = (d = new Date()) => d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

const ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
};

// ---------- ambient background + accent color ----------
let bgUrl = '', bgIdx = 0;
function setBackground(url) {
  if (!url || url === bgUrl) return;
  bgUrl = url;
  const img = new Image();
  img.onload = () => {
    if (bgUrl !== url) return;
    bgIdx ^= 1;
    $layers[bgIdx].style.backgroundImage = `url("${url}")`;
    $layers[bgIdx].classList.add('on');
    $layers[bgIdx ^ 1].classList.remove('on');
  };
  img.src = url;
  setAccentFrom(url);
}

// Pick a vivid color from the artwork for the progress bar / highlights.
// Needs the image CDN to allow CORS; if it doesn't, we silently keep white.
function setAccentFrom(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let best = null, bestScore = -1;
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const score = s * (1 - Math.abs(l - 0.55) * 1.6);
        if (score > bestScore) { bestScore = score; best = [h, s, l]; }
      }
      if (!best || best[1] < 0.18) { setAccent([255, 255, 255]); return; }
      setAccent(hslToRgb(best[0], Math.min(1, best[1] * 1.15 + 0.1), 0.64));
    } catch { setAccent([255, 255, 255]); }
  };
  img.onerror = () => setAccent([255, 255, 255]);
  img.src = url;
}
const setAccent = ([r, g, b]) => document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`);
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb(h, s, l) {
  const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}

// ---------- chrome: auto-hide, wake lock, fullscreen ----------
let idleTimer = 0, autoHide = false;
function poke() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  if (autoHide) idleTimer = setTimeout(() => document.body.classList.add('idle'), 3500);
}
['pointerdown', 'pointermove', 'keydown'].forEach((e) => addEventListener(e, poke, { passive: true }));

const $wake = document.getElementById('btn-wake');
const $fs = document.getElementById('btn-fs');
const $out = document.getElementById('btn-out');
$wake.innerHTML = ICONS.sun; $fs.innerHTML = ICONS.expand; $out.innerHTML = ICONS.out;

let wakeLock = null;
let wantWake = (() => { try { return localStorage.getItem('spv.wake') === '1'; } catch { return false; } })();
async function applyWake() {
  $wake.classList.toggle('on', wantWake);
  try {
    if (wantWake && !wakeLock && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!wantWake && wakeLock) {
      await wakeLock.release(); wakeLock = null;
    }
  } catch { /* refused (battery saver etc.) — keep the preference, retry on next visibility change */ }
}
if ('wakeLock' in navigator) {
  $wake.onclick = () => { wantWake = !wantWake; try { localStorage.setItem('spv.wake', wantWake ? '1' : '0'); } catch {} applyWake(); };
  document.addEventListener('visibilitychange', applyWake);
} else $wake.hidden = true;

const root = document.documentElement;
const fsEnabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
if (fsEnabled) {
  $fs.onclick = () => {
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
  };
} else $fs.hidden = true; // iPhone Safari has no element fullscreen

$out.onclick = () => { if (confirm('로그아웃할까요?')) { auth.logout(); location.hash = '#/'; route(); } };

// ---------- NOW PLAYING ----------
let cleanup = [];
const onLeave = (f) => cleanup.push(f);

async function fetchPlayer() {
  try {
    return await get('/me/player', { additional_types: 'track,episode' });
  } catch (e) {
    // Fall back to the narrower endpoint if /me/player is unavailable for this token.
    if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
      return get('/me/player/currently-playing', { additional_types: 'track,episode' });
    }
    throw e;
  }
}

function viewNow() {
  autoHide = true; poke();
  $view.innerHTML = '<div class="center-msg">불러오는 중…</div>';

  let state = null, at = 0, shownKey = null, mode = null, artIdx = 0, timer = 0, alive = true;

  const els = {};
  const buildPlaying = () => {
    mode = 'playing'; shownKey = null;
    $view.innerHTML = `
      <section class="np">
        <div class="np-inner">
          <div class="art-wrap"><div class="art-ph"></div><img alt=""><img alt=""></div>
          <div class="meta">
            <div class="status"><span class="eq"><i></i><i></i><i></i></span><span class="st"></span></div>
            <div class="text-swap">
              <div class="title"></div>
              <div class="artist"></div>
              <div class="album"></div>
            </div>
            <div class="progress">
              <div class="track-line"><i></i></div>
              <div class="times tnum"><span class="cur">0:00</span><span class="dur">0:00</span></div>
            </div>
            <div class="device"></div>
          </div>
        </div>
      </section>
      <div class="mini-clock tnum"></div>`;
    const q = (s) => $view.querySelector(s);
    Object.assign(els, {
      np: q('.np'), inner: q('.np-inner'), imgs: $view.querySelectorAll('.art-wrap img'),
      st: q('.st'), swap: q('.text-swap'), title: q('.title'), artist: q('.artist'), album: q('.album'),
      bar: q('.track-line > i'), cur: q('.cur'), dur: q('.dur'), device: q('.device'), clock: q('.mini-clock'),
    });
  };

  const buildIdle = async () => {
    mode = 'idle'; shownKey = null;
    $view.innerHTML = `
      <section class="np"><div class="clock-screen fade-in">
        <div class="big-clock tnum"></div>
        <div class="big-date"></div>
        <div class="last-slot"></div>
      </div></section>`;
    els.bigClock = $view.querySelector('.big-clock');
    els.bigDate = $view.querySelector('.big-date');
    tickClock();
    try {
      const r = await get('/me/player/recently-played', { limit: 1 });
      const t = r?.items?.[0]?.track;
      if (!t || mode !== 'idle') return;
      setBackground(artOf(t, 300));
      $view.querySelector('.last-slot').innerHTML = `
        <div class="last fade-in">
          <img src="${esc(artOf(t, 64))}" alt="">
          <div><div class="k">마지막으로 들은 곡</div><div class="n">${esc(t.name)}</div><div class="a">${esc(artistsOf(t))}</div></div>
        </div>`;
    } catch { /* optional */ }
  };

  const tickClock = () => {
    if (els.clock?.isConnected) els.clock.textContent = timeStr();
    if (els.bigClock?.isConnected) {
      const parts = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).formatToParts(new Date());
      const ampm = parts.find((p) => p.type === 'dayPeriod')?.value || '';
      const hm = parts.filter((p) => p.type === 'hour' || p.type === 'minute' || (p.type === 'literal' && p.value.includes(':'))).map((p) => p.value).join('');
      els.bigClock.innerHTML = `${ampm ? `<span class="ampm">${esc(ampm)}</span>` : ''}${esc(hm)}`;
      els.bigDate.textContent = dateStr();
    }
  };

  const progressNow = () => {
    const dur = state?.item?.duration_ms || 0;
    const p = (state?.progress_ms || 0) + (state?.is_playing ? Date.now() - at : 0);
    return Math.min(dur, p);
  };

  const paintProgress = () => {
    if (mode !== 'playing' || !state?.item) return;
    const dur = state.item.duration_ms || 0, p = progressNow();
    els.bar.style.width = dur ? `${(p / dur) * 100}%` : '0';
    els.cur.textContent = fmt(p);
    els.dur.textContent = fmt(dur);
  };

  const swapArt = (url) => {
    if (!url) return;
    const next = els.imgs[artIdx ^ 1], cur = els.imgs[artIdx];
    next.onload = () => { next.classList.add('on'); cur.classList.remove('on'); artIdx ^= 1; };
    next.src = url;
  };

  const render = async () => {
    const it = state?.item;
    if (!it) { if (mode !== 'idle') await buildIdle(); return; }
    if (mode !== 'playing') buildPlaying();

    els.np.classList.toggle('paused', !state.is_playing);
    els.st.textContent = state.is_playing ? 'Now Playing' : 'Paused';
    const dev = state.device?.name;
    els.device.innerHTML = dev ? `${ICONS.device}<span>${esc(dev)}</span>` : '';

    const key = it.uri || it.id || it.name;
    if (key !== shownKey) {
      const first = shownKey === null;
      shownKey = key;
      swapArt(artOf(it, 600));
      setBackground(artOf(it, 300));
      if (!first) { els.swap.classList.add('out'); await sleep(350); }
      els.title.textContent = it.name;
      els.artist.textContent = artistsOf(it);
      els.album.textContent = it.album?.name || it.show?.publisher || '';
      document.title = `${it.name} · ${artistsOf(it)}`;
      els.swap.classList.remove('out');
    }
    paintProgress();
  };

  const poll = async () => {
    clearTimeout(timer);
    if (!alive) return;
    let delay = 5000;
    if (document.visibilityState === 'visible') {
      try {
        state = await fetchPlayer();
        at = Date.now();
        await render();
        // Re-check right after the current track should end, so the next song appears promptly.
        if (state?.is_playing && state.item?.duration_ms) {
          const left = state.item.duration_ms - progressNow();
          delay = Math.max(1200, Math.min(delay, left + 800));
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) { route(); return; }
        delay = 15000; // network hiccup: keep the last frame on screen and retry later
      }
    }
    if (alive) timer = setTimeout(poll, delay);
  };

  const onVis = () => { if (document.visibilityState === 'visible') poll(); };
  document.addEventListener('visibilitychange', onVis);
  const tick = setInterval(() => { paintProgress(); tickClock(); }, 1000);
  // Anti burn-in: nudge the layout a few pixels every minute (OLED iPhones / iPad Pro).
  const drift = setInterval(() => {
    if (els.inner?.isConnected) els.inner.style.transform = `translate(${(Math.random() * 12 - 6).toFixed(1)}px, ${(Math.random() * 12 - 6).toFixed(1)}px)`;
  }, 60000);

  onLeave(() => {
    alive = false; clearTimeout(timer); clearInterval(tick); clearInterval(drift);
    document.removeEventListener('visibilitychange', onVis);
    document.title = 'Now Playing';
  });
  poll();
}

// ---------- TOP ----------
const RANGES = { short_term: '최근 4주', medium_term: '최근 6개월', long_term: '약 1년' };

async function viewTop(q) {
  autoHide = false; poke();
  const kind = q.get('kind') === 'artists' ? 'artists' : 'tracks';
  const range = RANGES[q.get('range')] ? q.get('range') : 'short_term';
  const href = (k, r) => `#/top?kind=${k}&range=${r}`;
  const isArtist = kind === 'artists';

  $view.innerHTML = `
    <section class="top">
      <div class="top-head">
        <h1>My Top <span>${isArtist ? 'Artists' : 'Tracks'}</span></h1>
        <div class="controls">
          <div class="seg">
            <a href="${href('tracks', range)}" class="${!isArtist ? 'on' : ''}">곡</a>
            <a href="${href('artists', range)}" class="${isArtist ? 'on' : ''}">아티스트</a>
          </div>
          <div class="seg">${Object.entries(RANGES).map(([k, v]) => `<a href="${href(kind, k)}" class="${k === range ? 'on' : ''}">${v}</a>`).join('')}</div>
        </div>
      </div>
      <div id="top-body"><div class="center-msg" style="min-height:40vh">불러오는 중…</div></div>
    </section>`;

  const body = document.getElementById('top-body');
  let items = [];
  try {
    const first = await getList(`/me/top/${kind}`, { time_range: range, limit: 50 });
    items = first?.items || [];
    // If the page size got capped, follow `next` until we have up to 50.
    let next = first?.next;
    while (next && items.length < 50) {
      const pg = await get(next);
      items = items.concat(pg?.items || []);
      next = pg?.next;
    }
  } catch (e) {
    body.innerHTML = `<p class="err">불러오지 못했습니다: ${esc(e.message)}${e.status ? ` (${e.status})` : ''}</p>`;
    return;
  }
  if (!body.isConnected) return;
  if (!items.length) { body.innerHTML = '<p class="note">아직 데이터가 충분하지 않습니다. 이 기간에 들은 기록이 쌓이면 표시됩니다.</p>'; return; }

  const img = (x, min) => (isArtist ? pick(x.images, min) : artOf(x, min));
  const sub = (x) => (isArtist ? (x.genres || []).slice(0, 2).join(' · ') : artistsOf(x));
  const link = (x) => esc(x.external_urls?.spotify || '#');
  const pic = (x, min) => (img(x, min) ? `<img src="${esc(img(x, min))}" alt="" loading="lazy">` : '<div class="ph"></div>');
  const rc = isArtist ? ' round' : '';
  const [top1, ...others] = items;

  setBackground(img(top1, 300));

  body.innerHTML = `
    <a class="hero1${rc} fade-in" href="${link(top1)}" target="_blank" rel="noopener">
      <div class="pic">${pic(top1, 600)}</div>
      <div>
        <div class="rank">No. 1 · ${RANGES[range]}</div>
        <div class="name">${esc(top1.name)}</div>
        <div class="sub">${esc(sub(top1))}</div>
      </div>
    </a>
    ${others.length ? `<div class="ranks">${others.slice(0, 9).map((x, i) => `
      <a class="rcard${rc} fade-in" style="animation-delay:${i * 50}ms" href="${link(x)}" target="_blank" rel="noopener">
        <span class="num tnum">${i + 2}</span>
        ${pic(x, 300)}
        <div class="n">${esc(x.name)}</div><div class="a">${esc(sub(x))}</div>
      </a>`).join('')}</div>` : ''}
    ${others.length > 9 ? `<div class="rest">${others.slice(9).map((x, i) => `
      <a class="row${rc}" href="${link(x)}" target="_blank" rel="noopener">
        <span class="i tnum">${i + 11}</span>${pic(x, 64)}
        <div><div class="n">${esc(x.name)}</div><div class="a">${esc(sub(x))}</div></div>
      </a>`).join('')}</div>` : ''}`;
}

// ---------- SETUP ----------
function viewSetup(errMsg = '') {
  autoHide = false;
  const uri = auth.redirectUri();
  const insecure = location.protocol !== 'https:' && !['127.0.0.1', '[::1]'].includes(location.hostname);
  $view.innerHTML = `
    <section class="setup"><div class="panel fade-in">
      <h1>Now Playing</h1>
      <p>Spotify에서 재생 중인 곡을 iPad · iPhone 화면에 보기 좋게 띄워 둡니다. 음악은 Spotify 앱에서 재생하세요.</p>
      ${insecure ? `<p class="err">HTTPS 주소(또는 127.0.0.1)에서 열어야 로그인할 수 있습니다.</p>` : ''}
      <ol>
        <li>developer.spotify.com/dashboard 에서 앱을 만들고 <b>Web API</b>를 선택</li>
        <li>Redirect URI에 아래 주소를 그대로 등록
          <code>${esc(uri)}</code></li>
        <li>User Management에 사용할 Spotify 계정 이메일 추가</li>
      </ol>
      <input id="cid" placeholder="Client ID" value="${esc(auth.getClientId())}" autocapitalize="off" autocorrect="off" spellcheck="false">
      <button class="cta" id="go">Spotify로 로그인</button>
      <p class="note">Client Secret은 필요 없습니다. 토큰은 이 브라우저에만 저장되며 읽기 권한만 요청합니다.</p>
      <div id="msg">${errMsg ? `<p class="err">${esc(errMsg)}</p>` : ''}</div>
    </div></section>`;
  document.getElementById('go').onclick = async () => {
    const v = document.getElementById('cid').value.trim();
    const msg = document.getElementById('msg');
    if (!/^[0-9a-zA-Z]{20,64}$/.test(v)) { msg.innerHTML = '<p class="err">올바른 Client ID를 입력해 주세요.</p>'; return; }
    auth.setClientId(v);
    try { await auth.login(); } catch (e) { msg.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  };
}

// ---------- router ----------
function route() {
  cleanup.forEach((f) => f()); cleanup = [];
  const [path, qs = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const loggedIn = auth.isLoggedIn() && auth.getClientId();
  $chrome.hidden = !loggedIn;
  if (!loggedIn) return viewSetup();

  $chrome.querySelectorAll('[data-route]').forEach((a) => a.classList.toggle('on', a.dataset.route === path));
  window.scrollTo(0, 0);
  if (path === 'top') return viewTop(new URLSearchParams(qs));
  if (path !== '') { location.replace('#/'); return; }
  return viewNow();
}

addEventListener('hashchange', route);
addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 8), { passive: true });

(async () => {
  try { await auth.handleCallback(); }
  catch (e) { $chrome.hidden = true; viewSetup(e.message); return; }
  applyWake();
  route();
})();
