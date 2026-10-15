// Subway — one still scene fills the screen (a night train, filtered like an old TV broadcast).
// No album art: title, time and a hairline bar along the top, as in the canvas mockup.
// The scene is drawn on #bg by themes/subway.css, so the idle and Top screens share it.
export default {
  id: 'subway',
  name: 'Subway',
  desc: '밤 열차 장면 위에 자막 한 줄',
  thumb: { bg: 'linear-gradient(160deg,#2f5560,#16262c)', fg: '#fff', accent: '#ffffff', art: 'mono' },
  css: 'themes/subway.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&family=Noto+Serif+KR:wght@700;900&display=swap',
  labels: { playing: '', paused: '' },
  // Layout follows the canvas mockup: title — artist and the time on one line at the top,
  // a hairline bar under it (on a phone, the times sit under the bar).
  markup: () => `
    <section class="np sb">
      <div class="np-inner sb-top">
        <div class="sb-row">
          <div class="sb-line" data-swap><span class="sb-title" data-slot="title"></span> <span class="sb-artist">— <span data-slot="artist"></span></span></div>
          <div class="sb-time tnum"><span data-slot="cur">0:00</span> / <span data-slot="dur">0:00</span></div>
        </div>
        <div class="sb-bar"><i></i></div>
        <div class="sb-times tnum"><span data-slot="cur">0:00</span><span data-slot="dur">0:00</span></div>
      </div>
    </section>`,
};
