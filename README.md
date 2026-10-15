# Spotify Viewer (iPad / iPhone)

Spotify Web API로 **읽기 전용** 정보를 보여주는 정적 웹앱입니다. 음악 재생 기능은 없습니다(Web Playback SDK 미사용).

## 기능
- **Now Playing**: Spotify에서 재생 중인 곡을 큰 앨범 아트로 표시. 앨범 아트를 흐리게 한 배경이 천천히 움직이고 곡이 바뀌면 부드럽게 전환됨
  - 가로(iPad 가로 · iPhone 가로): 아트 왼쪽, 정보 오른쪽 / 세로: 위아래 배치
  - 일시정지 시 아트가 살짝 작아지고 채도가 낮아짐, 재생 기기 이름 표시
  - 재생 중이 아닐 때는 큰 시계 + 마지막으로 들은 곡
  - 상단 버튼은 3.5초 뒤 자동으로 숨겨짐(화면을 터치하면 다시 표시)
  - 화면 켜두기(Wake Lock), 전체 화면(iPad만), OLED 번인 방지용 미세 이동
- **Top**: 내 Top 곡 / 아티스트 (최근 4주 · 6개월 · 약 1년). 1위는 크게, 2–10위는 큰 순위 숫자, 11위 이하는 목록

## 테마
상단 🎨 버튼으로 고르며, 고른 테마는 이 브라우저에 기억됩니다.

| 테마 | 설명 |
|---|---|
| Aurora (기본) | 흐린 앨범 아트 배경, 굵은 제목 |
| Vinyl | 앨범 슬리브에서 빠져나온 컬러 레코드(커버의 두 주요 색으로 마블 무늬). 일시정지하면 회전이 멈추고 슬리브 안으로 들어감 |
| Swiss | 밝은 종이 바탕에 아주 큰 제목(화면 폭에 맞춰 한 줄, 길면 균형 잡힌 두 줄), 격자 정렬, 빨강 하나 |
| Subway | 밤 열차 장면 한 장이 화면 전체(필름 그레인·스캔라인·비네팅, 아주 느린 확대·이동). 왼쪽 위에 항목마다 한 줄씩 쌓은 글(제목 / 아티스트 / From 앨범 · 연도 / 진행 바 / 1:18 delta time / 2:50 until END / Synced w/ 기기), 킵해 둔 Top 제목 서체(Shippori Mincho B1 800). 제목·값(아티스트·앨범·시간·기기)은 흰색, 라벨은 연한 회색, 그림자 없음, 좁은 행간. 일시정지하면 장면이 어두워지고 "一時停止" 줄이 붙음 |

### 테마 추가하기
1. `js/themes/<id>.js` 작성 — `id`, `name`, `desc`, `thumb`, `markup()` 등 (계약은 `js/themes/aurora.js` 주석 참고)
2. 필요하면 `themes/<id>.css` 작성 — 모든 규칙을 `html[data-theme="<id>"]` 또는 테마 전용 클래스로 범위 지정
3. `js/themes/index.js`의 `THEMES` 배열에 추가

## 설정
1. https://developer.spotify.com/dashboard 에서 앱 생성 (API: **Web API**)
2. 이 폴더를 **HTTPS** 호스팅에 올림 (예: GitHub Pages → `https://<user>.github.io/sp/`)
3. 대시보드의 Redirect URI에 앱 첫 화면에 표시되는 주소를 **정확히 그대로** 등록
4. 앱 첫 화면에 Client ID 입력 → 로그인

로컬 테스트는 `python3 -m http.server 8000 --bind 127.0.0.1` 후 `http://127.0.0.1:8000/` 사용
(Spotify는 HTTP 리디렉트를 루프백 IP에만 허용하며, `localhost`는 쓰지 않는 것을 권장).

## 알아둘 제약 (2025–2026 Spotify 정책)
- Authorization Code + **PKCE** 사용 (Implicit Grant는 폐지됨, Client Secret 불필요)
- 개발 모드 앱: 앱 소유자 **Premium 필수**, 신규 앱 사용자 최대 5명(대시보드 User Management에 등록 필요)
- 2026년 2월 변경으로 일부 엔드포인트/필드가 제거됨. 플레이리스트의 `tracks`→`items`, `track`→`item` 이름 변경은 두 형식 모두 처리함
- 아티스트 앨범 목록, 타인 플레이리스트 곡 목록 등은 403/404가 날 수 있으며, 이 경우 화면에 안내 문구가 표시됨
- Refresh token은 최초 인증 후 6개월이 지나면 만료 → 다시 로그인 필요

## 구조
```
index.html   앱 셸
style.css    반응형 스타일
js/auth.js   PKCE 로그인 / 토큰 갱신
js/api.js    GET 전용 API 래퍼 (401 갱신, 429 Retry-After 재시도)
js/app.js    Now Playing / Top 화면, 배경·색 추출, 테마 선택, 라우터
js/themes/   테마별 화면 구조 (index.js = 목록)
themes/      테마별 스타일
```
