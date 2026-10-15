// Vinyl — a colored record sliding out of its sleeve. The record is pressed in the cover's
// two dominant colors (marbled), the sleeve is the album art. Pausing stops the spin and
// tucks the record back into the sleeve. Type is set like liner notes.
export default {
  id: 'vinyl',
  name: 'Vinyl',
  desc: '앨범 슬리브에서 나온 컬러 레코드',
  thumb: { bg: 'radial-gradient(circle at 35% 45%,#3a2a20,#120d0a)', fg: '#f6efe4', accent: '#e8a65d', art: 'disc' },
  css: 'themes/vinyl.css',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Noto+Serif+KR:wght@400;600&display=swap',
  labels: { playing: '33⅓ RPM', paused: 'Paused' },
  markup: () => `
    <section class="np vy">
      <div class="np-inner vy-inner">
        <div class="vy-deck" aria-hidden="true">
          <div class="vy-record">
            <div class="vy-disc">
              <i class="vy-marble"></i>
              <i class="vy-grooves"></i>
              <div class="vy-label art-stack"><img alt=""><img alt=""></div>
            </div>
            <i class="vy-sheen"></i>
            <i class="vy-hole"></i>
          </div>
          <div class="vy-sleeve art-stack"><img alt=""><img alt=""><i class="vy-sleeve-edge"></i></div>
        </div>
        <div class="vy-meta">
          <div class="vy-side">Side A <span class="vy-dash"></span> No. <span data-slot="trackno"></span></div>
          <div class="text-swap" data-swap>
            <div class="vy-title" data-slot="title"></div>
            <div class="vy-artist" data-slot="artist"></div>
            <div class="vy-rule"></div>
            <div class="vy-album" data-slot="albumyear"></div>
          </div>
          <div class="vy-progress">
            <div class="vy-line"><i></i></div>
            <div class="vy-times tnum"><span data-slot="cur">0:00</span><span data-slot="dur">0:00</span></div>
          </div>
          <div class="vy-status"><i class="vy-dot"></i><span data-slot="status"></span><span data-show="device"> · <span data-slot="device"></span></span></div>
        </div>
      </div>
    </section>`,
};
