# Design notes — 나중에 쓸 것

## ★ 킵: Subway "My Top Tracks" 타이틀 (2026-10-15)

Subway 테마의 Top 화면 제목. 큰 명조체 굵은 글씨에, 뒤쪽 단어만 흐리게 처리한 조합.

```
My Top Tracks
└─────┘ └────┘
 흰색    흐린 회색 (같은 글꼴·같은 굵기로 보임)
```

| 항목 | 값 |
|---|---|
| 글꼴 | `"Shippori Mincho B1", "Noto Serif KR", "Hiragino Mincho ProN", serif` |
| 굵기 | 800 (Google Fonts: `Shippori+Mincho+B1:wght@800`). 뒤 단어는 CSS상 300을 요청하지만 800 굵기만 불러오므로 800으로 그려짐 — 이 "둘 다 굵은" 느낌이 포인트 |
| 크기 | `clamp(34px, 6vw, 64px)` |
| 행간 | `1` |
| 자간 | `0` (기본 테마의 `-.035em`을 Subway가 0으로 덮어씀) |
| 앞 단어 색 | `#fff` |
| 뒤 단어 색 | `var(--faint)` = `rgba(255,255,255,.46)` |
| 배경 | 흐리고 어둡게 깐 장면 이미지 (`blur(2px) saturate(.6) brightness(.38)`) |

재현용 CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&family=Noto+Serif+KR:wght@700;900&display=swap');

.keep-title {
  margin: 0;
  font-family: "Shippori Mincho B1", "Noto Serif KR", "Hiragino Mincho ProN", serif;
  font-weight: 800;
  font-size: clamp(34px, 6vw, 64px);
  line-height: 1;
  letter-spacing: 0;
  color: #fff;
}
.keep-title span { color: rgba(255,255,255,.46); }
```

```html
<h1 class="keep-title">My Top <span>Tracks</span></h1>
```

현재 코드 위치: `style.css`의 `.top-head h1` + `themes/subway.css`의 `html[data-theme="subway"] .top-head h1`.
