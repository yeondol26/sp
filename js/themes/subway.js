// Subway — one still scene fills the screen (a night train, filtered like an old TV broadcast).
// No album art: a stack of short lines at the top-left, written like someone typing.
// The scene is drawn on #bg by themes/subway.css, so the idle and Top screens share it.
export default {
  id: 'subway',
  name: 'Subway',
  desc: '밤 열차 장면 위에 자막 한 줄',
  thumb: { bg: 'linear-gradient(160deg,#2f5560,#16262c)', fg: '#fff', accent: '#ffffff', art: 'mono' },
  css: 'themes/subway.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&family=Noto+Serif+KR:wght@700;900&display=swap',
  labels: { playing: '', paused: '잠깐 멈춤…' },
  // One short line per item, stacked like a message typed line by line.
  markup: () => `
    <section class="np sb">
      <div class="np-inner sb-top">
        <div class="sb-head" data-swap>
          <div class="sb-l sb-title" data-slot="title"></div>
          <div class="sb-l sb-artist"><span data-slot="artist"></span>…</div>
          <div class="sb-l sb-dim">앨범 <span data-slot="albumyear"></span></div>
        </div>
        <div class="sb-bar"><i></i></div>
        <div class="sb-l sb-dim tnum"><span data-slot="cur">0:00</span> 지나는 중…</div>
        <div class="sb-l sb-dim tnum">남은 시간 <span data-slot="left">0:00</span></div>
        <div class="sb-l sb-dim" data-show="device"><span data-slot="device"></span>에서 듣는 중</div>
        <div class="sb-l sb-status" data-slot="status"></div>
      </div>
    </section>`,
};
