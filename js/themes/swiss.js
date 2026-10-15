// Swiss — International Typographic Style: paper ground, one red, a strict grid,
// and the song title set as large as it fits (sized from --tl).
export default {
  id: 'swiss',
  name: 'Swiss',
  desc: '밝은 종이 바탕, 아주 큰 제목, 빨강 하나',
  thumb: { bg: '#f3f2ee', fg: '#111', accent: '#e3311d', art: 'square' },
  css: 'themes/swiss.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&display=swap',
  labels: { playing: 'Now Playing', paused: 'Paused' },
  markup: () => `
    <section class="np sw">
      <div class="np-inner sw-inner">
        <div class="sw-l1"><span class="sw-mark"></span><span data-slot="status"></span></div>
        <div class="sw-l2" data-swap><span data-slot="artist"></span><span class="sw-dim" data-slot="album"></span></div>
        <div class="sw-l3 sw-dim"><span data-slot="kicker"></span><span data-show="device" data-slot="device"></span></div>
        <div class="sw-art art-stack" aria-hidden="true"><img alt=""><img alt=""></div>
        <div class="sw-title" data-swap><span data-slot="title"></span><span class="sw-dot">.</span></div>
        <div class="sw-progress">
          <div class="sw-line"><i></i></div>
          <div class="sw-times tnum"><span data-slot="cur">0:00</span><span class="sw-dim" data-slot="dur">0:00</span></div>
        </div>
      </div>
    </section>`,
};
