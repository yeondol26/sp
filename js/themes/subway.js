// Subway — one still scene fills the screen (a night train, filtered like an old TV broadcast).
// No album art: a stack of short lines at the top-left, set in the kept Top-title style
// (Shippori Mincho B1 800 — see DESIGN_NOTES.md): title, labels and year white; artist, album, times and device light grey; no text shadow.
// The scene is drawn on #bg by themes/subway.css, so the idle and Top screens share it.
export default {
  id: 'subway',
  name: 'Subway',
  desc: '밤 열차 장면 위에 자막 한 줄',
  thumb: { bg: 'linear-gradient(160deg,#2f5560,#16262c)', fg: '#fff', accent: '#ffffff', art: 'mono' },
  css: 'themes/subway.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&family=Noto+Serif+KR:wght@700;900&display=swap',
  labels: { playing: '', paused: '一時停止' },
  // One short line per item, stacked like a message typed line by line.
  // Album mode: the album first, then where we are in it; two bars, track then album.
  albumMarkup: () => `
    <section class="np sb sb-album">
      <div class="np-inner sb-top">
        <div class="sb-l sb-title" data-slot="title"></div>
        <div class="sb-l sb-v" data-slot="artist"></div>
        <div class="sb-l sb-from tnum" data-show="album"><span class="sb-v" data-slot="trackcount"></span> <span class="sb-k">tracks</span> <span class="sb-k">·</span> <span class="sb-v" data-slot="adur"></span><span class="sb-k sb-year" data-slot="year"></span></div>
        <div data-swap>
          <div class="sb-l tnum sb-gap"><span class="sb-k">Track</span> <span class="sb-v" data-slot="trackpos"></span></div>
          <div class="sb-l"><span class="sb-k">Now</span> <span class="sb-v" data-slot="track"></span></div>
        </div>
        <div class="sb-bar"><i></i></div>
        <div class="sb-l tnum"><span class="sb-k">delta time</span> <span class="sb-v" data-slot="cur">0:00</span></div>
        <div class="sb-l tnum"><span class="sb-v" data-slot="left">0:00</span> <span class="sb-k">until END</span></div>
        <div data-show="album">
          <div class="sb-segs" data-segs></div>
          <div class="sb-l tnum"><span class="sb-k">album time</span> <span class="sb-v" data-slot="acur">0:00</span></div>
          <div class="sb-l tnum"><span class="sb-v" data-slot="aleft">0:00</span> <span class="sb-k">until END</span></div>
        </div>
        <div class="sb-l sb-gap" data-show="device"><span class="sb-k">Synced w/</span> <span class="sb-v" data-slot="device"></span></div>
        <div class="sb-l sb-status" data-slot="status"></div>
      </div>
    </section>`,
  markup: () => `
    <section class="np sb">
      <div class="np-inner sb-top">
        <div class="sb-head" data-swap>
          <div class="sb-l sb-title" data-slot="title"></div>
          <div class="sb-l sb-v" data-slot="artist"></div>
          <div class="sb-l sb-from"><span class="sb-k">From</span> <span class="sb-v" data-slot="album"></span><span class="sb-k sb-year" data-slot="year"></span></div>
        </div>
        <div class="sb-bar"><i></i></div>
        <div class="sb-l tnum"><span class="sb-k">delta time</span> <span class="sb-v" data-slot="cur">0:00</span></div>
        <div class="sb-l tnum"><span class="sb-v" data-slot="left">0:00</span> <span class="sb-k">until END</span></div>
        <div class="sb-l" data-show="device"><span class="sb-k">Synced w/</span> <span class="sb-v" data-slot="device"></span></div>
        <div class="sb-l sb-status" data-slot="status"></div>
      </div>
    </section>`,
};
