// Terminal — phosphor CRT: monospace text, scanlines, a block-character progress bar.
export default {
  id: 'terminal',
  name: 'Terminal',
  desc: 'CRT 모니터, 고정폭 글꼴, 스캔라인',
  thumb: { bg: '#060a07', fg: '#5dff9a', accent: '#5dff9a', art: 'mono' },
  css: 'themes/terminal.css',
  fonts: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Nanum+Gothic+Coding:wght@400;700&display=swap',
  labels: { playing: 'PLAYING', paused: 'PAUSED' },
  markup: () => `
    <section class="np tm">
      <div class="np-inner tm-inner">
        <div class="tm-art art-stack" aria-hidden="true"><img alt=""><img alt=""><i class="tm-tint"></i></div>
        <div class="tm-meta">
          <div class="tm-dim">~ $ spotify --now-playing</div>
          <div class="text-swap" data-swap>
            <div class="tm-title" data-slot="title"></div>
            <div class="tm-row"><span class="tm-k">artist ..</span><span class="tm-v" data-slot="artist"></span></div>
            <div class="tm-row"><span class="tm-k">album ...</span><span class="tm-v" data-slot="album"></span></div>
          </div>
          <div class="tm-row" data-show="device"><span class="tm-k">device ..</span><span class="tm-v" data-slot="device"></span></div>
          <div class="tm-row"><span class="tm-k">status ..</span><span class="tm-v">[ <span data-slot="status"></span> ]</span></div>
          <div class="tm-bar" data-slot="textbar"></div>
          <div class="tm-dim tnum"><span data-slot="cur">0:00</span> / <span data-slot="dur">0:00</span> &nbsp;(<span data-slot="pct">0%</span>)</div>
          <div class="tm-prompt">~ $ <i class="tm-cursor"></i></div>
        </div>
      </div>
      <div class="tm-scan" aria-hidden="true"></div>
    </section>`,
};
