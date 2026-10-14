# Spotify Viewer (iPad / iPhone)

Spotify Web API로 **읽기 전용** 정보를 보여주는 정적 웹앱입니다. 음악 재생 기능은 없습니다(Web Playback SDK 미사용).

## 기능
- **홈**: 지금 재생 중인 곡(5초마다 갱신, 진행 바), 최근 재생 50곡
- **Top**: 내 Top 곡 / 아티스트 (최근 4주 · 6개월 · 약 1년)
- **라이브러리**: 플레이리스트, 좋아요 표시한 곡, 저장한 앨범, 팔로우한 아티스트
- **검색**: 곡 · 아티스트 · 앨범 · 플레이리스트
- 플레이리스트 / 앨범 / 아티스트 상세 화면, "Spotify에서 열기" 링크
- iPhone은 하단 탭 바, iPad(가로 768px 이상)는 사이드바 레이아웃. 노치/홈 인디케이터 safe-area 대응

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
js/app.js    화면 / 라우터
```
