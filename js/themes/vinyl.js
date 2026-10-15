// Vinyl — a record spinning on a turntable, album art as the label.
// Pausing stops the platter and lifts the tonearm; the arm creeps inward as the song plays.
export default {
  id: 'vinyl',
  name: 'Vinyl',
  desc: '턴테이블 위에서 돌아가는 LP',
  thumb: { bg: 'radial-gradient(circle at 35% 45%,#3a2a20,#120d0a)', fg: '#f6efe4', accent: '#e8a65d', art: 'disc' },
  css: 'themes/vinyl.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Noto+Serif+KR:wght@400;600&display=swap',
  labels: { playing: 'Now Spinning', paused: 'Paused' },
  markup: () => `
    <section class="np vy">
      <div class="np-inner vy-inner">
        <div class="vy-deck" aria-hidden="true">
          <div class="vy-record">
            <div class="vy-grooves"></div>
            <div class="vy-sheen"></div>
            <div class="vy-label art-stack"><img alt=""><img alt=""></div>
            <i class="vy-hole"></i>
          </div>
          <div class="vy-arm"><i class="vy-rod"></i><i class="vy-head"></i></div>
          <i class="vy-pivot"></i>
        </div>
        <div class="vy-meta">
          <div class="vy-kicker" data-slot="kicker"></div>
          <div class="text-swap" data-swap>
            <div class="vy-title" data-slot="title"></div>
            <div class="vy-artist" data-slot="artist"></div>
            <div class="vy-album" data-slot="album"></div>
          </div>
          <div class="vy-progress">
            <div class="vy-line"><i></i><b></b></div>
            <div class="vy-times tnum"><span data-slot="cur">0:00</span><span data-slot="dur">0:00</span></div>
          </div>
          <div class="vy-status"><span data-slot="status"></span><span data-show="device"> · <span data-slot="device"></span></span></div>
        </div>
      </div>
    </section>`,
};
