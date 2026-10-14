import * as auth from './auth.js';
import { get, getList, ApiError, playlistCount, entryOf } from './api.js';

const $view = document.getElementById('view');
const $nav = document.getElementById('nav');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pickImage(images, min = 64) {
  if (!images?.length) return '';
  const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  return (sorted.find((i) => (i.width || 0) >= min) || sorted.at(-1)).url;
}
const imgTag = (images, min, alt = '') => {
  const src = pickImage(images, min);
  return src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '<div class="ph"></div>';
};
// Playlist descriptions can contain HTML entities/markup; render as plain text only.
const plainText = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
const artistsOf = (x) => (x?.artists || []).map((a) => esc(a.name)).join(', ');
const fmtMs = (ms) => {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${Math.floor(m / 1440)}일 전`;
};
const extLink = (obj, label = 'Spotify에서 열기 ↗') =>
  obj?.external_urls?.spotify ? `<a class="ext" href="${esc(obj.external_urls.spotify)}" target="_blank" rel="noopener">${label}</a>` : '';

function errorHtml(e) {
  let hint = '';
  if (e instanceof ApiError) {
    if (e.status === 403) hint = '권한이 없거나(개발 모드 앱의 사용자 미등록, 앱 소유자 Premium 만료 등) 이 엔드포인트를 쓸 수 없는 상태일 수 있습니다.';
    else if (e.status === 404) hint = '항목을 찾을 수 없거나 해당 엔드포인트가 더 이상 제공되지 않을 수 있습니다.';
    else if (e.status === 401) hint = '다시 로그인해 주세요.';
  }
  return `<p class="err">오류: ${esc(e.message)}${e.status ? ` (${e.status})` : ''}</p>${hint ? `<p class="muted small">${hint}</p>` : ''}`;
}

// ---------- row / tile renderers ----------
const trackRow = (t, i, right = '') => !t ? '' : `
  <a class="item" href="${t.album?.id ? `#/album/${t.album.id}` : esc(t.external_urls?.spotify || '#/home')}">
    ${i != null ? `<span class="idx">${i}</span>` : ''}
    ${imgTag(t.album?.images || t.images || t.show?.images, 64, t.name)}
    <div class="meta"><div class="t">${esc(t.name)}</div><div class="s">${artistsOf(t) || esc(t.show?.name || '')}${t.album?.name ? ' · ' + esc(t.album.name) : ''}</div></div>
    <span class="r">${right || fmtMs(t.duration_ms)}</span>
  </a>`;

const albumTrackRow = (t, album) => `
  <a class="item" href="${esc(t.external_urls?.spotify || '#')}" target="_blank" rel="noopener">
    <span class="idx">${t.track_number ?? ''}</span>
    <div class="meta"><div class="t">${esc(t.name)}${t.explicit ? ' <span class="muted small">E</span>' : ''}</div><div class="s">${artistsOf(t) || artistsOf(album)}</div></div>
    <span class="r">${fmtMs(t.duration_ms)}</span>
  </a>`;

const artistRow = (a, i) => !a ? '' : `
  <a class="item round" href="#/artist/${a.id}">
    ${i != null ? `<span class="idx">${i}</span>` : ''}
    ${imgTag(a.images, 64, a.name)}
    <div class="meta"><div class="t">${esc(a.name)}</div><div class="s">${esc((a.genres || []).slice(0, 3).join(', ')) || '아티스트'}</div></div>
  </a>`;

const albumTile = (a) => !a ? '' : `
  <a class="tile" href="#/album/${a.id}">${imgTag(a.images, 300, a.name)}
    <div class="t">${esc(a.name)}</div><div class="s">${(a.release_date || '').slice(0, 4)} · ${artistsOf(a)}</div></a>`;

const playlistTile = (p) => !p ? '' : `
  <a class="tile" href="#/playlist/${p.id}">${imgTag(p.images, 300, p.name)}
    <div class="t">${esc(p.name)}</div><div class="s">${esc(p.owner?.display_name || '')}${playlistCount(p) != null ? ` · ${playlistCount(p)}곡` : ''}</div></a>`;

const artistTile = (a) => !a ? '' : `
  <a class="tile round" href="#/artist/${a.id}">${imgTag(a.images, 300, a.name)}
    <div class="t">${esc(a.name)}</div><div class="s">아티스트</div></a>`;

// Paged list with a "더 보기" button that follows the API's `next` URL.
async function pagedList(container, firstPage, { extract, render, wrapClass = 'list' }) {
  const list = document.createElement('div');
  list.className = wrapClass;
  container.append(list);
  const more = document.createElement('button');
  more.className = 'btn secondary more';
  more.textContent = '더 보기';

  let offset = 0;
  const append = (page) => {
    const { items, next } = extract(page);
    list.insertAdjacentHTML('beforeend', items.map((x, i) => render(x, offset + i + 1)).join(''));
    offset += items.length;
    if (!items.length && offset === 0) list.innerHTML = '<p class="muted">항목이 없습니다.</p>';
    if (next) container.append(more); else more.remove();
    more.onclick = async () => {
      more.disabled = true;
      try { append(await get(next)); } catch (e) { more.insertAdjacentHTML('afterend', errorHtml(e)); more.remove(); }
      more.disabled = false;
    };
  };
  append(firstPage);
}

// ---------- views ----------
let stopTimers = [];
const onLeave = (fn) => stopTimers.push(fn);

function viewSetup() {
  const uri = auth.redirectUri();
  const insecure = location.protocol !== 'https:' && !['127.0.0.1', '[::1]'].includes(location.hostname);
  $view.innerHTML = `
    <h1>Spotify Viewer</h1>
    <p class="muted">Spotify Web API로 내 재생 기록·Top·라이브러리를 읽기 전용으로 보여주는 뷰어입니다. 음악은 재생하지 않습니다.</p>
    ${insecure ? `<p class="err">현재 주소(${esc(location.origin)})는 HTTPS가 아닙니다. Spotify는 HTTPS 또는 루프백(127.0.0.1) 리디렉트 URI만 허용하며, PKCE에 필요한 Web Crypto도 보안 컨텍스트에서만 동작합니다.</p>` : ''}
    <div class="card">
      <h2 style="margin-top:0">1. Spotify 앱 만들기</h2>
      <p class="small muted">developer.spotify.com/dashboard 에서 앱을 만들고, <b>Web API</b>를 선택한 뒤 아래 Redirect URI를 정확히 그대로 등록하세요.</p>
      <code class="box">${esc(uri)}</code>
      <h2>2. Client ID 입력</h2>
      <input type="text" id="cid" placeholder="Client ID" value="${esc(auth.getClientId())}" autocapitalize="off" autocorrect="off" spellcheck="false">
      <p class="small muted">Client Secret은 필요 없습니다(PKCE). Client ID는 이 브라우저에만 저장됩니다.</p>
      <div class="row" style="margin-top:12px"><button class="btn" id="go">Spotify로 로그인</button></div>
      <div id="msg"></div>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const v = document.getElementById('cid').value.trim();
    if (!/^[0-9a-zA-Z]{20,64}$/.test(v)) { document.getElementById('msg').innerHTML = '<p class="err">올바른 Client ID를 입력해 주세요.</p>'; return; }
    auth.setClientId(v);
    try { await auth.login(); } catch (e) { document.getElementById('msg').innerHTML = errorHtml(e); }
  };
}

async function viewHome() {
  $view.innerHTML = `<h1 id="hello">홈</h1>
    <section class="card" id="now"><div class="muted">불러오는 중…</div></section>
    <h2>최근 재생</h2><div id="recent"><div class="spinner">불러오는 중…</div></div>`;

  get('/me').then((me) => {
    const el = document.getElementById('hello');
    if (el && me?.display_name) el.textContent = `${me.display_name}님`;
  }).catch(() => {});

  // Now playing: poll every 5s, interpolate the progress bar locally every second.
  let state = null, fetchedAt = 0;
  const paint = () => {
    const el = document.getElementById('now');
    if (!el) return;
    const it = state?.item;
    if (!it) { el.innerHTML = '<div class="muted">지금 재생 중인 항목이 없습니다.</div>'; return; }
    const dur = it.duration_ms || 0;
    const prog = Math.min(dur, (state.progress_ms || 0) + (state.is_playing ? Date.now() - fetchedAt : 0));
    const album = it.album;
    el.innerHTML = `<div class="now">
      ${imgTag(album?.images || it.images || it.show?.images, 300, it.name)}
      <div class="meta">
        <div class="muted small">${state.is_playing ? '▶ 지금 재생 중' : '❚❚ 일시정지됨'}</div>
        <div class="t">${esc(it.name)}</div>
        <div class="muted">${artistsOf(it) || esc(it.show?.name || '')}</div>
        ${album ? `<a class="small muted" href="#/album/${album.id}">${esc(album.name)}</a>` : ''}
        <div class="bar"><i style="width:${dur ? (prog / dur) * 100 : 0}%"></i></div>
        <div class="time"><span>${fmtMs(prog)}</span><span>${fmtMs(dur)}</span></div>
      </div></div>`;
  };
  const poll = async () => {
    if (document.hidden) return;
    try {
      state = await get('/me/player/currently-playing', { additional_types: 'track,episode' });
      fetchedAt = Date.now();
      paint();
    } catch (e) {
      const el = document.getElementById('now');
      if (el) el.innerHTML = errorHtml(e);
    }
  };
  poll();
  const p = setInterval(poll, 5000);
  const t = setInterval(() => state?.is_playing && paint(), 1000);
  onLeave(() => { clearInterval(p); clearInterval(t); });

  const box = document.getElementById('recent');
  try {
    const page = await getList('/me/player/recently-played', { limit: 50 });
    box.innerHTML = '';
    await pagedList(box, page, {
      extract: (pg) => ({ items: pg?.items || [], next: pg?.next }),
      render: (row) => trackRow(entryOf(row), null, ago(row.played_at)),
    });
  } catch (e) { box.innerHTML = errorHtml(e); }
}

async function viewTop(q) {
  const kind = q.get('kind') === 'artists' ? 'artists' : 'tracks';
  const range = ['short_term', 'medium_term', 'long_term'].includes(q.get('range')) ? q.get('range') : 'short_term';
  const link = (k, r) => `#/top?kind=${k}&range=${r}`;
  $view.innerHTML = `<h1>Top</h1>
    <div class="seg">
      <button class="${kind === 'tracks' ? 'on' : ''}" data-href="${link('tracks', range)}">곡</button>
      <button class="${kind === 'artists' ? 'on' : ''}" data-href="${link('artists', range)}">아티스트</button>
    </div><br>
    <div class="seg">
      <button class="${range === 'short_term' ? 'on' : ''}" data-href="${link(kind, 'short_term')}">최근 4주</button>
      <button class="${range === 'medium_term' ? 'on' : ''}" data-href="${link(kind, 'medium_term')}">최근 6개월</button>
      <button class="${range === 'long_term' ? 'on' : ''}" data-href="${link(kind, 'long_term')}">약 1년</button>
    </div>
    <div id="list"><div class="spinner">불러오는 중…</div></div>`;
  const box = document.getElementById('list');
  try {
    const page = await getList(`/me/top/${kind}`, { time_range: range, limit: 50 });
    box.innerHTML = '';
    await pagedList(box, page, {
      extract: (pg) => ({ items: pg?.items || [], next: pg?.next }),
      render: kind === 'tracks' ? (t, i) => trackRow(t, i) : (a, i) => artistRow(a, i),
    });
  } catch (e) { box.innerHTML = errorHtml(e); }
}

const LIB_TABS = {
  playlists: { label: '플레이리스트', path: '/me/playlists', params: { limit: 50 }, grid: true,
    extract: (pg) => ({ items: pg?.items || [], next: pg?.next }), render: playlistTile },
  tracks: { label: '좋아요 표시한 곡', path: '/me/tracks', params: { limit: 50 },
    extract: (pg) => ({ items: pg?.items || [], next: pg?.next }), render: (row, i) => trackRow(entryOf(row), i) },
  albums: { label: '앨범', path: '/me/albums', params: { limit: 50 }, grid: true,
    extract: (pg) => ({ items: (pg?.items || []).map((r) => r.album), next: pg?.next }), render: albumTile },
  artists: { label: '팔로우한 아티스트', path: '/me/following', params: { type: 'artist', limit: 50 }, grid: true,
    extract: (pg) => ({ items: pg?.artists?.items || [], next: pg?.artists?.next }), render: artistTile },
};

async function viewLibrary(q) {
  const tab = LIB_TABS[q.get('tab')] ? q.get('tab') : 'playlists';
  const cfg = LIB_TABS[tab];
  $view.innerHTML = `<h1>라이브러리</h1>
    <div class="seg">${Object.entries(LIB_TABS).map(([k, v]) =>
      `<button class="${k === tab ? 'on' : ''}" data-href="#/library?tab=${k}">${v.label}</button>`).join('')}</div>
    <div id="list"><div class="spinner">불러오는 중…</div></div>`;
  const box = document.getElementById('list');
  try {
    const page = await getList(cfg.path, cfg.params);
    box.innerHTML = '';
    await pagedList(box, page, { extract: cfg.extract, render: cfg.render, wrapClass: cfg.grid ? 'grid' : 'list' });
  } catch (e) { box.innerHTML = errorHtml(e); }
}

async function viewSearch(q) {
  const term = q.get('q') || '';
  $view.innerHTML = `<h1>검색</h1>
    <form id="sf"><input type="search" id="sq" placeholder="곡, 아티스트, 앨범, 플레이리스트" value="${esc(term)}" enterkeyhint="search"></form>
    <div id="res"></div>`;
  document.getElementById('sf').onsubmit = (ev) => {
    ev.preventDefault();
    const v = document.getElementById('sq').value.trim();
    location.hash = `#/search?q=${encodeURIComponent(v)}`;
  };
  if (!term) { document.getElementById('sq').focus(); return; }
  const box = document.getElementById('res');
  box.innerHTML = '<div class="spinner">검색 중…</div>';
  try {
    // Kept at 10 per type: search page sizes were reportedly reduced in 2026.
    const r = await get('/search', { q: term, type: 'track,artist,album,playlist', limit: 10 });
    const tracks = (r.tracks?.items || []).filter(Boolean);
    const artists = (r.artists?.items || []).filter(Boolean);
    const albums = (r.albums?.items || []).filter(Boolean);
    const pls = (r.playlists?.items || []).filter(Boolean);
    box.innerHTML = `
      ${tracks.length ? `<h2>곡</h2><div class="list">${tracks.map((t) => trackRow(t)).join('')}</div>` : ''}
      ${artists.length ? `<h2>아티스트</h2><div class="grid">${artists.map(artistTile).join('')}</div>` : ''}
      ${albums.length ? `<h2>앨범</h2><div class="grid">${albums.map(albumTile).join('')}</div>` : ''}
      ${pls.length ? `<h2>플레이리스트</h2><div class="grid">${pls.map(playlistTile).join('')}</div>` : ''}
      ${!tracks.length && !artists.length && !albums.length && !pls.length ? '<p class="muted">결과가 없습니다.</p>' : ''}`;
  } catch (e) { box.innerHTML = errorHtml(e); }
}

const backLink = '<a class="back" href="javascript:history.back()">‹ 뒤로</a>';

async function viewPlaylist(id) {
  $view.innerHTML = `${backLink}<div id="hd"><div class="spinner">불러오는 중…</div></div><div id="list"></div>`;
  try {
    const p = await get(`/playlists/${encodeURIComponent(id)}`);
    document.getElementById('hd').innerHTML = `<div class="hero">${imgTag(p.images, 300, p.name)}
      <div><div class="kind">플레이리스트</div><h1>${esc(p.name)}</h1>
      ${p.description ? `<div class="muted small">${esc(plainText(p.description))}</div>` : ''}
      <div class="muted small">${esc(p.owner?.display_name || '')}${playlistCount(p) != null ? ` · ${playlistCount(p)}곡` : ''}</div>
      <div style="margin-top:8px">${extLink(p)}</div></div></div>`;
  } catch (e) { document.getElementById('hd').innerHTML = errorHtml(e); return; }

  const box = document.getElementById('list');
  try {
    let page;
    try { page = await getList(`/playlists/${encodeURIComponent(id)}/items`, { limit: 50 }); }
    catch (e) {
      if (e.status !== 404) throw e;
      page = await getList(`/playlists/${encodeURIComponent(id)}/tracks`, { limit: 50 }); // pre-2026 path
    }
    await pagedList(box, page, {
      extract: (pg) => ({ items: pg?.items || [], next: pg?.next }),
      render: (row, i) => trackRow(entryOf(row), i),
    });
  } catch (e) {
    box.innerHTML = errorHtml(e) + (e.status === 403
      ? '<p class="muted small">개발 모드 앱에서는 다른 사용자가 만든 플레이리스트의 곡 목록 조회가 제한될 수 있습니다.</p>' : '');
  }
}

async function viewAlbum(id) {
  $view.innerHTML = `${backLink}<div id="hd"><div class="spinner">불러오는 중…</div></div><div id="list"></div>`;
  try {
    const a = await get(`/albums/${encodeURIComponent(id)}`);
    const total = a.tracks?.total;
    const durMs = (a.tracks?.items || []).reduce((s, t) => s + (t.duration_ms || 0), 0);
    document.getElementById('hd').innerHTML = `<div class="hero">${imgTag(a.images, 300, a.name)}
      <div><div class="kind">${esc(a.album_type || '앨범')}</div><h1>${esc(a.name)}</h1>
      <div class="muted small">${(a.artists || []).map((ar) => `<a href="#/artist/${ar.id}">${esc(ar.name)}</a>`).join(', ')}
        · ${esc(a.release_date || '')}${total != null ? ` · ${total}곡` : ''}${total === a.tracks?.items?.length ? ` · ${Math.round(durMs / 60000)}분` : ''}</div>
      <div style="margin-top:8px">${extLink(a)}</div></div></div>`;
    await pagedList(document.getElementById('list'), a.tracks, {
      extract: (pg) => ({ items: pg?.items || [], next: pg?.next }),
      render: (t) => albumTrackRow(t, a),
    });
    if (a.copyrights?.length) document.getElementById('list').insertAdjacentHTML('beforeend',
      `<p class="muted small" style="margin-top:20px">${a.copyrights.map((c) => esc(c.text)).join('<br>')}</p>`);
  } catch (e) { document.getElementById('hd').innerHTML = errorHtml(e); }
}

async function viewArtist(id) {
  $view.innerHTML = `${backLink}<div id="hd"><div class="spinner">불러오는 중…</div></div><div id="list"></div>`;
  try {
    const a = await get(`/artists/${encodeURIComponent(id)}`);
    document.getElementById('hd').innerHTML = `<div class="hero round">${imgTag(a.images, 300, a.name)}
      <div><div class="kind">아티스트</div><h1>${esc(a.name)}</h1>
      ${a.genres?.length ? `<div class="muted small">${esc(a.genres.join(', '))}</div>` : ''}
      <div style="margin-top:8px">${extLink(a)}</div></div></div>`;
  } catch (e) { document.getElementById('hd').innerHTML = errorHtml(e); return; }

  const box = document.getElementById('list');
  box.innerHTML = '<h2>디스코그래피</h2>';
  try {
    const page = await getList(`/artists/${encodeURIComponent(id)}/albums`, { include_groups: 'album,single,compilation', limit: 50 });
    await pagedList(box, page, {
      extract: (pg) => ({ items: pg?.items || [], next: pg?.next }),
      render: albumTile, wrapClass: 'grid',
    });
  } catch (e) {
    box.insertAdjacentHTML('beforeend', errorHtml(e) +
      '<p class="muted small">이 앱 등급에서는 아티스트 앨범 목록 엔드포인트가 제공되지 않을 수 있습니다. 검색 탭에서 아티스트 이름으로 앨범을 찾아보세요.</p>');
  }
}

function viewSettings() {
  const scopes = auth.grantedScopes();
  $view.innerHTML = `<h1>설정</h1>
    <div class="card">
      <p class="small muted">Client ID</p><code class="box">${esc(auth.getClientId())}</code>
      <p class="small muted" style="margin-top:14px">Redirect URI</p><code class="box">${esc(auth.redirectUri())}</code>
      <p class="small muted" style="margin-top:14px">허용된 권한(scope)</p>
      <div class="small">${scopes.map(esc).join('<br>') || '-'}</div>
      <div class="row" style="margin-top:18px">
        <button class="btn secondary" id="relogin">다시 로그인</button>
        <button class="btn secondary" id="logout">로그아웃</button>
      </div>
    </div>
    <p class="muted small" style="margin-top:16px">모든 요청은 읽기 전용(GET)이며, 토큰은 이 브라우저의 localStorage에만 저장됩니다.</p>`;
  document.getElementById('logout').onclick = () => { auth.logout(); location.hash = '#/'; route(); };
  document.getElementById('relogin').onclick = () => auth.login();
}

// ---------- router ----------
async function route() {
  stopTimers.forEach((f) => f()); stopTimers = [];
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const [name, id] = path.split('/');
  const q = new URLSearchParams(qs);

  const loggedIn = auth.isLoggedIn() && auth.getClientId();
  $nav.hidden = !loggedIn;
  document.body.classList.toggle('has-nav', !!loggedIn);
  if (!loggedIn) return viewSetup();

  const tab = { '': 'home', home: 'home', top: 'top', library: 'library', search: 'search', settings: 'settings' }[name] || '';
  $nav.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  window.scrollTo(0, 0);

  switch (name) {
    case '': case 'home': return viewHome();
    case 'top': return viewTop(q);
    case 'library': return viewLibrary(q);
    case 'search': return viewSearch(q);
    case 'settings': return viewSettings();
    case 'playlist': return viewPlaylist(id);
    case 'album': return viewAlbum(id);
    case 'artist': return viewArtist(id);
    default: location.hash = '#/home';
  }
}

// Segmented controls navigate via data-href.
$view.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-href]');
  if (b) location.hash = b.dataset.href;
});

window.addEventListener('hashchange', route);

(async () => {
  try {
    await auth.handleCallback();
  } catch (e) {
    viewSetup();
    $view.insertAdjacentHTML('beforeend', errorHtml(e));
    return;
  }
  route();
})();
