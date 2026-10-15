// Aurora — blurred, drifting album-art background; big artwork + bold sans type.
//
// Theme contract (all optional except id/name/markup):
//   id, name, desc        identity shown in the theme picker
//   thumb                 { bg, fg, accent, art: 'square' | 'disc' | 'mono' } for the picker preview
//   css                   stylesheet path, loaded when the theme is selected
//   fonts                 Google Fonts css2 URL
//   labels                { playing, paused } status text
//   markup()              Now Playing HTML. The app fills these hooks:
//     [data-slot=title|artist|album|albumyear|status|device|kicker|trackno|year|cur|dur|pct|textbar]  text
//     <html> attrs: data-theme, data-view (now|top), data-playback (playing|paused|idle)
//     CSS vars on :root: --accent (vivid), --pal1/--pal2 (two dominant cover colors), all 'r g b'
//     [data-show=device]   hidden when no device name
//     [data-swap]          faded out/in on track change (any number)
//     [data-fit]           title box sized to fit: its CSS font-size is the max, --fit-min the floor;
//                          contains [data-slot=title] and optionally a [data-fit-suffix]
//     .art-stack > img×2   artwork crossfade (any number of stacks)
//     .np                  gets .paused and CSS var --p (0..1 progress)
//     .np-inner            nudged a few px every minute (anti burn-in)
const DEVICE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>';

export default {
  id: 'aurora',
  name: 'Aurora',
  desc: '흐린 앨범 아트 배경, 굵은 제목',
  thumb: { bg: 'linear-gradient(135deg,#5a2a4a,#1d1a3a)', fg: '#fff', accent: '#ff6a7a', art: 'square' },
  labels: { playing: 'Now Playing', paused: 'Paused' },
  markup: () => `
    <section class="np au">
      <div class="np-inner">
        <div class="art-wrap art-stack"><div class="art-ph"></div><img alt=""><img alt=""></div>
        <div class="meta">
          <div class="status"><span class="eq"><i></i><i></i><i></i></span><span data-slot="status"></span></div>
          <div class="text-swap" data-swap>
            <div class="title" data-slot="title"></div>
            <div class="artist" data-slot="artist"></div>
            <div class="album" data-slot="album"></div>
          </div>
          <div class="progress">
            <div class="track-line"><i></i></div>
            <div class="times tnum"><span data-slot="cur">0:00</span><span data-slot="dur">0:00</span></div>
          </div>
          <div class="device" data-show="device">${DEVICE_ICON}<span data-slot="device"></span></div>
        </div>
      </div>
    </section>`,
};
